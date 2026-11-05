import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { ExchangeRate, Feature, FeatureGroup } from '../models';
import { ExchangeRateService, FeatureService } from '../services';

@Component({
  selector: 'app-exchange-rates',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './exchange-rates.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class ExchangeRates implements OnInit {
  private static readonly CurrencyGroupNames = ['Monedas', 'Moneda'];

  private readonly fb = inject(FormBuilder);
  private readonly exchangeRateService = inject(ExchangeRateService);
  private readonly featureService = inject(FeatureService);

  protected readonly exchangeRates = signal<ExchangeRate[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly currencyFeatures = computed(() => this.featuresOfGroup(ExchangeRates.CurrencyGroupNames));
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  protected readonly search = signal('');
  protected readonly filteredExchangeRates = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.exchangeRates().filter((exchangeRate) =>
      !query ||
      [
        this.featureLabel(exchangeRate.base_currency_id),
        this.featureLabel(exchangeRate.target_currency_id),
        String(exchangeRate.purchase_exchange_rate),
        String(exchangeRate.sales_exchange_rate),
        exchangeRate.day,
      ].some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<ExchangeRate | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    day: this.fb.control<Date | null>(null, Validators.required),
    base_currency_id: this.fb.control<number | null>(null, Validators.required),
    target_currency_id: this.fb.control<number | null>(null, Validators.required),
    purchase_exchange_rate: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.001),
    ]),
    sales_exchange_rate: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.001),
    ]),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.exchangeRateService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (exchangeRates) => this.exchangeRates.set(exchangeRates ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): void {
    const relevantNames = [...ExchangeRates.CurrencyGroupNames];
    this.featureService
      .getAllFeatureGroups()
      .pipe(
        switchMap((groups) => {
          const relevant = (groups ?? []).filter((group) =>
            relevantNames.some((name) => ExchangeRates.sameName(group.name, name)),
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
      )
      .subscribe({
        next: (groups) => this.groups.set(groups),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private featuresOfGroup(names: string[]): Feature[] {
    const group = this.groups().find((item) =>
      names.some((name) => ExchangeRates.sameName(item.name, name)),
    );
    return group?.features ?? [];
  }

  private static sameName(candidate: string | null, target: string): boolean {
    return (candidate ?? '').trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description || String(id);
  }

  protected formatDate(value: string | null): string {
    if (!value) return '—';
    const [year, month, day] = value.substring(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.form.reset({
      day: null,
      base_currency_id: null,
      target_currency_id: null,
      purchase_exchange_rate: null,
      sales_exchange_rate: null,
      is_active: true,
    });
    this.mode.set('create');
  }

  protected startEdit(exchangeRate: ExchangeRate): void {
    if (!exchangeRate.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(exchangeRate.id);
    this.form.reset({
      day: this.parseDate(exchangeRate.day),
      base_currency_id: exchangeRate.base_currency_id,
      target_currency_id: exchangeRate.target_currency_id,
      purchase_exchange_rate: exchangeRate.purchase_exchange_rate,
      sales_exchange_rate: exchangeRate.sales_exchange_rate,
      is_active: exchangeRate.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.form.reset();
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (!raw.day || raw.base_currency_id === null || raw.target_currency_id === null) {
      this.errorMessage.set('La fecha y las monedas son obligatorias.');
      return;
    }
    if (raw.base_currency_id === raw.target_currency_id) {
      this.errorMessage.set('La moneda base y la moneda destino deben ser diferentes.');
      return;
    }

    const payload: ExchangeRate = {
      id: this.editingId(),
      day: this.toApiDate(raw.day),
      base_currency_id: raw.base_currency_id,
      target_currency_id: raw.target_currency_id,
      purchase_exchange_rate: raw.purchase_exchange_rate ?? 0,
      sales_exchange_rate: raw.sales_exchange_rate ?? 0,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.exchangeRateService.add(payload)
      : this.exchangeRateService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.form.reset();
        this.successMessage.set(
          isCreate ? 'Tipo de cambio registrado correctamente.' : 'Tipo de cambio actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(exchangeRate: ExchangeRate): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(exchangeRate);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.exchangeRateService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Tipo de cambio desactivado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private parseDate(value: string | null): Date | null {
    if (!value) return null;
    const [year, month, day] = value.substring(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private toApiDate(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
