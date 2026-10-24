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
import { Airport, Feature, FeatureGroup, Location, Terminal, TuuaPrice } from '../models';
import { AirportService, FeatureService, LocationService, TerminalService, TuuaPriceService } from '../services';

@Component({
  selector: 'app-tuua-prices',
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
  templateUrl: './tuua-prices.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class TuuaPrices implements OnInit {
  private static readonly FlightTypeGroupNames = ['Tipos de Vuelo'];
  private static readonly CurrencyGroupNames = ['Monedas', 'Moneda'];

  private readonly fb = inject(FormBuilder);
  private readonly tuuaPriceService = inject(TuuaPriceService);
  private readonly terminalService = inject(TerminalService);
  private readonly locationService = inject(LocationService);
  private readonly airportService = inject(AirportService);
  private readonly featureService = inject(FeatureService);

  protected readonly prices = signal<TuuaPrice[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedLocationId = signal<string | null>(null);
  protected readonly filteredLocations = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.locations().filter((location) => location.airport_id === airportId) : [];
  });
  protected readonly filteredTerminals = computed(() => {
    const locationId = this.selectedLocationId();
    if (!locationId) return [];
    return this.terminals().filter((terminal) => terminal.location_id === locationId);
  });
  protected readonly flightTypeFeatures = computed(() =>
    this.featuresOfGroup(TuuaPrices.FlightTypeGroupNames),
  );
  protected readonly currencyFeatures = computed(() =>
    this.featuresOfGroup(TuuaPrices.CurrencyGroupNames),
  );
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  protected readonly search = signal('');
  protected readonly filteredPrices = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.prices().filter((price) =>
      !query ||
      [
        this.featureLabel(price.flight_type_id),
        this.featureLabel(price.currency_id),
        this.locationLabel(price.location_id),
        this.terminalLabel(price.terminal_id),
        String(price.price),
        price.date_start,
        price.date_end,
      ].some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<TuuaPrice | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    location_id: this.fb.control<string | null>(null, Validators.required),
    terminal_id: this.fb.control<string | null>(null, Validators.required),
    flight_type_id: this.fb.control<number | null>(null, Validators.required),
    currency_id: this.fb.control<number | null>(null, Validators.required),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    date_start: this.fb.control<Date | null>(null, Validators.required),
    date_end: this.fb.control<Date | null>(null),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      prices: this.tuuaPriceService.getAll(),
      terminals: this.terminalService.getAll(),
      locations: this.locationService.getAll(),
      airports: this.airportService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ prices, terminals, locations, airports }) => {
          this.prices.set(prices ?? []);
          this.terminals.set(terminals ?? []);
          this.locations.set(locations ?? []);
          this.airports.set(airports ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): void {
    const relevantNames = [...TuuaPrices.FlightTypeGroupNames, ...TuuaPrices.CurrencyGroupNames];
    this.featureService
      .getAllFeatureGroups()
      .pipe(
        switchMap((groups) => {
          const relevant = (groups ?? []).filter((group) =>
            relevantNames.some((name) => TuuaPrices.sameName(group.name, name)),
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
      names.some((name) => TuuaPrices.sameName(item.name, name)),
    );
    return group?.features ?? [];
  }

  private static sameName(candidate: string | null, target: string): boolean {
    return (candidate ?? '').trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
  }

  protected airportLabel(id: string | null): string {
    if (!id) return '—';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected locationLabel(id: string | null): string {
    if (!id) return '—';
    const location = this.locations().find((item) => item.id === id);
    if (!location) return id;
    return `${location.name || location.id} · ${this.airportLabel(location.airport_id)}`;
  }

  protected terminalLabel(id: string | null): string {
    if (!id) return '—';
    const terminal = this.terminals().find((item) => item.id === id);
    if (!terminal) return id;
    return `${terminal.name || terminal.id} · ${this.airportLabel(terminal.airport_id)}`;
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

  protected formatRange(price: TuuaPrice): string {
    return `${this.formatDate(price.date_start)} - ${price.date_end ? this.formatDate(price.date_end) : 'sin fin'}`;
  }

  protected onAirportChange(airportId: string | null): void {
    this.selectedAirportId.set(airportId);
    const locationId = this.form.controls.location_id.value;
    if (locationId && !this.filteredLocations().some((location) => location.id === locationId)) {
      this.form.controls.location_id.setValue(null);
      this.onLocationChange(null);
    }
  }

  protected onLocationChange(locationId: string | null): void {
    this.selectedLocationId.set(locationId);
    const terminalId = this.form.controls.terminal_id.value;
    if (terminalId && !this.filteredTerminals().some((terminal) => terminal.id === terminalId)) {
      this.form.controls.terminal_id.setValue(null);
    }
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.selectedAirportId.set(null);
    this.selectedLocationId.set(null);
    this.form.reset({
      location_id: null,
      terminal_id: null,
      flight_type_id: null,
      currency_id: null,
      price: null,
      date_start: null,
      date_end: null,
      is_active: true,
    });
    this.mode.set('create');
  }

  protected startEdit(price: TuuaPrice): void {
    if (!price.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(price.id);
    const location = this.locations().find((item) => item.id === price.location_id);
    this.selectedAirportId.set(location?.airport_id ?? null);
    this.selectedLocationId.set(price.location_id);
    this.form.reset({
      location_id: price.location_id,
      terminal_id: price.terminal_id,
      flight_type_id: price.flight_type_id,
      currency_id: price.currency_id,
      price: price.price,
      date_start: this.parseDate(price.date_start),
      date_end: this.parseDate(price.date_end),
      is_active: price.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.selectedAirportId.set(null);
    this.selectedLocationId.set(null);
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
    const dateStartValue = raw.date_start;
    const dateEndValue = raw.date_end;
    if (!dateStartValue) {
      this.errorMessage.set('La fecha de inicio es obligatoria.');
      return;
    }
    if (dateEndValue && dateEndValue.getTime() < dateStartValue.getTime()) {
      this.errorMessage.set('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    const dateStart = this.toApiDate(dateStartValue);
    const dateEnd = dateEndValue ? this.toApiDate(dateEndValue) : null;

    const payload: TuuaPrice = {
      id: this.editingId(),
      flight_type_id: raw.flight_type_id,
      location_id: raw.location_id,
      terminal_id: raw.terminal_id,
      currency_id: raw.currency_id,
      price: raw.price ?? 0,
      date_start: dateStart,
      date_end: dateEnd,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.tuuaPriceService.add(payload)
      : this.tuuaPriceService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.selectedAirportId.set(null);
        this.selectedLocationId.set(null);
        this.form.reset();
        this.successMessage.set(
          isCreate ? 'Tarifa TUUA registrada correctamente.' : 'Tarifa TUUA actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(price: TuuaPrice): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(price);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.tuuaPriceService.delete(target.id).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Tarifa TUUA desactivada correctamente.');
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
