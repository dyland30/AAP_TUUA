import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin } from 'rxjs';
import {
  Airline,
  Airport,
  AirportSector,
  Feature,
  FeatureGroup,
  FlightTimingRule,
  Terminal,
} from '../models';
import {
  AirlineService,
  AirportSectorService,
  AirportService,
  FeatureCatalogService,
  FlightTimingRuleService,
  TerminalService,
} from '../services';

type FormMode = 'list' | 'create' | 'edit';

const EVENT_GROUP = 'eventos tiempo vuelo';
const REFERENCE_GROUP = 'referencia tiempo vuelo';
const DIRECTION_GROUPS = ['Tipo Operación Vuelo'];
const FLIGHT_TYPE_GROUPS = ['Tipos de Vuelo', 'Tipo de Vuelo'];
const RESOURCE_TYPE_GROUPS = ['tipos de recursos', 'tipo de recursos'];
const CATALOG_GROUPS = [
  EVENT_GROUP,
  REFERENCE_GROUP,
  ...DIRECTION_GROUPS,
  ...FLIGHT_TYPE_GROUPS,
  ...RESOURCE_TYPE_GROUPS,
];

const MIN_OFFSET = -2147483648;
const MAX_OFFSET = 2147483647;
const MIN_PRIORITY = -32768;
const MAX_PRIORITY = 32767;

function integerNumber(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  return value === null || value === undefined || Number.isInteger(value)
    ? null
    : { integer: true };
}

@Component({
  selector: 'app-flight-timing-rules',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './flight-timing-rules.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class FlightTimingRules implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ruleService = inject(FlightTimingRuleService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);
  private readonly sectorService = inject(AirportSectorService);
  private readonly airlineService = inject(AirlineService);
  private readonly catalog = inject(FeatureCatalogService);

  protected readonly rules = signal<FlightTimingRule[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly sectors = signal<AirportSector[]>([]);
  protected readonly airlines = signal<Airline[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);

  protected readonly eventTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), EVENT_GROUP),
  );
  protected readonly referenceTimes = computed(() =>
    this.catalog.featuresOf(this.groups(), REFERENCE_GROUP),
  );
  protected readonly directions = computed(() =>
    this.catalog.featuresOf(this.groups(), DIRECTION_GROUPS),
  );
  protected readonly flightTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), FLIGHT_TYPE_GROUPS),
  );
  protected readonly resourceTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), RESOURCE_TYPE_GROUPS),
  );

  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedEventTypeId = signal<number | null>(null);
  protected readonly search = signal('');
  protected readonly filteredRules = computed(() => {
    const airportId = this.selectedAirportId();
    const eventTypeId = this.selectedEventTypeId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.rules()
      .filter(
        (rule) =>
          (!airportId || rule.airport_id === airportId) &&
          (eventTypeId === null || rule.event_type_id === eventTypeId) &&
          (!query || (rule.description ?? '').toLocaleLowerCase().includes(query)),
      )
      .sort(
        (a, b) =>
          this.eventLabel(a.event_type_id).localeCompare(this.eventLabel(b.event_type_id)) ||
          a.priority - b.priority,
      );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<FlightTimingRule | null>(null);
  private editingRecord: FlightTimingRule | null = null;

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null, Validators.required),
    terminal_id: this.fb.control<string | null>(null),
    airport_sector_id: this.fb.control<string | null>(null),
    event_type_id: this.fb.control<number | null>(null, Validators.required),
    reference_time_id: this.fb.control<number | null>(null, Validators.required),
    flight_direction_id: this.fb.control<number | null>(null),
    flight_type_id: this.fb.control<number | null>(null),
    airline_id: this.fb.control<string | null>(null),
    destination_airport_id: this.fb.control<string | null>(null),
    resource_type_id: this.fb.control<number | null>(null),
    offset_minutes: this.fb.control<number | null>(0, [
      Validators.required,
      integerNumber,
      Validators.min(MIN_OFFSET),
      Validators.max(MAX_OFFSET),
    ]),
    priority: this.fb.control<number | null>(100, [
      Validators.required,
      integerNumber,
      Validators.min(MIN_PRIORITY),
      Validators.max(MAX_PRIORITY),
    ]),
    description: ['', [Validators.maxLength(200)]],
    is_active: [true],
  });

  private readonly formAirportId = toSignal(this.form.controls.airport_id.valueChanges, {
    initialValue: this.form.controls.airport_id.value,
  });
  protected readonly formTerminals = computed(() =>
    this.terminals().filter(
      (terminal) => terminal.airport_id === this.formAirportId() && terminal.is_active,
    ),
  );
  protected readonly formSectors = computed(() =>
    this.sectors().filter(
      (sector) => sector.airport_id === this.formAirportId() && sector.is_active,
    ),
  );

  ngOnInit(): void {
    this.loadCatalogs();
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      rules: this.ruleService.getAll(),
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
      sectors: this.sectorService.getAll(),
      airlines: this.airlineService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ rules, airports, terminals, sectors, airlines }) => {
          this.rules.set(rules ?? []);
          this.airports.set(airports ?? []);
          this.terminals.set(terminals ?? []);
          this.sectors.set(sectors ?? []);
          this.airlines.set(airlines ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalogs(): void {
    this.catalog.loadGroups(CATALOG_GROUPS).subscribe({
      next: (groups) => this.groups.set(groups),
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected featureText(feature: Feature): string {
    return feature.description || feature.abbreviation || String(feature.id);
  }

  protected eventLabel(id: number | null): string {
    return this.catalog.label(this.groups(), id);
  }

  protected airportLabel(id: string | null): string {
    if (!id) return '—';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected terminalLabel(id: string | null): string {
    if (!id) return '—';
    return this.terminals().find((item) => item.id === id)?.name || id;
  }

  protected sectorLabel(id: string | null): string {
    if (!id) return '—';
    const sector = this.sectors().find((item) => item.id === id);
    return sector ? `${sector.code} · ${sector.name}` : id;
  }

  protected airlineLabel(id: string | null): string {
    if (!id) return '—';
    const airline = this.airlines().find((item) => item.id === id);
    if (!airline) return id;
    const code = airline.iata_code || airline.oaci_code;
    const name = airline.company_name || airline.short_name || code || id;
    return `${name}${code && name !== code ? ` (${code})` : ''}${airline.is_active ? '' : ' - inactiva'}`;
  }

  protected offsetLabel(minutes: number): string {
    return `${minutes > 0 ? '+' : ''}${minutes} min`;
  }

  protected scopeSummary(rule: FlightTimingRule): string {
    const parts: string[] = [];
    if (rule.flight_direction_id !== null) {
      parts.push(this.catalog.label(this.groups(), rule.flight_direction_id));
    }
    if (rule.flight_type_id !== null) {
      parts.push(this.catalog.label(this.groups(), rule.flight_type_id));
    }
    if (rule.airline_id) parts.push(this.airlineLabel(rule.airline_id));
    if (rule.destination_airport_id) {
      parts.push(`Destino: ${this.airportLabel(rule.destination_airport_id)}`);
    }
    if (rule.resource_type_id !== null) {
      parts.push(this.catalog.label(this.groups(), rule.resource_type_id));
    }
    if (rule.terminal_id) parts.push(`Terminal: ${this.terminalLabel(rule.terminal_id)}`);
    if (rule.airport_sector_id) parts.push(`Sector: ${this.sectorLabel(rule.airport_sector_id)}`);
    return parts.length > 0 ? parts.join(' · ') : 'Todos los vuelos';
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingRecord = null;
    this.resetForm();
    this.form.controls.airport_id.setValue(this.selectedAirportId());
    this.form.controls.event_type_id.setValue(this.selectedEventTypeId());
    this.mode.set('create');
  }

  protected startEdit(rule: FlightTimingRule): void {
    if (!rule.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(rule.id);
    this.editingRecord = rule;
    this.form.reset({
      airport_id: rule.airport_id,
      terminal_id: rule.terminal_id,
      airport_sector_id: rule.airport_sector_id,
      event_type_id: rule.event_type_id,
      reference_time_id: rule.reference_time_id,
      flight_direction_id: rule.flight_direction_id,
      flight_type_id: rule.flight_type_id,
      airline_id: rule.airline_id,
      destination_airport_id: rule.destination_airport_id,
      resource_type_id: rule.resource_type_id,
      offset_minutes: rule.offset_minutes,
      priority: rule.priority,
      description: rule.description ?? '',
      is_active: rule.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.editingRecord = null;
    this.resetForm();
  }

  protected onFormAirportChange(): void {
    // Terminal y sector dependen del aeropuerto elegido.
    this.form.patchValue({ terminal_id: null, airport_sector_id: null });
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const isCreate = this.mode() === 'create';
    const current = isCreate ? null : this.editingRecord;
    const payload: FlightTimingRule = {
      ...current,
      id: isCreate ? null : this.editingId(),
      airport_id: raw.airport_id as string,
      terminal_id: raw.terminal_id,
      airport_sector_id: raw.airport_sector_id,
      event_type_id: raw.event_type_id as number,
      reference_time_id: raw.reference_time_id as number,
      flight_direction_id: raw.flight_direction_id,
      flight_type_id: raw.flight_type_id,
      airline_id: raw.airline_id,
      destination_airport_id: raw.destination_airport_id,
      resource_type_id: raw.resource_type_id,
      offset_minutes: raw.offset_minutes as number,
      priority: raw.priority as number,
      description: raw.description.trim() || null,
      is_active: isCreate ? true : raw.is_active,
      created_at: current?.created_at ?? null,
      updated_at: current?.updated_at ?? null,
      created_by: current?.created_by ?? null,
      modified_by: current?.modified_by ?? null,
    };
    this.isSaving.set(true);
    const request$ = isCreate ? this.ruleService.add(payload) : this.ruleService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingRecord = null;
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Regla creada correctamente.' : 'Regla actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(rule: FlightTimingRule): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(rule);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.ruleService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Regla desactivada correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private resetForm(): void {
    this.form.reset({
      airport_id: null,
      terminal_id: null,
      airport_sector_id: null,
      event_type_id: null,
      reference_time_id: null,
      flight_direction_id: null,
      flight_type_id: null,
      airline_id: null,
      destination_airport_id: null,
      resource_type_id: null,
      offset_minutes: 0,
      priority: 100,
      description: '',
      is_active: true,
    });
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
