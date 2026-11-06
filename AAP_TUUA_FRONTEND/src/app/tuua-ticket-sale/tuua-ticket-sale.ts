import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { finalize, forkJoin, map, switchMap, throwError } from 'rxjs';
import {
  Feature,
  Flight,
  TuuaSaleContext,
  TuuaSalePricing,
  TuuaSalesOperation,
  TuuaTicketSaleRequest,
} from '../models';
import { ActiveCashierSessionService } from '../services/active-cashier-session.service';
import { TuuaSalesOperationService } from '../services/tuua-sales-operation.service';
import { twoDecimals } from '../validators/two-decimals.validator';

class SessionClosedError extends Error {}

const CashPaymentValue = 'E';
const DefaultDocumentTypeValue = '56';
const DefaultSaleTypeValue = 'normal';

@Component({
  selector: 'app-tuua-ticket-sale',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './tuua-ticket-sale.html',
  styleUrls: ['../catalogs/catalog-crud.css', './tuua-ticket-sale.css'],
})
export class TuuaTicketSale implements OnInit {
  private static readonly MaxAmount = 9999999999.99;
  private static readonly MaxTickets = 100;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activeSession = inject(ActiveCashierSessionService);
  private readonly salesService = inject(TuuaSalesOperationService);

  protected readonly context = signal<TuuaSaleContext | null>(null);
  protected readonly flights = signal<Flight[]>([]);
  protected readonly pricing = signal<TuuaSalePricing | null>(null);
  protected readonly result = signal<TuuaSalesOperation | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingFlight = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isDownloading = signal(false);
  protected readonly isSendingEmail = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pricingError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    flight_type_id: this.fb.control<number | null>(null, Validators.required),
    flight_id: this.fb.control<string | null>(null, Validators.required),
    titular_passenger_name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(100),
    ]),
    passenger_email: this.fb.nonNullable.control('', [Validators.email, Validators.maxLength(100)]),
    ticket_quantity: this.fb.nonNullable.control(1, [
      Validators.required,
      Validators.min(1),
      Validators.max(TuuaTicketSale.MaxTickets),
      Validators.pattern(/^\d+$/),
    ]),
    document_type_id: this.fb.control<number | null>(null, Validators.required),
    sale_type_id: this.fb.control<number | null>(null, Validators.required),
    payment_type_id: this.fb.control<number | null>(null, Validators.required),
    cash_payment_currency_id: this.fb.control<number | null>(null),
    cash_amount_payed: this.fb.control<number | null>(null),
    cash_change_currency_id: this.fb.control<number | null>(null),
  });

  protected readonly emailControl = this.fb.nonNullable.control('', [
    Validators.required,
    Validators.email,
  ]);

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    const ctx = this.context();
    if (!ctx) return index;
    for (const list of [
      ctx.document_types,
      ctx.sale_types,
      ctx.payment_types,
      ctx.currencies,
      ctx.flight_types,
    ]) {
      for (const feature of list) index.set(feature.id, feature);
    }
    return index;
  });

  protected readonly selectedPaymentType = computed(() => {
    const id = this.formValue().payment_type_id;
    return id === null ? null : (this.featureIndex().get(id) ?? null);
  });
  protected readonly isCash = computed(
    () => this.selectedPaymentType()?.feature_value === CashPaymentValue,
  );
  protected readonly priceCurrencyId = computed(() => this.pricing()?.tuua_price.currency_id ?? null);
  protected readonly nationalCurrencyId = computed(() => this.context()?.national_currency_id ?? null);

  protected readonly quantity = computed(() => {
    const qty = Number(this.formValue().ticket_quantity);
    return Number.isInteger(qty) && qty > 0 ? qty : 0;
  });
  protected readonly unitPrice = computed(() => this.pricing()?.tuua_price.price ?? 0);
  protected readonly total = computed(() => TuuaTicketSale.round2(this.unitPrice() * this.quantity()));
  protected readonly subtotal = computed(() =>
    TuuaTicketSale.round2(this.total() / (1 + (this.context()?.igv_rate ?? 0))),
  );
  protected readonly igvAmount = computed(() =>
    TuuaTicketSale.round2((this.context()?.igv_rate ?? 0) * this.subtotal()),
  );

  // Moneda en la que se cobra: en efectivo la elegida; tarjeta, YAPE y PLIN siempre en moneda nacional.
  protected readonly chargeCurrencyId = computed(() =>
    this.isCash() ? this.formValue().cash_payment_currency_id : this.nationalCurrencyId(),
  );
  // Importe a cobrar en la moneda de cobro (tasa de venta si hay conversión).
  protected readonly amountDue = computed(() => {
    const pricing = this.pricing();
    const chargeCurrency = this.chargeCurrencyId();
    if (!pricing || chargeCurrency === null) return null;
    if (chargeCurrency === pricing.tuua_price.currency_id) return this.total();
    return TuuaTicketSale.round2(this.total() * pricing.exchange_rate.sales_exchange_rate);
  });
  protected readonly cashPaid = computed(() => {
    const paid = this.formValue().cash_amount_payed;
    return paid === null || paid === undefined || `${paid}` === '' ? null : Number(paid);
  });
  // Vuelto en la moneda de pago.
  protected readonly change = computed(() => {
    const due = this.amountDue();
    const paid = this.cashPaid();
    if (due === null || paid === null || paid < due) return null;
    return TuuaTicketSale.round2(paid - due);
  });
  // Vuelto convertido a moneda nacional (tasa de compra) cuando se pagó en moneda extranjera.
  protected readonly changeInNational = computed(() => {
    const change = this.change();
    const pricing = this.pricing();
    const paymentCurrency = this.formValue().cash_payment_currency_id;
    if (change === null || !pricing || paymentCurrency === this.nationalCurrencyId()) return null;
    return TuuaTicketSale.round2(change * pricing.exchange_rate.purchase_exchange_rate);
  });
  protected readonly changeDelivered = computed(() => {
    const changeCurrency = this.formValue().cash_change_currency_id;
    if (changeCurrency !== null && changeCurrency === this.nationalCurrencyId()) {
      return this.changeInNational() ?? this.change();
    }
    return this.change();
  });
  protected readonly insufficientPayment = computed(() => {
    const due = this.amountDue();
    const paid = this.cashPaid();
    return this.isCash() && due !== null && paid !== null && paid < due;
  });

  protected readonly paymentCurrencies = computed(() =>
    this.uniqueCurrencies([this.priceCurrencyId(), this.nationalCurrencyId()]),
  );
  protected readonly changeCurrencies = computed(() =>
    this.uniqueCurrencies([this.formValue().cash_payment_currency_id, this.nationalCurrencyId()]),
  );

  constructor() {
    const controls = this.form.controls;
    controls.flight_type_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((flightTypeId) => this.onFlightTypeChange(flightTypeId));
    controls.payment_type_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((paymentTypeId) => this.updateCashValidators(paymentTypeId));
    controls.cash_payment_currency_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currencyId) =>
        controls.cash_change_currency_id.setValue(currencyId, { emitEvent: false }),
      );
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.activeSession
      .getOpenSession()
      .pipe(
        switchMap((session) =>
          session?.id
            ? this.salesService.getSaleContext()
            : throwError(() => new SessionClosedError('No tienes un turno abierto.')),
        ),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (context) => {
          this.context.set(context);
          this.resetForm();
        },
        error: (error: unknown) => {
          this.context.set(null);
          if (!(error instanceof SessionClosedError)) this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private onFlightTypeChange(flightTypeId: number | null): void {
    this.form.controls.flight_id.setValue(null);
    this.flights.set([]);
    this.pricing.set(null);
    this.pricingError.set(null);
    if (flightTypeId === null) return;

    this.isLoadingFlight.set(true);
    forkJoin({
      flights: this.salesService.getFlightsForSale(flightTypeId),
      pricing: this.salesService.getSalePricing(flightTypeId),
    })
      .pipe(finalize(() => this.isLoadingFlight.set(false)))
      .subscribe({
        next: ({ flights, pricing }) => {
          this.flights.set(flights ?? []);
          this.pricing.set(pricing);
          this.form.controls.cash_payment_currency_id.setValue(pricing.tuua_price.currency_id);
        },
        error: (error: unknown) => this.pricingError.set(this.resolveError(error)),
      });
  }

  // Se usa el valor del control: valueChanges del control se emite antes que el del formulario.
  private updateCashValidators(paymentTypeId: number | null): void {
    const { cash_payment_currency_id, cash_amount_payed, cash_change_currency_id } =
      this.form.controls;
    const isCash =
      paymentTypeId !== null &&
      this.featureIndex().get(paymentTypeId)?.feature_value === CashPaymentValue;
    if (isCash) {
      cash_payment_currency_id.setValidators(Validators.required);
      cash_change_currency_id.setValidators(Validators.required);
      cash_amount_payed.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(TuuaTicketSale.MaxAmount),
        twoDecimals,
      ]);
    } else {
      cash_payment_currency_id.clearValidators();
      cash_change_currency_id.clearValidators();
      cash_amount_payed.clearValidators();
      cash_amount_payed.setValue(null, { emitEvent: false });
    }
    for (const control of [cash_payment_currency_id, cash_amount_payed, cash_change_currency_id]) {
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  protected submit(): void {
    if (this.isSaving() || this.result()) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.form.invalid || !this.pricing() || this.quantity() === 0) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.insufficientPayment()) {
      this.errorMessage.set('El monto recibido es menor al importe a cobrar.');
      return;
    }

    const context = this.context();
    const raw = this.form.getRawValue();
    if (
      !context?.session.id ||
      raw.flight_type_id === null ||
      raw.flight_id === null ||
      raw.document_type_id === null ||
      raw.sale_type_id === null ||
      raw.payment_type_id === null
    ) {
      return;
    }

    const isCash = this.isCash();
    const sessionId = context.session.id;
    const request: TuuaTicketSaleRequest = {
      cashier_machine_session_id: sessionId,
      document_type_id: raw.document_type_id,
      sale_type_id: raw.sale_type_id,
      flight_type_id: raw.flight_type_id,
      flight_id: raw.flight_id,
      titular_passenger_name: raw.titular_passenger_name.trim(),
      passenger_email: raw.passenger_email.trim() || null,
      ticket_quantity: this.quantity(),
      payment_type_id: raw.payment_type_id,
      cash_payment_currency_id: isCash ? raw.cash_payment_currency_id : null,
      cash_amount_payed: isCash ? Number(raw.cash_amount_payed) : null,
      cash_change_currency_id: isCash ? raw.cash_change_currency_id : null,
    };

    this.isSaving.set(true);
    // Se vuelve a validar el turno para no registrar ventas en un turno que ya se cerró.
    this.activeSession
      .getOpenSession()
      .pipe(
        switchMap((current) =>
          current?.id === sessionId
            ? this.salesService.sell(request)
            : throwError(
                () =>
                  new SessionClosedError(
                    'El turno ya no está abierto. Abre un nuevo turno para vender tickets.',
                  ),
              ),
        ),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (sale) => {
          this.result.set(sale);
          this.form.disable({ emitEvent: false });
          this.emailControl.setValue(sale.passenger_email ?? '');
          this.successMessage.set(
            `Venta registrada: ${sale.tickets.length} ticket(s) emitido(s). Se generaron los movimientos de caja.`,
          );
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
          if (error instanceof SessionClosedError) this.context.set(null);
        },
      });
  }

  protected newSale(): void {
    this.result.set(null);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.form.enable({ emitEvent: false });
    this.resetForm();
  }

  protected downloadPdf(): void {
    const sale = this.result();
    if (!sale?.id || this.isDownloading()) return;
    this.isDownloading.set(true);
    this.salesService
      .downloadTicketsPdf(sale.id)
      .pipe(finalize(() => this.isDownloading.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `tickets-tuua-${sale.tickets[0]?.serial ?? ''}-${sale.tickets[0]?.sequential_number ?? sale.id}.pdf`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected sendEmail(): void {
    const sale = this.result();
    if (!sale?.id || this.isSendingEmail()) return;
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      return;
    }
    this.isSendingEmail.set(true);
    this.errorMessage.set(null);
    this.salesService
      .sendTicketsEmail(sale.id, this.emailControl.value.trim())
      .pipe(finalize(() => this.isSendingEmail.set(false)))
      .subscribe({
        next: ({ email }) => this.successMessage.set(`Tickets enviados a ${email}.`),
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected openSessionPage(): void {
    this.router.navigateByUrl('/open_cashier_session');
  }

  private resetForm(): void {
    const ctx = this.context();
    const byValue = (list: Feature[] | undefined, value: string) =>
      list?.find((f) => f.feature_value?.toLowerCase() === value)?.id ?? list?.[0]?.id ?? null;
    this.flights.set([]);
    this.pricing.set(null);
    this.pricingError.set(null);
    this.form.reset({
      flight_type_id: null,
      flight_id: null,
      titular_passenger_name: '',
      passenger_email: '',
      ticket_quantity: 1,
      document_type_id: byValue(ctx?.document_types, DefaultDocumentTypeValue),
      sale_type_id: byValue(ctx?.sale_types, DefaultSaleTypeValue),
      payment_type_id: byValue(ctx?.payment_types, CashPaymentValue.toLowerCase()),
      cash_payment_currency_id: null,
      cash_amount_payed: null,
      cash_change_currency_id: null,
    });
    this.emailControl.reset('');
    this.updateCashValidators(this.form.controls.payment_type_id.value);
  }

  private uniqueCurrencies(ids: (number | null)[]): Feature[] {
    const index = this.featureIndex();
    const result: Feature[] = [];
    for (const id of ids) {
      if (id === null || result.some((f) => f.id === id)) continue;
      const feature = index.get(id);
      if (feature) result.push(feature);
    }
    return result;
  }

  protected currencyCode(id: number | null): string {
    if (id === null) return '';
    return this.featureIndex().get(id)?.feature_value ?? '';
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description ?? String(id);
  }

  protected flightLabel(flight: Flight): string {
    const time = new Date(flight.scheduled_time);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    const when = Number.isNaN(time.getTime())
      ? ''
      : `${pad(time.getDate())}/${pad(time.getMonth() + 1)} ${pad(time.getHours())}:${pad(time.getMinutes())}`;
    const route = `${flight.origin_airport_code}-${flight.destination_airprt_code}`;
    return `${flight.flight_identity ?? flight.flight_number ?? ''} · ${when} · ${route}`;
  }

  private static round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) return error.error;
      if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
