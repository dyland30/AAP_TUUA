import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
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
  Airport,
  AirportResource,
  AirportSector,
  BehaviorGroup,
  Device,
  Feature,
  FeatureGroup,
  Terminal,
  VideoWall,
} from '../models';
import {
  AirportResourceService,
  AirportSectorService,
  AirportService,
  BehaviorGroupService,
  DeviceService,
  FeatureCatalogService,
  TerminalService,
  VideoWallService,
} from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

const IPV4 = /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/;
const IPV6 = /^(?=.*:)[0-9a-fA-F:.]+$/;
const MAC = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
const HOSTNAME = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/;

function ipAddress(control: AbstractControl<string | null>): ValidationErrors | null {
  const value = control.value?.trim();
  if (!value) return null;
  return IPV4.test(value) || IPV6.test(value) ? null : { ipAddress: true };
}

function macAddress(control: AbstractControl<string | null>): ValidationErrors | null {
  const value = control.value?.trim();
  if (!value) return null;
  return MAC.test(value) ? null : { macAddress: true };
}

function hostname(control: AbstractControl<string | null>): ValidationErrors | null {
  const value = control.value?.trim();
  if (!value) return null;
  return HOSTNAME.test(value) ? null : { hostname: true };
}

function integer(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined) return null;
  return Number.isInteger(value) ? null : { integer: true };
}

@Component({
  selector: 'app-devices',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './devices.html',
  styleUrls: ['../catalogs/catalog-crud.css'],
  styles: [
    `
      .catalog__badge.device__badge--error {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }

      .catalog__badge.device__badge--offline {
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
      }

      .device__sub {
        display: block;
        font-size: 0.8rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .device__section {
        margin: 0.75rem 0 0;
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .device__info {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem 1rem;
        margin: 0;
        padding: 1rem;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        background: var(--mat-sys-surface-container-low);
      }

      .device__info dt {
        font-size: 0.75rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .device__info dd {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
      }

      @media (max-width: 720px) {
        .device__info {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class Devices implements OnInit {
  private static readonly CatalogNames = [
    'estados dispositivo',
    'tipos pantalla',
    'orientacion pantalla',
    'resoluciones pantalla',
  ];
  private static readonly StatusGroup = 'estados dispositivo';
  private static readonly DisplayTypeGroup = 'tipos pantalla';
  private static readonly OrientationGroup = 'orientacion pantalla';
  private static readonly ResolutionGroup = 'resoluciones pantalla';

  private readonly fb = inject(FormBuilder);
  private readonly deviceService = inject(DeviceService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);
  private readonly sectorService = inject(AirportSectorService);
  private readonly resourceService = inject(AirportResourceService);
  private readonly behaviorGroupService = inject(BehaviorGroupService);
  private readonly videoWallService = inject(VideoWallService);
  private readonly catalog = inject(FeatureCatalogService);

  protected readonly devices = signal<Device[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly sectors = signal<AirportSector[]>([]);
  protected readonly resources = signal<AirportResource[]>([]);
  protected readonly behaviorGroups = signal<BehaviorGroup[]>([]);
  protected readonly videoWalls = signal<VideoWall[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);

  protected readonly statuses = computed(() =>
    this.catalog.featuresOf(this.groups(), Devices.StatusGroup),
  );
  protected readonly displayTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), Devices.DisplayTypeGroup),
  );
  protected readonly orientations = computed(() =>
    this.catalog.featuresOf(this.groups(), Devices.OrientationGroup),
  );
  protected readonly resolutions = computed(() =>
    this.catalog.featuresOf(this.groups(), Devices.ResolutionGroup),
  );
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });

  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly statusFilter = signal<number | null>(null);
  protected readonly displayTypeFilter = signal<number | null>(null);
  protected readonly groupFilter = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly filteredDevices = computed(() => {
    const airportId = this.selectedAirportId();
    const statusId = this.statusFilter();
    const displayTypeId = this.displayTypeFilter();
    const groupId = this.groupFilter();
    const query = this.search().trim().toLocaleLowerCase();
    return this.devices().filter(
      (device) =>
        (!airportId || device.airport_id === airportId) &&
        (statusId === null || device.status_id === statusId) &&
        (displayTypeId === null || device.display_type_id === displayTypeId) &&
        (!groupId || device.behavior_group_id === groupId) &&
        (!query ||
          [device.code, device.name, device.ip_address, device.hostname].some((value) =>
            value?.toLocaleLowerCase().includes(query),
          )),
    );
  });
  protected readonly filterGroups = computed(() => {
    const airportId = this.selectedAirportId();
    return this.behaviorGroups().filter(
      (group) => !airportId || !group.airport_id || group.airport_id === airportId,
    );
  });

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingDevice = signal<Device | null>(null);
  protected readonly deleteTarget = signal<Device | null>(null);

  // Cantidad de posiciones de la videowall elegida (6 por defecto).
  private positionLimit = 6;
  private readonly positionValidator = (
    control: AbstractControl<number | null>,
  ): ValidationErrors | null => {
    const wallId = control.parent?.get('video_wall_id')?.value as string | null | undefined;
    const value = control.value;
    if (!wallId) return null;
    if (value === null || value === undefined) return { required: true };
    return Number.isInteger(value) && value >= 1 && value <= this.positionLimit
      ? null
      : { range: true };
  };

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, notBlank, Validators.maxLength(50)]],
    name: ['', [Validators.maxLength(100)]],
    serial_number: ['', [Validators.maxLength(100)]],
    manufacturer: ['', [Validators.maxLength(100)]],
    model: ['', [Validators.maxLength(100)]],
    airport_id: this.fb.control<string | null>(null, Validators.required),
    airport_sector_id: this.fb.control<string | null>(null),
    terminal_id: this.fb.control<string | null>(null),
    airport_resource_id: this.fb.control<string | null>(null),
    location_description: ['', [Validators.maxLength(200)]],
    ip_address: ['', [Validators.maxLength(50), ipAddress]],
    mac_address: ['', [Validators.maxLength(17), macAddress]],
    hostname: ['', [Validators.maxLength(100), hostname]],
    display_type_id: this.fb.control<number | null>(null, Validators.required),
    orientation_id: this.fb.control<number | null>(null, Validators.required),
    resolution_id: this.fb.control<number | null>(null, Validators.required),
    behavior_group_id: this.fb.control<string | null>(null),
    video_wall_id: this.fb.control<string | null>(null),
    video_wall_position: this.fb.control<number | null>(null, this.positionValidator),
    status_id: this.fb.control<number | null>(null, Validators.required),
    ssh_port: this.fb.control<number | null>(null, [
      integer,
      Validators.min(1),
      Validators.max(65535),
    ]),
    vnc_port: this.fb.control<number | null>(null, [
      integer,
      Validators.min(1),
      Validators.max(65535),
    ]),
    remote_credential_ref: ['', [Validators.maxLength(200)]],
    is_active: [true],
  });

  private readonly formAirportId = toSignal(this.form.controls.airport_id.valueChanges, {
    initialValue: this.form.controls.airport_id.value,
  });
  private readonly formTerminalId = toSignal(this.form.controls.terminal_id.valueChanges, {
    initialValue: this.form.controls.terminal_id.value,
  });
  protected readonly formVideoWallId = toSignal(this.form.controls.video_wall_id.valueChanges, {
    initialValue: this.form.controls.video_wall_id.value,
  });

  protected readonly formTerminals = computed(() =>
    this.terminals().filter((terminal) => terminal.airport_id === this.formAirportId()),
  );
  protected readonly formSectors = computed(() => {
    const airportId = this.formAirportId();
    const terminalId = this.formTerminalId();
    const current = this.editingDevice()?.airport_sector_id;
    return this.sectors().filter(
      (sector) =>
        sector.airport_id === airportId &&
        (sector.is_active || sector.id === current) &&
        (!terminalId || !sector.terminal_id || sector.terminal_id === terminalId),
    );
  });
  protected readonly formResources = computed(() => {
    const airportId = this.formAirportId();
    const terminalId = this.formTerminalId();
    const current = this.editingDevice()?.airport_resource_id;
    const terminalIds = new Set(
      this.terminals()
        .filter((terminal) => terminal.airport_id === airportId)
        .map((terminal) => terminal.id),
    );
    const sectorIds = new Set(
      this.sectors()
        .filter((sector) => sector.airport_id === airportId)
        .map((sector) => sector.id),
    );
    return this.resources().filter((resource) => {
      if (!resource.is_active && resource.id !== current) return false;
      if (terminalId) return resource.terminal_id === terminalId;
      return (
        (resource.terminal_id !== null && terminalIds.has(resource.terminal_id)) ||
        (resource.airport_sector_id !== null && sectorIds.has(resource.airport_sector_id))
      );
    });
  });
  protected readonly formBehaviorGroups = computed(() => {
    const airportId = this.formAirportId();
    const current = this.editingDevice()?.behavior_group_id;
    return this.behaviorGroups().filter(
      (group) =>
        (group.is_active || group.id === current) &&
        (!group.airport_id || group.airport_id === airportId),
    );
  });
  protected readonly formVideoWalls = computed(() => {
    const airportId = this.formAirportId();
    const current = this.editingDevice()?.video_wall_id;
    return this.videoWalls().filter(
      (wall) => wall.airport_id === airportId && (wall.is_active || wall.id === current),
    );
  });

  ngOnInit(): void {
    this.catalog.loadGroups(Devices.CatalogNames).subscribe({
      next: (groups) => this.groups.set(groups),
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      devices: this.deviceService.getAll(),
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
      sectors: this.sectorService.getAll(),
      resources: this.resourceService.getAll(),
      behaviorGroups: this.behaviorGroupService.getAll(),
      videoWalls: this.videoWallService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({
          devices,
          airports,
          terminals,
          sectors,
          resources,
          behaviorGroups,
          videoWalls,
        }) => {
          this.devices.set(devices ?? []);
          this.airports.set(airports ?? []);
          this.terminals.set(terminals ?? []);
          this.sectors.set(sectors ?? []);
          this.resources.set(resources ?? []);
          this.behaviorGroups.set(behaviorGroups ?? []);
          this.videoWalls.set(videoWalls ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected featureText(feature: Feature): string {
    return feature.description || feature.abbreviation || String(feature.id);
  }

  protected featureLabel(id: number | null): string {
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

  protected resourceLabel(resource: AirportResource): string {
    return resource.name ? `${resource.code} · ${resource.name}` : resource.code;
  }

  protected groupLabel(id: string | null): string {
    if (!id) return 'Sin grupo';
    const group = this.behaviorGroups().find((item) => item.id === id);
    return group ? `${group.code} · ${group.name}` : id;
  }

  protected videoWallLabel(wall: VideoWall): string {
    return `${wall.code} · ${wall.name} (${wall.grid_rows}x${wall.grid_columns})`;
  }

  protected deviceTitle(device: Device): string {
    return device.name ? `${device.code} · ${device.name}` : device.code;
  }

  protected locationLabel(device: Device): string {
    const parts = [
      device.terminal_id ? this.terminalLabel(device.terminal_id) : null,
      device.airport_sector_id ? this.sectorLabel(device.airport_sector_id) : null,
    ].filter((part): part is string => !!part);
    return parts.length ? parts.join(' · ') : '—';
  }

  protected statusClass(statusId: number): string {
    const abbreviation = (this.featureIndex().get(statusId)?.abbreviation ?? '')
      .trim()
      .toLocaleUpperCase();
    switch (abbreviation) {
      case 'ONLINE':
        return '';
      case 'OFFLINE':
        return 'device__badge--offline';
      case 'ERROR':
        return 'device__badge--error';
      default:
        return 'catalog__badge--off';
    }
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingDevice.set(null);
    this.resetForm();
    this.form.controls.airport_id.setValue(this.selectedAirportId());
    this.form.controls.status_id.setValue(
      this.catalog.findByAbbreviation(this.groups(), Devices.StatusGroup, 'PENDING')?.id ?? null,
    );
    this.mode.set('create');
  }

  protected startEdit(device: Device): void {
    if (!device.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(device.id);
    this.editingDevice.set(device);
    this.updatePositionLimit(device.video_wall_id);
    this.form.reset({
      code: device.code ?? '',
      name: device.name ?? '',
      serial_number: device.serial_number ?? '',
      manufacturer: device.manufacturer ?? '',
      model: device.model ?? '',
      airport_id: device.airport_id,
      airport_sector_id: device.airport_sector_id,
      terminal_id: device.terminal_id,
      airport_resource_id: device.airport_resource_id,
      location_description: device.location_description ?? '',
      ip_address: device.ip_address ?? '',
      mac_address: device.mac_address ?? '',
      hostname: device.hostname ?? '',
      display_type_id: device.display_type_id,
      orientation_id: device.orientation_id,
      resolution_id: device.resolution_id,
      behavior_group_id: device.behavior_group_id,
      video_wall_id: device.video_wall_id,
      video_wall_position: device.video_wall_position,
      status_id: device.status_id,
      ssh_port: device.ssh_port,
      vnc_port: device.vnc_port,
      remote_credential_ref: device.remote_credential_ref ?? '',
      is_active: device.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.editingDevice.set(null);
    this.resetForm();
  }

  protected onFormAirportChange(): void {
    // Terminal, sector, recurso, videowall y grupo propio dependen del aeropuerto elegido.
    const groupId = this.form.controls.behavior_group_id.value;
    const group = this.behaviorGroups().find((item) => item.id === groupId);
    this.form.patchValue({
      terminal_id: null,
      airport_sector_id: null,
      airport_resource_id: null,
      video_wall_id: null,
      video_wall_position: null,
      behavior_group_id: group?.airport_id ? null : groupId,
    });
    this.updatePositionLimit(null);
  }

  protected onFormTerminalChange(): void {
    this.form.patchValue({ airport_sector_id: null, airport_resource_id: null });
  }

  protected onVideoWallChange(): void {
    this.updatePositionLimit(this.form.controls.video_wall_id.value);
    if (!this.form.controls.video_wall_id.value) {
      this.form.controls.video_wall_position.setValue(null);
    }
    this.form.controls.video_wall_position.updateValueAndValidity();
  }

  protected positionHint(): string {
    return this.formVideoWallId()
      ? `Posición dentro de la videowall (1 a ${this.positionLimit}).`
      : 'Se habilita al elegir una videowall.';
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const current = this.editingDevice();
    const isCreate = this.mode() === 'create';
    const payload: Device = {
      // Campos reportados por el equipo: se conservan del registro cargado.
      is_offline_mode: current?.is_offline_mode ?? false,
      last_heartbeat_at: current?.last_heartbeat_at ?? null,
      last_status_change_at: current?.last_status_change_at ?? null,
      last_ntp_sync_at: current?.last_ntp_sync_at ?? null,
      clock_offset_ms: current?.clock_offset_ms ?? null,
      consecutive_errors: current?.consecutive_errors ?? 0,
      software_version: current?.software_version ?? null,
      config_version: current?.config_version ?? null,
      os_version: current?.os_version ?? null,
      created_at: current?.created_at ?? null,
      updated_at: current?.updated_at ?? null,
      created_by: current?.created_by ?? null,
      modified_by: current?.modified_by ?? null,
      id: isCreate ? null : this.editingId(),
      airport_id: raw.airport_id as string,
      terminal_id: raw.terminal_id,
      airport_sector_id: raw.airport_sector_id,
      airport_resource_id: raw.airport_resource_id,
      code: raw.code.trim(),
      name: raw.name.trim() || null,
      location_description: raw.location_description.trim() || null,
      ip_address: raw.ip_address.trim() || null,
      mac_address: raw.mac_address.trim() || null,
      hostname: raw.hostname.trim() || null,
      display_type_id: raw.display_type_id as number,
      orientation_id: raw.orientation_id as number,
      resolution_id: raw.resolution_id as number,
      behavior_group_id: raw.behavior_group_id,
      video_wall_id: raw.video_wall_id,
      video_wall_position: raw.video_wall_id ? raw.video_wall_position : null,
      status_id: raw.status_id as number,
      serial_number: raw.serial_number.trim() || null,
      manufacturer: raw.manufacturer.trim() || null,
      model: raw.model.trim() || null,
      ssh_port: raw.ssh_port,
      vnc_port: raw.vnc_port,
      remote_credential_ref: raw.remote_credential_ref.trim() || null,
      is_active: raw.is_active,
    };
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.deviceService.add(payload)
      : this.deviceService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingDevice.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Dispositivo creado correctamente.' : 'Dispositivo actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(device: Device): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(device);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.deviceService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Dispositivo desactivado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private updatePositionLimit(videoWallId: string | null): void {
    const wall = this.videoWalls().find((item) => item.id === videoWallId);
    const cells = wall ? wall.grid_rows * wall.grid_columns : 0;
    this.positionLimit = cells > 0 ? cells : 6;
  }

  private resetForm(): void {
    this.positionLimit = 6;
    this.form.reset({
      code: '',
      name: '',
      serial_number: '',
      manufacturer: '',
      model: '',
      airport_id: null,
      airport_sector_id: null,
      terminal_id: null,
      airport_resource_id: null,
      location_description: '',
      ip_address: '',
      mac_address: '',
      hostname: '',
      display_type_id: null,
      orientation_id: null,
      resolution_id: null,
      behavior_group_id: null,
      video_wall_id: null,
      video_wall_position: null,
      status_id: null,
      ssh_port: null,
      vnc_port: null,
      remote_credential_ref: '',
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
