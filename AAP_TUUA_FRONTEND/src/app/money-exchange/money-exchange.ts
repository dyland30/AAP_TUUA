import { DatePipe, DecimalPipe, LowerCasePipe } from '@angular/common';
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
import { Observable, finalize, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import {
  CashierMachineSession,
  ExchangeRate,
  Feature,
  FeatureGroup,
  MoneyExchangeOperation,
} from '../models';
import { ActiveCashierSessionService } from '../services/active-cashier-session.service';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { FeatureService } from '../services/feature.service';
import { MoneyExchangeOperationService } from '../services/money-exchange-operation.service';
import { twoDecimals } from '../validators/two-decimals.validator';

type OperationType = 'P' | 'S';

class SessionClosedError extends Error {}

@Component({
  selector: 'app-money-exchange',
  imports: [
    DatePipe,
    DecimalPipe,
    LowerCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './money-exchange.html',
  styleUrls: ['../catalogs/catalog-crud.css', './money-exchange.css'],
})
export class MoneyExchange implements OnInit {
  private static readonly CurrencyGroupNames = ['Monedas', 'Moneda'];
  private static readonly MaxAmount = 9999999999.99;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activeSession = inject(ActiveCashierSessionService);
  private readonly moneyExchangeService = inject(MoneyExchangeOperationService);
  private readonly exchangeRateService = inject(ExchangeRateService);
  private readonly featureService = inject(FeatureService);

  protected readonly session = signal<CashierMachineSession | null>(null);
  protected readonly operations = signal<MoneyExchangeOperation[]>([]);
  protected readonly exchangeRates = signal<ExchangeRate[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly today = signal(MoneyExchange.todayKey());
  protected readonly mode = signal<'list' | 'form'>('list');
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    operation_type: this.fb.nonNullable.control<OperationType>('P', Validators.required),
    exchange_rate_id: this.fb.control<string | null>(null, Validators.required),
    foreign_amount: this.fb.control<number | null>(null, this.amountValidators()),
    local_amount: this.fb.control<number | null>(null, this.amountValidators()),
  });

  private readonly operationType = toSignal(this.form.controls.operation_type.valueChanges, {
    initialValue: this.form.controls.operation_type.value,
  });
  private readonly selectedRateId = toSignal(this.form.controls.exchange_rate_id.valueChanges, {
    initialValue: this.form.controls.exchange_rate_id.value,
  });

  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  protected readonly todayRates = computed(() =>
    this.exchangeRates().filter(
      (rate) => rate.is_active && rate.day?.substring(0, 10) === this.today(),
    ),
  );
  protected readonly selectedRate = computed(
    () => this.todayRates().find((rate) => rate.id === this.selectedRateId()) ?? null,
  );
  protected readonly appliedRate = computed(() => {
    const rate = this.selectedRate();
    if (!rate) return null;
    return this.operationType() === 'P' ? rate.purchase_exchange_rate : rate.sales_exchange_rate;
  });
  protected readonly movementsPreview = computed(() => {
    const rate = this.selectedRate();
    if (!rate) return null;
    const foreign = this.featureLabel(rate.base_currency_id);
    const local = this.featureLabel(rate.target_currency_id);
    return this.operationType() === 'P'
      ? { outflow: local, inflow: foreign }
      : { outflow: foreign, inflow: local };
  });

  constructor() {
    const controls = this.form.controls;
    controls.foreign_amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((foreign) => this.syncLocalAmount(foreign));
    controls.local_amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((local) => this.syncForeignAmount(local));
    controls.operation_type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncLocalAmount(controls.foreign_amount.value));
    controls.exchange_rate_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncLocalAmount(controls.foreign_amount.value));
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.today.set(MoneyExchange.todayKey());
    forkJoin({
      session: this.activeSession.getOpenSession(),
      groups: this.loadCatalog(),
      rates: this.exchangeRateService.getAll(),
    })
      .pipe(
        switchMap(({ session, groups, rates }) => {
          const operations$ = session?.id
            ? this.moneyExchangeService.getByCashierMachineSessionId(session.id)
            : of<MoneyExchangeOperation[]>([]);
          return operations$.pipe(map((operations) => ({ session, groups, rates, operations })));
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ session, groups, rates, operations }) => {
          this.session.set(session);
          this.groups.set(groups);
          this.exchangeRates.set(rates ?? []);
          this.operations.set(operations ?? []);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private refreshOperations(): void {
    const sessionId = this.session()?.id;
    if (!sessionId) return;
    this.moneyExchangeService.getByCashierMachineSessionId(sessionId).subscribe({
      next: (operations) => this.operations.set(operations ?? []),
      error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  private loadCatalog(): Observable<FeatureGroup[]> {
    return this.featureService.getAllFeatureGroups().pipe(
      switchMap((groups) => {
        const relevant = (groups ?? []).filter((group) =>
          MoneyExchange.CurrencyGroupNames.some(
            (name) => MoneyExchange.normalize(group.name) === MoneyExchange.normalize(name),
          ),
        );
        if (relevant.length === 0) return of<FeatureGroup[]>([]);
        return forkJoin(
          relevant.map((group) =>
            this.featureService
              .getFeaturesByGroup(group.id)
              .pipe(map((features) => ({ ...group, features: features ?? [] }))),
          ),
        );
      }),
    );
  }

  private static normalize(value: string | null): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase();
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    const feature = this.featureIndex().get(id);
    if (!feature) return String(id);
    const name = feature.description || String(feature.id);
    return feature.abbreviation ? `${name} (${feature.abbreviation})` : name;
  }

  protected rateLabel(rate: ExchangeRate): string {
    return `${this.featureLabel(rate.base_currency_id)} → ${this.featureLabel(rate.target_currency_id)}`;
  }

  protected operationLabel(type: string): string {
    return type === 'P' ? 'Compra' : 'Venta';
  }

  protected startCreate(): void {
    if (this.isSaving() || !this.session()) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    const rates = this.todayRates();
    this.form.reset({
      operation_type: 'P',
      exchange_rate_id: rates.length === 1 ? rates[0].id : null,
      foreign_amount: null,
      local_amount: null,
    });
    this.mode.set('form');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.form.reset({ operation_type: 'P' });
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() !== 'form') return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const session = this.session();
    const rate = this.selectedRate();
    const appliedRate = this.appliedRate();
    const raw = this.form.getRawValue();
    if (
      !session?.id ||
      !rate?.id ||
      appliedRate === null ||
      raw.foreign_amount === null ||
      raw.local_amount === null
    ) {
      return;
    }

    const type = raw.operation_type;
    const payload: MoneyExchangeOperation = {
      id: null,
      cashier_machine_session_id: session.id,
      operation_date: MoneyExchange.toApiDateTime(new Date()),
      operation_type: type,
      local_currency_id: rate.target_currency_id,
      foreign_currency_id: rate.base_currency_id,
      exchange_rate_id: rate.id,
      applied_exchange_rate: appliedRate,
      local_currency_amount: Number(raw.local_amount),
      foreign_currency_amount: Number(raw.foreign_amount),
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };

    this.isSaving.set(true);
    // Se vuelve a validar el turno para no registrar cambios en un turno que ya se cerró.
    this.activeSession
      .getOpenSession()
      .pipe(
        switchMap((current) =>
          current?.id === session.id
            ? this.moneyExchangeService.add(payload)
            : throwError(
                () =>
                  new SessionClosedError(
                    'El turno ya no está abierto. Abre un nuevo turno para realizar cambios de moneda.',
                  ),
              ),
        ),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.mode.set('list');
          this.form.reset({ operation_type: 'P' });
          this.successMessage.set(
            `${type === 'P' ? 'Compra' : 'Venta'} de moneda registrada correctamente. Se generaron los movimientos de caja.`,
          );
          this.refreshOperations();
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
          if (error instanceof SessionClosedError) {
            this.session.set(null);
            this.mode.set('list');
          }
        },
      });
  }

  protected openSessionPage(): void {
    this.router.navigateByUrl('/open_cashier_session');
  }

  private syncLocalAmount(foreign: number | null): void {
    const local = this.form.controls.local_amount;
    if (foreign === null || !(foreign > 0)) {
      if (local.value !== null) local.setValue(null, { emitEvent: false });
      return;
    }
    const rate = this.appliedRate();
    if (rate === null) return;
    local.setValue(MoneyExchange.round2(foreign * rate), { emitEvent: false });
  }

  private syncForeignAmount(local: number | null): void {
    const foreign = this.form.controls.foreign_amount;
    if (local === null || !(local > 0)) {
      if (foreign.value !== null) foreign.setValue(null, { emitEvent: false });
      return;
    }
    const rate = this.appliedRate();
    if (rate === null || rate <= 0) return;
    foreign.setValue(MoneyExchange.round2(local / rate), { emitEvent: false });
  }

  private amountValidators() {
    return [
      Validators.required,
      Validators.min(0.01),
      Validators.max(MoneyExchange.MaxAmount),
      twoDecimals,
    ];
  }

  private static round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private static todayKey(): string {
    return MoneyExchange.toApiDateTime(new Date()).substring(0, 10);
  }

  // Fecha y hora local sin zona horaria: la columna operation_date es timestamp sin zona.
  private static toApiDateTime(value: Date): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return (
      `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` +
      `T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
    );
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
