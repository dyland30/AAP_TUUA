import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';
import {
  CashierSessionBalance,
  CashierSessionClosing,
  CashierSessionCurrencyTotals,
  Feature,
} from '../models';
import { ActiveCashierSessionService } from '../services/active-cashier-session.service';
import { CashierSessionClosingService } from '../services/cashier-session-closing.service';
import { notBlank } from '../validators/not-blank.validator';
import { twoDecimals } from '../validators/two-decimals.validator';

interface BalanceCell {
  key: string;
  paymentTypeId: number;
  expected: number;
  declared: number | null;
  difference: number | null;
}

interface BalanceRow {
  currencyId: number;
  cells: BalanceCell[];
  difference: number | null;
}

@Component({
  selector: 'app-close-cashier-session',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './close-cashier-session.html',
  styleUrls: ['../catalogs/catalog-crud.css', './close-cashier-session.css'],
})
export class CloseCashierSession implements OnInit {
  private readonly router = inject(Router);
  private readonly activeSession = inject(ActiveCashierSessionService);
  private readonly closingService = inject(CashierSessionClosingService);

  protected readonly balance = signal<CashierSessionBalance | null>(null);
  protected readonly closing = signal<CashierSessionClosing | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly confirming = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // Un control por moneda / tipo de pago con el monto contado por el cajero.
  protected readonly amounts = new FormRecord<FormControl<number | null>>({});
  protected readonly observation = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(500), notBlank],
  });
  private readonly declaredValues = signal<Record<string, number | null>>({});

  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    const balance = this.balance();
    for (const feature of [...(balance?.currencies ?? []), ...(balance?.payment_types ?? [])]) {
      index.set(feature.id, feature);
    }
    return index;
  });
  private readonly expectedIndex = computed(() => {
    const index = new Map<string, number>();
    for (const item of this.balance()?.expected_amounts ?? []) {
      index.set(this.key(item.currency_id, item.payment_type_id), item.expected_amount);
    }
    return index;
  });
  // Monedas y tipos de pago del catálogo, más los que tengan saldo aunque ya no estén activos.
  protected readonly currencyIds = computed(() => {
    const balance = this.balance();
    if (!balance) return [];
    return this.unique([
      ...balance.currencies.map((feature) => feature.id),
      ...balance.expected_amounts.map((item) => item.currency_id),
    ]);
  });
  // Efectivo va primero; el resto en el orden del catálogo.
  protected readonly paymentTypeIds = computed(() => {
    const balance = this.balance();
    if (!balance) return [];
    const ids = this.unique([
      ...balance.payment_types.map((feature) => feature.id),
      ...balance.expected_amounts.map((item) => item.payment_type_id),
    ]);
    return [...ids].sort(
      (a, b) =>
        Number(b === balance.cash_payment_type_id) - Number(a === balance.cash_payment_type_id),
    );
  });
  protected readonly rows = computed<BalanceRow[]>(() => {
    const declaredValues = this.declaredValues();
    return this.currencyIds().map((currencyId) => {
      let differenceCents = 0;
      let complete = true;
      const cells = this.paymentTypeIds().map((paymentTypeId) => {
        const key = this.key(currencyId, paymentTypeId);
        const expected = this.expectedIndex().get(key) ?? 0;
        const raw = declaredValues[key];
        const declared = raw === null || raw === undefined || `${raw}` === '' ? null : Number(raw);
        let difference: number | null = null;
        if (declared === null) {
          complete = false;
        } else {
          const cents = this.toCents(declared) - this.toCents(expected);
          differenceCents += cents;
          difference = cents / 100;
        }
        return { key, paymentTypeId, expected, declared, difference };
      });
      return { currencyId, cells, difference: complete ? differenceCents / 100 : null };
    });
  });
  protected readonly differences = computed(() =>
    this.rows().flatMap((row) =>
      row.cells
        .filter((cell) => cell.difference !== null && cell.difference !== 0)
        .map((cell) => ({ currencyId: row.currencyId, ...cell })),
    ),
  );
  protected readonly hasDifference = computed(() => this.differences().length > 0);
  protected readonly totals = computed<CashierSessionCurrencyTotals[]>(() => {
    const totals = this.balance()?.currency_totals ?? [];
    return totals.filter(
      (item) =>
        item.opening_amount !== 0 ||
        item.sales_amount !== 0 ||
        item.exchange_amount !== 0 ||
        item.income_amount !== 0 ||
        item.expense_amount !== 0,
    );
  });

  constructor() {
    this.amounts.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.declaredValues.set(this.amounts.getRawValue()));
    // La observación solo es obligatoria cuando el cuadre presenta diferencias.
    effect(() => {
      const validators = [Validators.maxLength(500), notBlank];
      this.observation.setValidators(this.hasDifference() ? [Validators.required, ...validators] : validators);
      this.observation.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.confirming.set(false);
    // Se consulta primero el turno abierto para mostrar el estado vacío sin pasar por un error del API.
    this.activeSession
      .getOpenSession()
      .pipe(
        switchMap((session) => (session ? this.closingService.getBalance() : of(null))),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (balance) => {
          this.balance.set(balance);
          this.buildAmountControls();
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private buildAmountControls(): void {
    for (const key of Object.keys(this.amounts.controls)) this.amounts.removeControl(key, { emitEvent: false });
    for (const currencyId of this.currencyIds()) {
      for (const paymentTypeId of this.paymentTypeIds()) {
        const key = this.key(currencyId, paymentTypeId);
        // Sin saldo esperado se propone 0; con saldo, el cajero debe ingresar lo contado.
        const expected = this.expectedIndex().get(key) ?? 0;
        this.amounts.addControl(
          key,
          new FormControl<number | null>(expected === 0 ? 0 : null, [
            Validators.required,
            Validators.min(0),
            twoDecimals,
          ]),
          { emitEvent: false },
        );
      }
    }
    this.observation.reset('');
    this.declaredValues.set(this.amounts.getRawValue());
  }

  protected requestClose(): void {
    if (this.isSaving() || !this.balance()) return;
    this.errorMessage.set(null);
    if (this.amounts.invalid) {
      this.amounts.markAllAsTouched();
      this.errorMessage.set('Ingresa el monto contado de cada moneda y tipo de pago (0 o más, hasta 2 decimales).');
      return;
    }
    if (this.observation.invalid) {
      this.observation.markAsTouched();
      this.errorMessage.set('Registra una observación que justifique la diferencia del cuadre.');
      return;
    }
    this.confirming.set(true);
  }

  protected close(): void {
    const balance = this.balance();
    const sessionId = balance?.session.id;
    if (this.isSaving() || !sessionId) return;

    const declaredAmounts = this.rows().flatMap((row) =>
      row.cells.map((cell) => ({
        currency_id: row.currencyId,
        payment_type_id: cell.paymentTypeId,
        declared_amount: cell.declared ?? 0,
      })),
    );

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.closingService
      .close({
        cashier_machine_session_id: sessionId,
        observation: this.observation.value.trim() || null,
        declared_amounts: declaredAmounts,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (closing) => {
          this.confirming.set(false);
          this.closing.set(closing);
        },
        error: (error: unknown) => {
          this.confirming.set(false);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  protected print(): void {
    window.print();
  }

  protected goHome(): void {
    this.router.navigateByUrl('/');
  }

  protected openSessionPage(): void {
    this.router.navigateByUrl('/open_cashier_session');
  }

  protected featureLabel(id: number): string {
    return this.featureIndex().get(id)?.description || String(id);
  }

  protected currencyCode(id: number): string {
    const feature = this.featureIndex().get(id);
    return feature?.abbreviation || feature?.feature_value || '';
  }

  protected isCash(paymentTypeId: number): boolean {
    return paymentTypeId === this.balance()?.cash_payment_type_id;
  }

  protected hasError(key: string): boolean {
    const control = this.amounts.controls[key];
    return !!control && control.invalid && control.touched;
  }

  protected key(currencyId: number, paymentTypeId: number): string {
    return `${currencyId}_${paymentTypeId}`;
  }

  private toCents(value: number): number {
    return Math.round(value * 100);
  }

  private unique(ids: number[]): number[] {
    return [...new Set(ids)];
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
