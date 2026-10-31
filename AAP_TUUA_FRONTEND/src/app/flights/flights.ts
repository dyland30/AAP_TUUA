import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import {
  Aircraft,
  AircraftType,
  Airline,
  Airport,
  Feature,
  FeatureGroup,
  Flight,
  FlightCodeshare,
  Location,
  Runway,
  Terminal,
  Turnaround,
} from '../models';
import {
  AircraftService,
  AircraftTypeService,
  AirlineService,
  AirportService,
  FeatureService,
  FlightCodeshareService,
  FlightService,
  LocationService,
  RunwayService,
  TerminalService,
  TurnaroundService,
} from '../services';
import { ClockInputDirective } from '../directives/clock-input.directive';
import { notBlank } from '../validators/not-blank.validator';

function positiveIntegerValidator(control: AbstractControl): ValidationErrors | null {
  const value: number | null = control.value;
  return value === null || (Number.isInteger(value) && value > 0) ? null : { positiveInteger: true };
}

function clockValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null)?.trim() ?? '';
  if (value === '') return null;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? null : { clock: true };
}

@Component({
  selector: 'app-flights',
  imports: [
    DatePipe,
    ClockInputDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './flights.html',
  styleUrls: ['../catalogs/catalog-crud.css', './flights.css'],
})
export class Flights implements OnInit {
  private static readonly DirectionGroupNames = ['Tipo Operación Vuelo'];
  private static readonly FlightTypeGroupNames = ['Tipos de Vuelo'];
  private static readonly ServiceTypeGroupNames = [
    'Tipo Servicio IATA',
    'Tipos de Servicio IATA',
    'Tipo de Servicio IATA',
  ];
  private static readonly StatusGroupNames = ['Estados de Vuelo', 'Estado de Vuelo'];

  private readonly fb = inject(FormBuilder);
  private readonly flightService = inject(FlightService);
  private readonly turnaroundService = inject(TurnaroundService);
  private readonly codeshareService = inject(FlightCodeshareService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);
  private readonly locationService = inject(LocationService);
  private readonly airlineService = inject(AirlineService);
  private readonly aircraftService = inject(AircraftService);
  private readonly aircraftTypeService = inject(AircraftTypeService);
  private readonly runwayService = inject(RunwayService);
  private readonly featureService = inject(FeatureService);

  protected readonly flights = signal<Flight[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly airlines = signal<Airline[]>([]);
  protected readonly aircrafts = signal<Aircraft[]>([]);
  protected readonly aircraftTypes = signal<AircraftType[]>([]);
  protected readonly runways = signal<Runway[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedAircraftTypeId = signal<string | null>(null);

  protected readonly directionFeatures = computed(() =>
    this.featuresOfGroup(Flights.DirectionGroupNames),
  );
  protected readonly flightTypeFeatures = computed(() =>
    this.featuresOfGroup(Flights.FlightTypeGroupNames),
  );
  protected readonly serviceTypeFeatures = computed(() =>
    this.featuresOfGroup(Flights.ServiceTypeGroupNames),
  );
  protected readonly statusFeatures = computed(() => this.featuresOfGroup(Flights.StatusGroupNames));
  protected readonly filteredTerminals = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.terminals().filter((item) => item.airport_id === airportId) : this.terminals();
  });
  protected readonly filteredLocations = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.locations().filter((item) => item.airport_id === airportId) : this.locations();
  });
  protected readonly filteredRunways = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.runways().filter((item) => item.airport_id === airportId) : [];
  });
  protected readonly filteredAircrafts = computed(() => {
    const aircraftTypeId = this.selectedAircraftTypeId();
    return aircraftTypeId
      ? this.aircrafts().filter((item) => item.aircraft_type_id === aircraftTypeId)
      : this.aircrafts();
  });
  private readonly airportIndex = computed(() => this.indexById(this.airports()));
  private readonly terminalIndex = computed(() => this.indexById(this.terminals()));
  private readonly locationIndex = computed(() => this.indexById(this.locations()));
  private readonly airlineIndex = computed(() => this.indexById(this.airlines()));
  private readonly aircraftTypeIndex = computed(() => this.indexById(this.aircraftTypes()));
  private readonly aircraftIndex = computed(() => this.indexById(this.aircrafts()));
  private readonly runwayIndex = computed(() => this.indexById(this.runways()));
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });

  protected readonly search = signal('');
  protected readonly filteredFlights = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.flights().filter((flight) =>
      !query ||
      [
        flight.flight_identity,
        flight.flight_number,
        flight.public_iata_code,
        flight.operational_iata_code,
        flight.origin_airport_code,
        flight.destination_airprt_code,
        this.airlineLabel(flight.airline_id),
        this.featureLabel(flight.flight_type_id),
        this.featureLabel(flight.status_id),
      ].some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<Flight | null>(null);

  protected readonly relatedTurnarounds = signal<Turnaround[]>([]);
  protected readonly relatedCodeshares = signal<FlightCodeshare[]>([]);
  protected readonly isLoadingRelated = signal(false);
  protected readonly isSavingRelated = signal(false);
  protected readonly turnaroundMode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingTurnaroundId = signal<string | null>(null);
  protected readonly turnaroundDeleteTarget = signal<Turnaround | null>(null);
  protected readonly codeshareDeleteTarget = signal<FlightCodeshare | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null, Validators.required),
    terminal_id: this.fb.control<string | null>(null, Validators.required),
    location_id: this.fb.control<string | null>(null, Validators.required),
    other_airport_id: this.fb.control<string | null>(null, Validators.required),
    origin_airport_code: ['', [Validators.required, notBlank, Validators.maxLength(5)]],
    destination_airprt_code: ['', [Validators.required, notBlank, Validators.maxLength(5)]],
    flight_direction_id: this.fb.control<number | null>(null, Validators.required),
    flight_type_id: this.fb.control<number | null>(null),
    service_type_id: this.fb.control<number | null>(null, Validators.required),
    aircraft_type_id: this.fb.control<string | null>(null),
    aircraft_id: this.fb.control<string | null>(null),
    airline_id: this.fb.control<string | null>(null),
    public_iata_code: ['', Validators.maxLength(5)],
    operational_iata_code: ['', Validators.maxLength(5)],
    flight_number: ['', Validators.maxLength(5)],
    flight_identity: ['', Validators.maxLength(10)],
    schedule_date: this.fb.control<Date | null>(null, Validators.required),
    scheduled_time: this.fb.control<Date | null>(null, Validators.required),
    scheduled_clock: ['', [Validators.required, clockValidator]],
    estimated_time: this.fb.control<Date | null>(null),
    estimated_clock: ['', clockValidator],
    actual_runway_time: this.fb.control<Date | null>(null),
    actual_runway_clock: ['', clockValidator],
    actual_block_time: this.fb.control<Date | null>(null),
    actual_block_clock: ['', clockValidator],
    status_id: this.fb.control<number | null>(null, Validators.required),
    runway_id: this.fb.control<string | null>(null),
    diverted_to_id: this.fb.control<string | null>(null),
    remarks: [''],
    is_active: [true],
  });

  protected readonly turnaroundForm = this.fb.nonNullable.group({
    arrival_flight_id: this.fb.control<string | null>(null),
    departure_flight_id: this.fb.control<string | null>(null),
    min_ground_time: this.fb.control<number | null>(null, positiveIntegerValidator),
  });

  protected readonly codeshareForm = this.fb.nonNullable.group({
    airline_id: this.fb.control<string | null>(null, Validators.required),
    flight_identity: ['', [Validators.required, notBlank, Validators.maxLength(10)]],
  });

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
    this.loadFeatureGroups();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.flightService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (flights) => this.flights.set(flights ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): void {
    forkJoin({
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
      locations: this.locationService.getAll(),
      airlines: this.airlineService.getAll(),
      aircrafts: this.aircraftService.getAll(),
      aircraftTypes: this.aircraftTypeService.getAll(),
      runways: this.runwayService.getAll(),
    }).subscribe({
      next: ({ airports, terminals, locations, airlines, aircrafts, aircraftTypes, runways }) => {
        this.airports.set(airports ?? []);
        this.terminals.set(terminals ?? []);
        this.locations.set(locations ?? []);
        this.airlines.set(airlines ?? []);
        this.aircrafts.set(aircrafts ?? []);
        this.aircraftTypes.set(aircraftTypes ?? []);
        this.runways.set(runways ?? []);
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  private loadFeatureGroups(): void {
    const relevantNames = [
      ...Flights.DirectionGroupNames,
      ...Flights.FlightTypeGroupNames,
      ...Flights.ServiceTypeGroupNames,
      ...Flights.StatusGroupNames,
    ];
    this.featureService
      .getAllFeatureGroups()
      .pipe(
        switchMap((groups) => {
          const relevant = (groups ?? []).filter((group) =>
            relevantNames.some((name) => Flights.sameName(group.name, name)),
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

  private loadRelated(flightId: string): void {
    this.isLoadingRelated.set(true);
    forkJoin({
      arrivals: this.turnaroundService.getByArrivalFlightId(flightId),
      departures: this.turnaroundService.getByDepartureFlightId(flightId),
      codeshares: this.codeshareService.getByFlightId(flightId),
    })
      .pipe(finalize(() => this.isLoadingRelated.set(false)))
      .subscribe({
        next: ({ arrivals, departures, codeshares }) => {
          const turnarounds = [...(arrivals ?? []), ...(departures ?? [])];
          const unique = new Map<string, Turnaround>();
          for (const turnaround of turnarounds) {
            if (turnaround.id) unique.set(turnaround.id, turnaround);
          }
          this.relatedTurnarounds.set([...unique.values()]);
          this.relatedCodeshares.set(codeshares ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private static sameName(candidate: string | null, target: string): boolean {
    return (candidate ?? '').trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
  }

  private featuresOfGroup(names: string[]): Feature[] {
    const group = this.groups().find((item) =>
      names.some((name) => Flights.sameName(item.name, name)),
    );
    return group?.features ?? [];
  }

  private indexById<T extends { id: string | null }>(items: T[]): Map<string, T> {
    const index = new Map<string, T>();
    for (const item of items) {
      if (item.id) index.set(item.id, item);
    }
    return index;
  }

  protected airportLabel(id: string | null): string {
    if (!id) return '—';
    const airport = this.airportIndex().get(id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return code ? `${code} - ${airport.name ?? ''}`.trim() : airport.name || id;
  }

  protected terminalLabel(id: string | null): string {
    if (!id) return '—';
    return this.terminalIndex().get(id)?.name || id;
  }

  protected locationLabel(id: string | null): string {
    if (!id) return '—';
    return this.locationIndex().get(id)?.name || id;
  }

  protected airlineLabel(id: string | null): string {
    if (!id) return '—';
    return this.airlineIndex().get(id)?.company_name || id;
  }

  protected aircraftTypeLabel(id: string | null): string {
    if (!id) return '—';
    const aircraftType = this.aircraftTypeIndex().get(id);
    if (!aircraftType) return id;
    return `${aircraftType.icao_code || '—'} - ${aircraftType.model || '—'}`;
  }

  protected aircraftLabel(id: string | null): string {
    if (!id) return '—';
    return this.aircraftIndex().get(id)?.registration || id;
  }

  protected runwayLabel(id: string | null): string {
    if (!id) return '—';
    return this.runwayIndex().get(id)?.designator || id;
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description || String(id);
  }

  protected flightLabel(id: string | null): string {
    if (!id) return '—';
    const flight = this.flights().find((item) => item.id === id);
    if (!flight) return id;
    const identity = flight.flight_identity || flight.flight_number || flight.public_iata_code;
    const date = flight.schedule_date ? flight.schedule_date.substring(0, 10) : '';
    return [identity, date].filter(Boolean).join(' · ') || id;
  }

  protected onAirportChange(airportId: string | null): void {
    this.selectedAirportId.set(airportId);
    this.form.controls.terminal_id.setValue(null);
    this.form.controls.location_id.setValue(null);
    this.form.controls.runway_id.setValue(null);
  }

  protected onAircraftTypeChange(aircraftTypeId: string | null): void {
    this.selectedAircraftTypeId.set(aircraftTypeId);
    this.form.controls.aircraft_id.setValue(null);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetRelated();
    this.resetForm();
    this.mode.set('create');
  }

  protected startEdit(flight: Flight): void {
    if (!flight.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(flight.id);
    this.selectedAirportId.set(flight.airport_id);
    this.selectedAircraftTypeId.set(flight.aircraft_type_id);
    this.form.reset({
      airport_id: flight.airport_id,
      terminal_id: flight.terminal_id,
      location_id: flight.location_id,
      other_airport_id: flight.other_airport_id,
      origin_airport_code: flight.origin_airport_code ?? '',
      destination_airprt_code: flight.destination_airprt_code ?? '',
      flight_direction_id: flight.flight_direction_id,
      flight_type_id: flight.flight_type_id,
      service_type_id: flight.service_type_id,
      aircraft_type_id: flight.aircraft_type_id,
      aircraft_id: flight.aircraft_id,
      airline_id: flight.airline_id,
      public_iata_code: flight.public_iata_code ?? '',
      operational_iata_code: flight.operational_iata_code ?? '',
      flight_number: flight.flight_number ?? '',
      flight_identity: flight.flight_identity ?? '',
      schedule_date: this.parseDate(flight.schedule_date),
      scheduled_time: this.parseDate(flight.scheduled_time),
      scheduled_clock: this.parseClock(flight.scheduled_time),
      estimated_time: this.parseDate(flight.estimated_time),
      estimated_clock: this.parseClock(flight.estimated_time),
      actual_runway_time: this.parseDate(flight.actual_runway_time),
      actual_runway_clock: this.parseClock(flight.actual_runway_time),
      actual_block_time: this.parseDate(flight.actual_block_time),
      actual_block_clock: this.parseClock(flight.actual_block_time),
      status_id: flight.status_id,
      runway_id: flight.runway_id,
      diverted_to_id: flight.diverted_to_id,
      remarks: flight.remarks ?? '',
      is_active: flight.is_active ?? true,
    });
    this.resetRelated();
    this.loadRelated(flight.id);
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.resetForm();
    this.resetRelated();
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: Flight = {
      id: this.editingId(),
      airport_id: raw.airport_id,
      terminal_id: raw.terminal_id,
      location_id: raw.location_id,
      other_airport_id: raw.other_airport_id,
      origin_airport_code: raw.origin_airport_code.trim().toUpperCase(),
      destination_airprt_code: raw.destination_airprt_code.trim().toUpperCase(),
      flight_direction_id: raw.flight_direction_id,
      flight_type_id: raw.flight_type_id,
      service_type_id: raw.service_type_id,
      aircraft_type_id: raw.aircraft_type_id,
      aircraft_id: raw.aircraft_id,
      airline_id: raw.airline_id,
      public_iata_code: raw.public_iata_code.trim().toUpperCase() || null,
      operational_iata_code: raw.operational_iata_code.trim().toUpperCase() || null,
      flight_number: raw.flight_number.trim() || null,
      flight_identity: raw.flight_identity.trim().toUpperCase() || null,
      schedule_date: this.toApiDate(raw.schedule_date),
      scheduled_time: this.combineDateTime(raw.scheduled_time, raw.scheduled_clock) ?? '',
      estimated_time: this.combineDateTime(raw.estimated_time, raw.estimated_clock),
      actual_runway_time: this.combineDateTime(raw.actual_runway_time, raw.actual_runway_clock),
      actual_block_time: this.combineDateTime(raw.actual_block_time, raw.actual_block_clock),
      status_id: raw.status_id,
      runway_id: raw.runway_id,
      diverted_to_id: raw.diverted_to_id,
      remarks: raw.remarks.trim() || null,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate ? this.flightService.add(payload) : this.flightService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (flight) => {
        this.editingId.set(flight.id ?? this.editingId());
        this.mode.set('edit');
        this.successMessage.set(
          isCreate
            ? 'Vuelo creado correctamente. Ya puede registrar turnarounds y codeshares.'
            : 'Vuelo actualizado correctamente.',
        );
        this.load();
        if (flight.id) this.loadRelated(flight.id);
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(flight: Flight): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(flight);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.flightService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Vuelo desactivado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  protected startTurnaroundCreate(): void {
    if (this.isSavingRelated() || !this.editingId()) return;
    this.clearMessages();
    this.turnaroundDeleteTarget.set(null);
    this.editingTurnaroundId.set(null);
    this.turnaroundForm.reset({
      arrival_flight_id: null,
      departure_flight_id: this.editingId(),
      min_ground_time: null,
    });
    this.turnaroundMode.set('create');
  }

  protected startTurnaroundEdit(turnaround: Turnaround): void {
    if (!turnaround.id || this.isSavingRelated()) return;
    this.clearMessages();
    this.turnaroundDeleteTarget.set(null);
    this.editingTurnaroundId.set(turnaround.id);
    this.turnaroundForm.reset({
      arrival_flight_id: turnaround.arrival_flight_id,
      departure_flight_id: turnaround.departure_flight_id,
      min_ground_time: turnaround.min_ground_time,
    });
    this.turnaroundMode.set('edit');
  }

  protected cancelTurnaroundForm(): void {
    if (this.isSavingRelated()) return;
    this.turnaroundMode.set('list');
    this.editingTurnaroundId.set(null);
    this.turnaroundForm.reset();
  }

  protected submitTurnaround(): void {
    const flightId = this.editingId();
    if (!flightId || this.isSavingRelated() || this.turnaroundMode() === 'list') return;
    this.clearMessages();
    if (this.turnaroundForm.invalid) {
      this.turnaroundForm.markAllAsTouched();
      return;
    }

    const raw = this.turnaroundForm.getRawValue();
    if (!raw.arrival_flight_id && !raw.departure_flight_id) {
      this.errorMessage.set('Debe seleccionar al menos un vuelo de llegada o salida.');
      return;
    }
    if (raw.arrival_flight_id && raw.arrival_flight_id === raw.departure_flight_id) {
      this.errorMessage.set('El vuelo de llegada y salida no pueden ser el mismo.');
      return;
    }
    if (raw.arrival_flight_id !== flightId && raw.departure_flight_id !== flightId) {
      this.errorMessage.set('El turnaround debe incluir el vuelo actual.');
      return;
    }

    const payload: Turnaround = {
      id: this.editingTurnaroundId(),
      arrival_flight_id: raw.arrival_flight_id,
      departure_flight_id: raw.departure_flight_id,
      min_ground_time: raw.min_ground_time,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.turnaroundMode() === 'create';
    this.isSavingRelated.set(true);
    const request$ = isCreate
      ? this.turnaroundService.add(payload)
      : this.turnaroundService.update(payload);
    request$.pipe(finalize(() => this.isSavingRelated.set(false))).subscribe({
      next: () => {
        this.turnaroundMode.set('list');
        this.editingTurnaroundId.set(null);
        this.turnaroundForm.reset();
        this.successMessage.set(
          isCreate ? 'Turnaround registrado correctamente.' : 'Turnaround actualizado correctamente.',
        );
        this.loadRelated(flightId);
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDeleteTurnaround(turnaround: Turnaround): void {
    if (this.isSavingRelated()) return;
    this.clearMessages();
    this.turnaroundDeleteTarget.set(turnaround);
  }

  protected cancelDeleteTurnaround(): void {
    if (!this.isSavingRelated()) this.turnaroundDeleteTarget.set(null);
  }

  protected confirmDeleteTurnaround(): void {
    const target = this.turnaroundDeleteTarget();
    const flightId = this.editingId();
    if (!target?.id || !flightId || this.isSavingRelated()) return;
    this.isSavingRelated.set(true);
    this.turnaroundService
      .delete(target.id)
      .pipe(finalize(() => this.isSavingRelated.set(false)))
      .subscribe({
        next: () => {
          this.turnaroundDeleteTarget.set(null);
          this.successMessage.set('Turnaround eliminado correctamente.');
          this.loadRelated(flightId);
        },
        error: (error: HttpErrorResponse) => {
          this.turnaroundDeleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  protected submitCodeshare(): void {
    const flightId = this.editingId();
    if (!flightId || this.isSavingRelated()) return;
    this.clearMessages();
    if (this.codeshareForm.invalid) {
      this.codeshareForm.markAllAsTouched();
      return;
    }

    const raw = this.codeshareForm.getRawValue();
    if (!raw.airline_id) return;
    const payload: FlightCodeshare = {
      flight_id: flightId,
      airline_id: raw.airline_id,
      flight_identity: raw.flight_identity.trim().toUpperCase(),
    };
    this.isSavingRelated.set(true);
    this.codeshareService
      .add(payload)
      .pipe(finalize(() => this.isSavingRelated.set(false)))
      .subscribe({
        next: () => {
          this.codeshareForm.reset({ airline_id: null, flight_identity: '' });
          this.successMessage.set('Codeshare registrado correctamente.');
          this.loadRelated(flightId);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected askDeleteCodeshare(codeshare: FlightCodeshare): void {
    if (this.isSavingRelated()) return;
    this.clearMessages();
    this.codeshareDeleteTarget.set(codeshare);
  }

  protected cancelDeleteCodeshare(): void {
    if (!this.isSavingRelated()) this.codeshareDeleteTarget.set(null);
  }

  protected confirmDeleteCodeshare(): void {
    const target = this.codeshareDeleteTarget();
    const flightId = this.editingId();
    if (!target || !flightId || this.isSavingRelated()) return;
    this.isSavingRelated.set(true);
    this.codeshareService
      .delete(flightId, target.airline_id, target.flight_identity)
      .pipe(finalize(() => this.isSavingRelated.set(false)))
      .subscribe({
        next: () => {
          this.codeshareDeleteTarget.set(null);
          this.successMessage.set('Codeshare eliminado correctamente.');
          this.loadRelated(flightId);
        },
        error: (error: HttpErrorResponse) => {
          this.codeshareDeleteTarget.set(null);
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

  private parseClock(value: string | null): string {
    if (!value || value.length < 16) return '';
    return value.substring(11, 16);
  }

  private toApiDate(value: Date | null): string {
    if (!value) return '';
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private combineDateTime(value: Date | null, clock: string): string | null {
    if (!value) return null;
    const time = clock?.trim() || '00:00';
    return `${this.toApiDate(value)}T${time}`;
  }

  private resetForm(): void {
    this.selectedAirportId.set(null);
    this.selectedAircraftTypeId.set(null);
    this.form.reset({
      airport_id: null,
      terminal_id: null,
      location_id: null,
      other_airport_id: null,
      origin_airport_code: '',
      destination_airprt_code: '',
      flight_direction_id: null,
      flight_type_id: null,
      service_type_id: null,
      aircraft_type_id: null,
      aircraft_id: null,
      airline_id: null,
      public_iata_code: '',
      operational_iata_code: '',
      flight_number: '',
      flight_identity: '',
      schedule_date: null,
      scheduled_time: null,
      scheduled_clock: '',
      estimated_time: null,
      estimated_clock: '',
      actual_runway_time: null,
      actual_runway_clock: '',
      actual_block_time: null,
      actual_block_clock: '',
      status_id: null,
      runway_id: null,
      diverted_to_id: null,
      remarks: '',
      is_active: true,
    });
  }

  private resetRelated(): void {
    this.relatedTurnarounds.set([]);
    this.relatedCodeshares.set([]);
    this.turnaroundMode.set('list');
    this.editingTurnaroundId.set(null);
    this.turnaroundDeleteTarget.set(null);
    this.codeshareDeleteTarget.set(null);
    this.turnaroundForm.reset({
      arrival_flight_id: null,
      departure_flight_id: null,
      min_ground_time: null,
    });
    this.codeshareForm.reset({ airline_id: null, flight_identity: '' });
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
