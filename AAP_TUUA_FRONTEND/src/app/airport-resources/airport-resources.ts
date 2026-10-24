import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import {
  Airport,
  AirportResource,
  BaggageCarousel,
  BoardingGate,
  CheckinCounter,
  Feature,
  FeatureGroup,
  PassengerLoadingBridge,
  Stand,
  Terminal,
} from '../models';
import {
  AirportResourceService,
  AirportService,
  BaggageCarouselService,
  BoardingGateService,
  CheckinCounterService,
  FeatureService,
  PassengerLoadingBridgeService,
  StandService,
  TerminalService,
} from '../services';
import { notBlank } from '../validators/not-blank.validator';

type ResourceKind =
  | 'stand'
  | 'boarding_gate'
  | 'passenger_loading_bridge'
  | 'checkin_counter'
  | 'baggage_carousel'
  | 'generic';

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .trim();
}

@Component({
  selector: 'app-airport-resources',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './airport-resources.html',
  styleUrls: ['../catalogs/catalog-crud.css', './airport-resources.css'],
})
export class AirportResources implements OnInit {
  private static readonly ResourceTypeGroupNames = ['tipos de recursos', 'tipo de recursos'];
  private static readonly FlightTypeGroupNames = ['tipos de vuelo', 'tipo de vuelo'];
  private static readonly StatusGroupNames = ['estado de recursos', 'estados de recursos'];
  private static readonly AircraftSizeGroupNames = ['aircraft size codes', 'aircraft size code'];
  private static readonly BoardingTypeGroupNames = ['tipo de embarque', 'tipos de embarque'];
  private static readonly BridgeTypeGroupNames = ['tipos de plb', 'tipo de plb'];
  private static readonly CheckinTypeGroupNames = ['tipo de checkin', 'tipos de checkin'];
  private static readonly CarouselFunctionGroupNames = [
    'funcion faja de equipaje',
    'funciones faja de equipaje',
  ];
  private static readonly RelevantGroups = new Set([
    ...AirportResources.ResourceTypeGroupNames,
    ...AirportResources.FlightTypeGroupNames,
    ...AirportResources.StatusGroupNames,
    ...AirportResources.AircraftSizeGroupNames,
    ...AirportResources.BoardingTypeGroupNames,
    ...AirportResources.BridgeTypeGroupNames,
    ...AirportResources.CheckinTypeGroupNames,
    ...AirportResources.CarouselFunctionGroupNames,
  ]);

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly airportResourceService = inject(AirportResourceService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);
  private readonly featureService = inject(FeatureService);
  private readonly standService = inject(StandService);
  private readonly boardingGateService = inject(BoardingGateService);
  private readonly bridgeService = inject(PassengerLoadingBridgeService);
  private readonly checkinCounterService = inject(CheckinCounterService);
  private readonly baggageCarouselService = inject(BaggageCarouselService);

  protected readonly airportId = this.route.snapshot.paramMap.get('airportId') ?? '';
  protected readonly terminalId = this.route.snapshot.paramMap.get('terminalId') ?? '';
  protected readonly resources = signal<AirportResource[]>([]);
  protected readonly airport = signal<Airport | null>(null);
  protected readonly terminal = signal<Terminal | null>(null);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly stands = signal<Stand[]>([]);
  protected readonly gates = signal<BoardingGate[]>([]);
  protected readonly selectedTypeId = signal<number | 'all'>('all');
  protected readonly search = signal('');
  protected readonly isLoading = signal(false);
  protected readonly isLoadingSubtype = signal(false);
  protected readonly catalogLoaded = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly hasSubtype = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<AirportResource | null>(null);

  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });

  protected readonly resourceTypes = computed(() =>
    this.featuresOfGroup(AirportResources.ResourceTypeGroupNames).filter((feature) => feature.is_active),
  );
  protected readonly flightTypes = computed(() =>
    this.featuresOfGroup(AirportResources.FlightTypeGroupNames).filter((feature) => feature.is_active),
  );
  protected readonly statuses = computed(() =>
    this.featuresOfGroup(AirportResources.StatusGroupNames).filter((feature) => feature.is_active),
  );
  protected readonly aircraftSizes = computed(() =>
    this.featuresOfGroup(AirportResources.AircraftSizeGroupNames).filter((feature) => feature.is_active),
  );
  protected readonly boardingTypes = computed(() =>
    this.featuresOfGroup(AirportResources.BoardingTypeGroupNames).filter((feature) => feature.is_active),
  );
  protected readonly bridgeTypes = computed(() =>
    this.featuresOfGroup(AirportResources.BridgeTypeGroupNames).filter((feature) => feature.is_active),
  );
  protected readonly checkinTypes = computed(() =>
    this.featuresOfGroup(AirportResources.CheckinTypeGroupNames).filter((feature) => feature.is_active),
  );
  protected readonly carouselFunctions = computed(() =>
    this.featuresOfGroup(AirportResources.CarouselFunctionGroupNames).filter((feature) => feature.is_active),
  );

  protected readonly selectedTypeFeature = computed(() => {
    const id = this.selectedTypeId();
    return id === 'all' ? null : this.featureById(id);
  });
  protected readonly selectedKind = computed<ResourceKind>(() =>
    this.kindForFeature(this.selectedTypeFeature()),
  );
  protected readonly filteredResources = computed(() => {
    const typeId = this.selectedTypeId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.resources().filter((resource) => {
      if (typeId !== 'all' && resource.resource_type_id !== typeId) return false;
      if (!query) return true;
      return [
        resource.code,
        resource.name,
        this.featureLabel(resource.resource_type_id),
        this.featureLabel(resource.flight_type_id),
        this.featureLabel(resource.status_id),
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  });

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, notBlank, Validators.maxLength(20)]],
    name: [''],
    flight_type_id: this.fb.control<number | null>(null, Validators.required),
    status_id: this.fb.control<number | null>(null, Validators.required),
    is_active: [true],

    stand_is_contact: [true],
    stand_max_aircraft_size_type: this.fb.control<number | null>(null),
    stand_max_wingspan_m: this.fb.control<number | null>(null),
    stand_has_fixed_gpu: [false],
    stand_has_pca: [false],
    stand_has_fuel_hydrant: [false],

    gate_boarding_type_id: this.fb.control<number | null>(null),
    gate_default_stand_id: this.fb.control<string | null>(null),

    bridge_boarding_gate_id: this.fb.control<string | null>(null),
    bridge_stand_id: this.fb.control<string | null>(null),
    bridge_type_id: this.fb.control<number | null>(null),
    bridge_door_position: ['', Validators.maxLength(4)],
    bridge_max_aircraft_size_id: this.fb.control<number | null>(null),
    bridge_min_sill_height_m: this.fb.control<number | null>(null),
    bridge_max_sill_height_m: this.fb.control<number | null>(null),
    bridge_has_pca: [false],
    bridge_has_gpu_400hz: [false],
    bridge_manufacturer: [''],
    bridge_serial_number: [''],

    counter_island: ['', [Validators.maxLength(10)]],
    counter_type_id: this.fb.control<number | null>(null),
    counter_has_baggage_belt: [true],
    counter_is_common_use: [true],

    carousel_function_id: this.fb.control<number | null>(null),
    carousel_belt_length_m: this.fb.control<number | null>(null),
  });

  private readonly subtypeControlKeys = [
    'stand_max_aircraft_size_type',
    'stand_max_wingspan_m',
    'gate_boarding_type_id',
    'bridge_boarding_gate_id',
    'bridge_stand_id',
    'bridge_type_id',
    'bridge_max_aircraft_size_id',
    'bridge_min_sill_height_m',
    'bridge_max_sill_height_m',
    'counter_island',
    'counter_type_id',
    'carousel_function_id',
    'carousel_belt_length_m',
  ];

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      resources: this.airportResourceService.getByTerminalId(this.terminalId),
      airport: this.airportService.getById(this.airportId),
      terminal: this.terminalService.getById(this.terminalId),
      stands: this.standService.getByTerminalId(this.terminalId),
      gates: this.boardingGateService.getByTerminalId(this.terminalId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ resources, airport, terminal, stands, gates }) => {
          this.resources.set(resources ?? []);
          this.airport.set(airport);
          this.terminal.set(terminal);
          this.stands.set(stands ?? []);
          this.gates.set(gates ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): void {
    this.featureService
      .getAllFeatureGroups()
      .pipe(
        switchMap((groups) => {
          const relevant = (groups ?? []).filter((group) =>
            AirportResources.RelevantGroups.has(normalizeText(group.name)),
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
        finalize(() => this.catalogLoaded.set(true)),
      )
      .subscribe({
        next: (groups) => this.groups.set(groups),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private featuresOfGroup(names: string[]): Feature[] {
    const wanted = new Set(names.map((name) => normalizeText(name)));
    const group = this.groups().find((item) => wanted.has(normalizeText(item.name)));
    return group?.features ?? [];
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description || String(id);
  }

  protected featureById(id: number | null): Feature | null {
    if (id === null) return null;
    return this.featureIndex().get(id) ?? null;
  }

  protected kindForResource(resource: AirportResource): ResourceKind {
    return this.kindForFeature(this.featureById(resource.resource_type_id));
  }

  private kindForFeature(feature: Feature | null): ResourceKind {
    if (!feature) return 'generic';
    const text = normalizeText(
      `${feature.abbreviation ?? ''} ${feature.description ?? ''} ${feature.feature_value ?? ''}`,
    );
    if (/\bplb\b|passenger loading|\bbridge\b|puente|manga|finger/.test(text)) {
      return 'passenger_loading_bridge';
    }
    if (/boarding gate|puerta de embarque|puerta embarque|\bgate\b/.test(text)) {
      return 'boarding_gate';
    }
    if (/\bstand\b|estacionamiento|posicion de aeronave|posiciones de aeronave/.test(text)) {
      return 'stand';
    }
    if (/check\s?in|mostrador|isla de checkin/.test(text)) {
      return 'checkin_counter';
    }
    if (/carousel|faja|banda|equipaje|baggage/.test(text)) {
      return 'baggage_carousel';
    }
    return 'generic';
  }

  protected airportLabel(): string {
    const airport = this.airport();
    if (!airport) return this.airportId;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || this.airportId}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected terminalLabel(): string {
    return this.terminal()?.name || this.terminalId;
  }

  protected selectedTypeLabel(): string {
    const id = this.selectedTypeId();
    return id === 'all' ? '—' : this.featureLabel(id);
  }

  protected resourceLabel(resourceId: string | null): string {
    if (!resourceId) return '—';
    const resource = this.resources().find((item) => item.id === resourceId);
    if (!resource) return resourceId;
    return `${resource.code}${resource.name ? ` · ${resource.name}` : ''}`;
  }

  protected goBack(): void {
    this.router.navigate(['/airports', this.airportId, 'terminals']);
  }

  protected onTabChange(value: number | 'all'): void {
    this.selectedTypeId.set(value);
    this.clearMessages();
  }

  protected startCreate(): void {
    if (this.isSaving() || this.selectedTypeId() === 'all' || !this.catalogLoaded()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.hasSubtype.set(false);
    this.applyKindValidators(this.selectedKind());
    this.form.reset({
      code: '',
      name: '',
      flight_type_id: null,
      status_id: null,
      is_active: true,
      stand_is_contact: true,
      stand_max_aircraft_size_type: null,
      stand_max_wingspan_m: null,
      stand_has_fixed_gpu: false,
      stand_has_pca: false,
      stand_has_fuel_hydrant: false,
      gate_boarding_type_id: null,
      gate_default_stand_id: null,
      bridge_boarding_gate_id: null,
      bridge_stand_id: null,
      bridge_type_id: null,
      bridge_door_position: '',
      bridge_max_aircraft_size_id: null,
      bridge_min_sill_height_m: null,
      bridge_max_sill_height_m: null,
      bridge_has_pca: false,
      bridge_has_gpu_400hz: false,
      bridge_manufacturer: '',
      bridge_serial_number: '',
      counter_island: '',
      counter_type_id: null,
      counter_has_baggage_belt: true,
      counter_is_common_use: true,
      carousel_function_id: null,
      carousel_belt_length_m: null,
    });
    this.mode.set('create');
  }

  protected startEdit(resource: AirportResource): void {
    if (!resource.id || this.isSaving() || !this.catalogLoaded()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(resource.id);
    this.selectedTypeId.set(resource.resource_type_id ?? 'all');
    this.hasSubtype.set(false);
    const kind = this.kindForResource(resource);
    this.applyKindValidators(kind);
    this.form.reset({
      code: resource.code ?? '',
      name: resource.name ?? '',
      flight_type_id: resource.flight_type_id,
      status_id: resource.status_id,
      is_active: resource.is_active,
      stand_is_contact: true,
      stand_max_aircraft_size_type: null,
      stand_max_wingspan_m: null,
      stand_has_fixed_gpu: false,
      stand_has_pca: false,
      stand_has_fuel_hydrant: false,
      gate_boarding_type_id: null,
      gate_default_stand_id: null,
      bridge_boarding_gate_id: null,
      bridge_stand_id: null,
      bridge_type_id: null,
      bridge_door_position: '',
      bridge_max_aircraft_size_id: null,
      bridge_min_sill_height_m: null,
      bridge_max_sill_height_m: null,
      bridge_has_pca: false,
      bridge_has_gpu_400hz: false,
      bridge_manufacturer: '',
      bridge_serial_number: '',
      counter_island: '',
      counter_type_id: null,
      counter_has_baggage_belt: true,
      counter_is_common_use: true,
      carousel_function_id: null,
      carousel_belt_length_m: null,
    });
    this.mode.set('edit');
    this.isLoadingSubtype.set(true);
    this.loadSubtype$(resource.id, kind)
      .pipe(finalize(() => this.isLoadingSubtype.set(false)))
      .subscribe({
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadSubtype$(resourceId: string, kind: ResourceKind): Observable<unknown> {
    switch (kind) {
      case 'stand':
        return this.standService.getById(resourceId).pipe(
          map((stand) => {
            if (!stand) return;
            this.hasSubtype.set(true);
            this.form.patchValue({
              stand_is_contact: stand.is_contact,
              stand_max_aircraft_size_type: stand.max_aircraft_size_type,
              stand_max_wingspan_m: stand.max_wingspan_m,
              stand_has_fixed_gpu: stand.has_fixed_gpu,
              stand_has_pca: stand.has_pca,
              stand_has_fuel_hydrant: stand.has_fuel_hydrant,
            });
          }),
        );
      case 'boarding_gate':
        return this.boardingGateService.getById(resourceId).pipe(
          map((gate) => {
            if (!gate) return;
            this.hasSubtype.set(true);
            this.form.patchValue({
              gate_boarding_type_id: gate.boarding_type_id,
              gate_default_stand_id: gate.default_stand_id,
            });
          }),
        );
      case 'passenger_loading_bridge':
        return this.bridgeService.getById(resourceId).pipe(
          map((bridge) => {
            if (!bridge) return;
            this.hasSubtype.set(true);
            this.form.patchValue({
              bridge_boarding_gate_id: bridge.boarding_gate_id,
              bridge_stand_id: bridge.stand_id,
              bridge_type_id: bridge.bridge_type_id,
              bridge_door_position: bridge.door_position ?? '',
              bridge_max_aircraft_size_id: bridge.max_aircraft_size_id,
              bridge_min_sill_height_m: bridge.min_sill_height_m,
              bridge_max_sill_height_m: bridge.max_sill_height_m,
              bridge_has_pca: bridge.has_pca,
              bridge_has_gpu_400hz: bridge.has_gpu_400hz,
              bridge_manufacturer: bridge.manufacturer ?? '',
              bridge_serial_number: bridge.serial_number ?? '',
            });
          }),
        );
      case 'checkin_counter':
        return this.checkinCounterService.getById(resourceId).pipe(
          map((counter) => {
            if (!counter) return;
            this.hasSubtype.set(true);
            this.form.patchValue({
              counter_island: counter.island ?? '',
              counter_type_id: counter.counter_type_id,
              counter_has_baggage_belt: counter.has_baggage_belt,
              counter_is_common_use: counter.is_common_use,
            });
          }),
        );
      case 'baggage_carousel':
        return this.baggageCarouselService.getById(resourceId).pipe(
          map((carousel) => {
            if (!carousel) return;
            this.hasSubtype.set(true);
            this.form.patchValue({
              carousel_function_id: carousel.carousel_function_id,
              carousel_belt_length_m: carousel.belt_length_m,
            });
          }),
        );
      default:
        return of(undefined);
    }
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.hasSubtype.set(false);
    this.form.reset();
  }

  protected submit(): void {
    if (this.isSaving() || this.isLoadingSubtype() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const kind = this.selectedKind();
    const typeId = this.selectedTypeId();
    const payload: AirportResource = {
      id: this.editingId(),
      resource_type_id: typeId === 'all' ? null : typeId,
      terminal_id: this.terminalId,
      flight_type_id: raw.flight_type_id,
      status_id: raw.status_id,
      code: raw.code.trim(),
      name: raw.name.trim() || null,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    const subtypeIsCreate = isCreate || !this.hasSubtype();
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.airportResourceService.add(payload)
      : this.airportResourceService.update(payload);

    request$
      .pipe(
        switchMap((resource) => {
          if (!resource.id) {
            return throwError(() => new Error('No se pudo obtener el identificador del recurso.'));
          }
          return this.saveSubtype$(resource.id, kind, subtypeIsCreate).pipe(
            map(() => resource),
            catchError((error) => {
              if (isCreate) {
                this.airportResourceService.delete(resource.id!).subscribe({ error: () => undefined });
              }
              return throwError(() => error);
            }),
          );
        }),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.mode.set('list');
          this.editingId.set(null);
          this.hasSubtype.set(false);
          this.form.reset();
          this.successMessage.set(
            isCreate ? 'Recurso creado correctamente.' : 'Recurso actualizado correctamente.',
          );
          this.load();
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private saveSubtype$(resourceId: string, kind: ResourceKind, isCreate: boolean): Observable<unknown> {
    const raw = this.form.getRawValue();
    switch (kind) {
      case 'stand': {
        const stand: Stand = {
          resource_id: resourceId,
          is_contact: raw.stand_is_contact,
          max_aircraft_size_type: raw.stand_max_aircraft_size_type,
          max_wingspan_m: raw.stand_max_wingspan_m,
          has_fixed_gpu: raw.stand_has_fixed_gpu,
          has_pca: raw.stand_has_pca,
          has_fuel_hydrant: raw.stand_has_fuel_hydrant,
        };
        return isCreate ? this.standService.add(stand) : this.standService.update(stand);
      }
      case 'boarding_gate': {
        const gate: BoardingGate = {
          resource_id: resourceId,
          boarding_type_id: raw.gate_boarding_type_id,
          default_stand_id: raw.gate_default_stand_id,
          is_active: raw.is_active,
          created_at: null,
          updated_at: null,
          created_by: null,
          modified_by: null,
        };
        return isCreate
          ? this.boardingGateService.add(gate)
          : this.boardingGateService.update(gate);
      }
      case 'passenger_loading_bridge': {
        const bridge: PassengerLoadingBridge = {
          resource_id: resourceId,
          boarding_gate_id: raw.bridge_boarding_gate_id,
          stand_id: raw.bridge_stand_id,
          bridge_type_id: raw.bridge_type_id,
          door_position: raw.bridge_door_position.trim() || null,
          max_aircraft_size_id: raw.bridge_max_aircraft_size_id,
          min_sill_height_m: raw.bridge_min_sill_height_m,
          max_sill_height_m: raw.bridge_max_sill_height_m,
          has_pca: raw.bridge_has_pca,
          has_gpu_400hz: raw.bridge_has_gpu_400hz,
          manufacturer: raw.bridge_manufacturer.trim() || null,
          serial_number: raw.bridge_serial_number.trim() || null,
        };
        return isCreate ? this.bridgeService.add(bridge) : this.bridgeService.update(bridge);
      }
      case 'checkin_counter': {
        const counter: CheckinCounter = {
          resource_id: resourceId,
          terminal_id: this.terminalId,
          island: raw.counter_island.trim(),
          counter_type_id: raw.counter_type_id,
          has_baggage_belt: raw.counter_has_baggage_belt,
          is_common_use: raw.counter_is_common_use,
        };
        return isCreate
          ? this.checkinCounterService.add(counter)
          : this.checkinCounterService.update(counter);
      }
      case 'baggage_carousel': {
        const carousel: BaggageCarousel = {
          resource_id: resourceId,
          terminal_id: this.terminalId,
          carousel_function_id: raw.carousel_function_id,
          belt_length_m: raw.carousel_belt_length_m,
        };
        return isCreate
          ? this.baggageCarouselService.add(carousel)
          : this.baggageCarouselService.update(carousel);
      }
      default:
        return of(undefined);
    }
  }

  private applyKindValidators(kind: ResourceKind): void {
    const controls = this.form.controls as unknown as Record<string, AbstractControl>;
    for (const key of this.subtypeControlKeys) {
      controls[key].clearValidators();
    }

    switch (kind) {
      case 'stand':
        controls['stand_max_aircraft_size_type'].setValidators(Validators.required);
        controls['stand_max_wingspan_m'].setValidators(Validators.min(0.01));
        break;
      case 'boarding_gate':
        controls['gate_boarding_type_id'].setValidators(Validators.required);
        break;
      case 'passenger_loading_bridge':
        controls['bridge_boarding_gate_id'].setValidators(Validators.required);
        controls['bridge_stand_id'].setValidators(Validators.required);
        controls['bridge_type_id'].setValidators(Validators.required);
        controls['bridge_max_aircraft_size_id'].setValidators(Validators.required);
        controls['bridge_min_sill_height_m'].setValidators(Validators.min(0));
        controls['bridge_max_sill_height_m'].setValidators(Validators.min(0));
        break;
      case 'checkin_counter':
        controls['counter_island'].setValidators([Validators.required, notBlank, Validators.maxLength(10)]);
        controls['counter_type_id'].setValidators(Validators.required);
        break;
      case 'baggage_carousel':
        controls['carousel_function_id'].setValidators(Validators.required);
        controls['carousel_belt_length_m'].setValidators(Validators.min(0.01));
        break;
    }

    for (const key of this.subtypeControlKeys) {
      controls[key].updateValueAndValidity({ emitEvent: false });
    }
  }

  protected askDelete(resource: AirportResource): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(resource);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.airportResourceService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Recurso desactivado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
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
