import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { ClockInputDirective } from '../directives/clock-input.directive';
import {
  Airline,
  Airport,
  AirportResource,
  AirportResourceAllocation,
  Feature,
  FeatureGroup,
  Flight,
  Terminal,
  Turnaround,
} from '../models';
import {
  AirlineService,
  AirportResourceAllocationService,
  AirportResourceService,
  AirportService,
  FeatureService,
  FlightService,
  TerminalService,
  TurnaroundService,
} from '../services';
import {
  ResourceSelectorDialog,
  ResourceSelectorDialogData,
} from './resource-selector-dialog/resource-selector-dialog';

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .trim();
}

function clockValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null)?.trim() ?? '';
  if (value === '') return null;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? null : { clock: true };
}

function toApiDate(value: Date | null): string {
  if (!value) return '';
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function combineDateTime(date: Date | null, clock: string | null): string | null {
  if (!date) return null;
  return `${toApiDate(date)}T${clock?.trim() || '00:00'}`;
}

function allocationPeriodValidator(group: AbstractControl): ValidationErrors | null {
  const star = combineDateTime(group.get('star_date')?.value, group.get('star_clock')?.value);
  const endDate: Date | null = group.get('end_date')?.value ?? null;
  const endClock: string = (group.get('end_clock')?.value ?? '').trim();
  if (!endDate && endClock) return { endDateRequired: true };
  const end = combineDateTime(endDate, endClock);
  if (star && end && end < star) return { endBeforeStart: true };
  return null;
}

@Component({
  selector: 'app-airport-resource-allocations',
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
  templateUrl: './airport-resource-allocations.html',
  styleUrls: ['../catalogs/catalog-crud.css', './airport-resource-allocations.css'],
})
export class AirportResourceAllocations implements OnInit {
  private static readonly StatusGroupNames = [
    'estado asignacion recursos',
    'estados asignacion recursos',
    'estado de asignacion de recursos',
  ];
  private static readonly ResourceTypeGroupNames = ['tipos de recursos', 'tipo de recursos'];

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);
  private readonly allocationService = inject(AirportResourceAllocationService);
  private readonly airportResourceService = inject(AirportResourceService);
  private readonly flightService = inject(FlightService);
  private readonly turnaroundService = inject(TurnaroundService);
  private readonly airlineService = inject(AirlineService);
  private readonly featureService = inject(FeatureService);

  protected readonly allocations = signal<AirportResourceAllocation[]>([]);
  protected readonly resources = signal<AirportResource[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly flights = signal<Flight[]>([]);
  protected readonly turnarounds = signal<Turnaround[]>([]);
  protected readonly airlines = signal<Airline[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly search = signal('');
  protected readonly resourceTypeFilter = signal<number | null>(null);
  protected readonly flightFilter = signal<string | null>(null);
  protected readonly airlineFilter = signal<string | null>(null);
  protected readonly statusFilter = signal<number | null>(null);
  protected readonly dateFrom = signal<Date | null>(null);
  protected readonly dateTo = signal<Date | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly catalogLoaded = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<AirportResourceAllocation | null>(null);

  private readonly resourceIndex = computed(() => this.indexById(this.resources()));
  private readonly terminalIndex = computed(() => this.indexById(this.terminals()));
  private readonly flightIndex = computed(() => this.indexById(this.flights()));
  private readonly turnaroundIndex = computed(() => this.indexById(this.turnarounds()));
  private readonly airlineIndex = computed(() => this.indexById(this.airlines()));
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });

  protected readonly statuses = computed(() => this.featuresOfGroup(AirportResourceAllocations.StatusGroupNames));
  protected readonly resourceTypes = computed(() =>
    this.featuresOfGroup(AirportResourceAllocations.ResourceTypeGroupNames),
  );
  protected readonly activeFlights = computed(() => this.flights().filter((flight) => flight.is_active));
  protected readonly activeAirlines = computed(() => this.airlines().filter((airline) => airline.is_active));

  protected readonly hasActiveFilters = computed(
    () =>
      this.resourceTypeFilter() !== null ||
      this.flightFilter() !== null ||
      this.airlineFilter() !== null ||
      this.statusFilter() !== null ||
      this.dateFrom() !== null ||
      this.dateTo() !== null,
  );

  protected readonly filteredAllocations = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    const airportId = this.selectedAirportId();
    const resourceTypeId = this.resourceTypeFilter();
    const flightId = this.flightFilter();
    const airlineId = this.airlineFilter();
    const statusId = this.statusFilter();
    const from = this.dateFrom() ? toApiDate(this.dateFrom()) : null;
    const to = this.dateTo() ? toApiDate(this.dateTo()) : null;
    return this.allocations().filter((allocation) => {
      if (airportId && this.airportIdOfResource(allocation.airport_resource_id) !== airportId) {
        return false;
      }
      if (
        resourceTypeId !== null &&
        this.resourceIndex().get(allocation.airport_resource_id ?? '')?.resource_type_id !==
          resourceTypeId
      ) {
        return false;
      }
      if (flightId && allocation.flight_id !== flightId) return false;
      if (airlineId && allocation.airline_id !== airlineId) return false;
      if (statusId !== null && allocation.status_id !== statusId) return false;
      if (from || to) {
        const startDay = allocation.star_time?.substring(0, 10) ?? '';
        if (!startDay) return false;
        if (from && startDay < from) return false;
        if (to && startDay > to) return false;
      }
      if (!query) return true;
      return [
        this.resourceLabel(allocation.airport_resource_id),
        this.resourceTypeLabel(allocation.airport_resource_id),
        this.flightLabel(allocation.flight_id),
        this.turnaroundLabel(allocation.turnaround_id),
        this.airlineLabel(allocation.airline_id),
        this.featureLabel(allocation.status_id),
        allocation.notes,
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  });

  protected readonly form = this.fb.nonNullable.group(
    {
      airport_resource_id: this.fb.control<string | null>(null, Validators.required),
      flight_id: this.fb.control<string | null>(null),
      turnaround_id: this.fb.control<string | null>(null),
      airline_id: this.fb.control<string | null>(null),
      star_date: this.fb.control<Date | null>(null, Validators.required),
      star_clock: ['', [Validators.required, clockValidator]],
      end_date: this.fb.control<Date | null>(null),
      end_clock: ['', clockValidator],
      status_id: this.fb.control<number | null>(null, Validators.required),
      is_shared: [false],
      notes: [''],
      is_active: [true],
    },
    { validators: allocationPeriodValidator },
  );

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.selectedAirportId.set(params.get('airportId'));
    });
    this.load();
    this.loadCatalog();
  }

  protected clearFilters(): void {
    this.resourceTypeFilter.set(null);
    this.flightFilter.set(null);
    this.airlineFilter.set(null);
    this.statusFilter.set(null);
    this.dateFrom.set(null);
    this.dateTo.set(null);
  }

  protected load(): void {
    this.isLoading.set(true);
    this.allocationService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (allocations) => this.allocations.set(allocations ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): void {
    forkJoin({
      resources: this.airportResourceService.getAll(),
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
      flights: this.flightService.getAll(),
      turnarounds: this.turnaroundService.getAll(),
      airlines: this.airlineService.getAll(),
      groups: this.loadFeatureGroups$(),
    })
      .pipe(finalize(() => this.catalogLoaded.set(true)))
      .subscribe({
        next: ({ resources, airports, terminals, flights, turnarounds, airlines, groups }) => {
          this.resources.set(resources ?? []);
          this.airports.set(airports ?? []);
          this.terminals.set(terminals ?? []);
          this.flights.set(flights ?? []);
          this.turnarounds.set(turnarounds ?? []);
          this.airlines.set(airlines ?? []);
          this.groups.set(groups);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private featuresOfGroup(names: string[]): Feature[] {
    const wanted = new Set(names);
    const group = this.groups().find((item) => wanted.has(normalizeText(item.name)));
    return (group?.features ?? []).filter((feature) => feature.is_active);
  }

  private loadFeatureGroups$() {
    const wanted = new Set([
      ...AirportResourceAllocations.StatusGroupNames,
      ...AirportResourceAllocations.ResourceTypeGroupNames,
    ]);
    return this.featureService.getAllFeatureGroups().pipe(
      switchMap((groups) => {
        const relevant = (groups ?? []).filter((group) => wanted.has(normalizeText(group.name)));
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

  private indexById<T extends { id: string | null }>(items: T[]): Map<string, T> {
    const index = new Map<string, T>();
    for (const item of items) {
      if (item.id) index.set(item.id, item);
    }
    return index;
  }

  protected resourceLabel(id: string | null): string {
    if (!id) return '—';
    const resource = this.resourceIndex().get(id);
    if (!resource) return id;
    return `${resource.code}${resource.name ? ` · ${resource.name}` : ''}`;
  }

  protected resourceTypeLabel(resourceId: string | null): string {
    if (!resourceId) return '—';
    const resource = this.resourceIndex().get(resourceId);
    return resource ? this.featureLabel(resource.resource_type_id) : '—';
  }

  protected flightLabel(id: string | null): string {
    if (!id) return '—';
    const flight = this.flightIndex().get(id);
    if (!flight) return id;
    const identity = flight.flight_identity || flight.flight_number || flight.public_iata_code;
    const date = flight.schedule_date ? flight.schedule_date.substring(0, 10) : '';
    return [identity, date].filter(Boolean).join(' · ') || id;
  }

  protected turnaroundLabel(id: string | null): string {
    if (!id) return '—';
    const turnaround = this.turnaroundIndex().get(id);
    if (!turnaround) return id;
    return `${this.flightLabel(turnaround.arrival_flight_id)} → ${this.flightLabel(turnaround.departure_flight_id)}`;
  }

  protected airlineLabel(id: string | null): string {
    if (!id) return '—';
    return this.airlineIndex().get(id)?.company_name || id;
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description || String(id);
  }

  private airportIdOfResource(resourceId: string | null): string | null {
    if (!resourceId) return null;
    const terminalId = this.resourceIndex().get(resourceId)?.terminal_id;
    return terminalId ? (this.terminalIndex().get(terminalId)?.airport_id ?? null) : null;
  }

  protected resourceDetail(id: string | null): string {
    if (!id) return '';
    const resource = this.resourceIndex().get(id);
    if (!resource) return '';
    const terminal = resource.terminal_id ? this.terminalIndex().get(resource.terminal_id) : null;
    const airport = terminal?.airport_id
      ? this.airports().find((item) => item.id === terminal.airport_id)
      : null;
    return [
      this.featureLabel(resource.resource_type_id),
      terminal?.name,
      airport ? airport.iata_code || airport.oaci_code || airport.name : null,
    ]
      .filter((value) => value && value !== '—')
      .join(' · ');
  }

  protected openResourceSelector(): void {
    if (this.isSaving()) return;
    const control = this.form.controls.airport_resource_id;
    const currentId = control.value;
    const data: ResourceSelectorDialogData = {
      airports: this.airports().filter((airport) => airport.is_active),
      terminals: this.terminals(),
      resources: this.resources(),
      resourceTypes: this.resourceTypes(),
      airportId: this.airportIdOfResource(currentId) ?? this.selectedAirportId(),
      selectedId: currentId,
    };
    this.dialog
      .open(ResourceSelectorDialog, { width: '860px', maxWidth: '95vw', maxHeight: '90vh', data })
      .afterClosed()
      .subscribe((resourceId) => {
        control.markAsTouched();
        if (!resourceId) return;
        control.setValue(resourceId);
        control.markAsDirty();
      });
  }

  protected startCreate(): void {
    if (this.isSaving() || !this.catalogLoaded()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    this.mode.set('create');
  }

  protected startEdit(allocation: AirportResourceAllocation): void {
    if (!allocation.id || this.isSaving() || !this.catalogLoaded()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(allocation.id);
    this.form.reset({
      airport_resource_id: allocation.airport_resource_id,
      flight_id: allocation.flight_id,
      turnaround_id: allocation.turnaround_id,
      airline_id: allocation.airline_id,
      star_date: this.parseDate(allocation.star_time),
      star_clock: this.parseClock(allocation.star_time),
      end_date: this.parseDate(allocation.end_time),
      end_clock: this.parseClock(allocation.end_time),
      status_id: allocation.status_id,
      is_shared: allocation.is_shared ?? false,
      notes: allocation.notes ?? '',
      is_active: allocation.is_active ?? true,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.resetForm();
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: AirportResourceAllocation = {
      id: this.editingId(),
      airport_resource_id: raw.airport_resource_id,
      flight_id: raw.flight_id,
      turnaround_id: raw.turnaround_id,
      airline_id: raw.airline_id,
      star_time: combineDateTime(raw.star_date, raw.star_clock) ?? '',
      end_time: combineDateTime(raw.end_date, raw.end_clock),
      status_id: raw.status_id,
      is_shared: raw.is_shared,
      notes: raw.notes.trim() || null,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.allocationService.add(payload)
      : this.allocationService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Asignación creada correctamente.' : 'Asignación actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(allocation: AirportResourceAllocation): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(allocation);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.allocationService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Asignación desactivada correctamente.');
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

  private parseClock(value: string | null): string {
    if (!value || value.length < 16) return '';
    return value.substring(11, 16);
  }

  private resetForm(): void {
    this.form.reset({
      airport_resource_id: null,
      flight_id: null,
      turnaround_id: null,
      airline_id: null,
      star_date: null,
      star_clock: '',
      end_date: null,
      end_clock: '',
      status_id: null,
      is_shared: false,
      notes: '',
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
