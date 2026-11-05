import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import {
  Observable,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { CashFlow, CashierMachineSession, Feature, FeatureGroup } from '../models';
import { ActiveCashierSessionService } from '../services/active-cashier-session.service';
import { CashFlowService } from '../services/cash-flow.service';
import { FeatureService } from '../services/feature.service';
import { notBlank } from '../validators/not-blank.validator';
import { twoDecimals } from '../validators/two-decimals.validator';

type MovementType = 'I' | 'E';
type TypeFilter = 'all' | MovementType;

interface CurrencySummary {
  currencyId: number;
  income: number;
  expense: number;
  balance: number;
}

class SessionClosedError extends Error {}

@Component({
  selector: 'app-cash-movements',
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
  templateUrl: './cash-movements.html',
  styleUrls: ['../catalogs/catalog-crud.css', './cash-movements.css'],
})
export class CashMovements implements OnInit {
  private static readonly CurrencyGroupNames = ['Monedas', 'Moneda'];
  private static readonly PaymentTypeGroupNames = ['Tipos de Pago'];
  private static readonly CashPaymentName = 'efectivo';

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activeSession = inject(ActiveCashierSessionService);
  private readonly cashFlowService = inject(CashFlowService);
  private readonly featureService = inject(FeatureService);

  protected readonly session = signal<CashierMachineSession | null>(null);
  protected readonly cashFlows = signal<CashFlow[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly typeFilter = signal<TypeFilter>('all');
  protected readonly mode = signal<'list' | 'form'>('list');
  protected readonly movementType = signal<MovementType>('I');
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly currencyFeatures = computed(() =>
    this.featuresOfGroup(CashMovements.CurrencyGroupNames).filter((feature) => feature.is_active),
  );
  protected readonly paymentTypeFeatures = computed(() =>
    this.featuresOfGroup(CashMovements.PaymentTypeGroupNames).filter((feature) => feature.is_active),
  );
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  private readonly movements = computed(() => this.cashFlows().filter((flow) => flow.is_active));
  protected readonly filteredMovements = computed(() => {
    const filter = this.typeFilter();
    return this.movements().filter((flow) => filter === 'all' || flow.direction === filter);
  });
  // Totales por moneda en centavos enteros para no acumular errores de punto flotante.
  protected readonly summary = computed<CurrencySummary[]>(() => {
    const totals = new Map<number, { income: number; expense: number }>();
    for (const flow of this.movements()) {
      const total = totals.get(flow.currency_id) ?? { income: 0, expense: 0 };
      const cents = Math.round(flow.amount * 100);
      if (flow.direction === 'I') total.income += cents;
      else total.expense += cents;
      totals.set(flow.currency_id, total);
    }
    return [...totals.entries()].map(([currencyId, total]) => ({
      currencyId,
      income: total.income / 100,
      expense: total.expense / 100,
      balance: (total.income - total.expense) / 100,
    }));
  });

  protected readonly form = this.fb.nonNullable.group({
    payment_type_id: this.fb.control<number | null>(null, Validators.required),
    currency_id: this.fb.control<number | null>(null, Validators.required),
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      twoDecimals,
    ]),
    reference_code: ['', [Validators.maxLength(50), notBlank]],
    observation: ['', [Validators.maxLength(500), notBlank]],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    forkJoin({ session: this.activeSession.getOpenSession(), groups: this.loadCatalog() })
      .pipe(
        switchMap(({ session, groups }) => {
          const flows$ = session?.id
            ? this.cashFlowService.getByCashierMachineSessionId(session.id)
            : of<CashFlow[]>([]);
          return flows$.pipe(map((flows) => ({ session, groups, flows })));
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ session, groups, flows }) => {
          this.session.set(session);
          this.groups.set(groups);
          this.cashFlows.set(flows ?? []);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private refreshMovements(): void {
    const sessionId = this.session()?.id;
    if (!sessionId) return;
    this.cashFlowService.getByCashierMachineSessionId(sessionId).subscribe({
      next: (flows) => this.cashFlows.set(flows ?? []),
      error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  private loadCatalog(): Observable<FeatureGroup[]> {
    const relevantNames = [...CashMovements.CurrencyGroupNames, ...CashMovements.PaymentTypeGroupNames];
    return this.featureService.getAllFeatureGroups().pipe(
      switchMap((groups) => {
        const relevant = (groups ?? []).filter((group) =>
          relevantNames.some((name) => CashMovements.normalize(group.name) === CashMovements.normalize(name)),
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

  private featuresOfGroup(names: string[]): Feature[] {
    const group = this.groups().find((item) =>
      names.some((name) => CashMovements.normalize(item.name) === CashMovements.normalize(name)),
    );
    return group?.features ?? [];
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
    return this.featureIndex().get(id)?.description || String(id);
  }

  protected shortId(value: string | null): string {
    return value ? value.slice(0, 8) : '—';
  }

  protected currencyLabel(feature: Feature): string {
    const name = feature.description || String(feature.id);
    return feature.abbreviation ? `${name} (${feature.abbreviation})` : name;
  }

  protected startCreate(type: MovementType): void {
    if (this.isSaving() || !this.session()) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.movementType.set(type);
    const cash = this.paymentTypeFeatures().find(
      (feature) =>
        [feature.description, feature.feature_value].some(
          (value) => CashMovements.normalize(value) === CashMovements.CashPaymentName,
        ),
    );
    this.form.reset({
      payment_type_id: cash?.id ?? null,
      currency_id: null,
      amount: null,
      reference_code: '',
      observation: '',
    });
    this.mode.set('form');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.form.reset();
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
    const raw = this.form.getRawValue();
    if (!session?.id || raw.payment_type_id === null || raw.currency_id === null || raw.amount === null) {
      return;
    }

    const type = this.movementType();
    const payload: CashFlow = {
      id: null,
      cashier_machine_session_id: session.id,
      tuua_sales_operation_id: null,
      money_exchange_operation_id: null,
      direction: type,
      operator: type === 'I' ? 1 : -1,
      payment_type_id: raw.payment_type_id,
      currency_id: raw.currency_id,
      amount: Number(raw.amount),
      reference_code: raw.reference_code.trim() || null,
      observation: raw.observation.trim() || null,
      is_active: true,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };

    this.isSaving.set(true);
    // Se vuelve a validar el turno para no registrar movimientos en un turno que ya se cerró.
    this.activeSession
      .getOpenSession()
      .pipe(
        switchMap((current) =>
          current?.id === session.id
            ? this.cashFlowService.add(payload)
            : throwError(
                () =>
                  new SessionClosedError(
                    'El turno ya no está abierto. Abre un nuevo turno para registrar movimientos.',
                  ),
              ),
        ),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.mode.set('list');
          this.form.reset();
          this.successMessage.set(
            type === 'I' ? 'Ingreso registrado correctamente.' : 'Egreso registrado correctamente.',
          );
          this.refreshMovements();
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
