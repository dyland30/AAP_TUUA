import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Observable,
  catchError,
  concat,
  finalize,
  forkJoin,
  of,
  switchMap,
  throwError,
  toArray,
} from 'rxjs';
import {
  Airport,
  AirportSector,
  EmergencyAlert,
  EmergencyAlertSector,
  EvacuationRoute,
  FeatureGroup,
} from '../models';
import {
  AirportSectorService,
  AirportService,
  AuthenticationService,
  EmergencyAlertSectorService,
  EmergencyAlertService,
  EvacuationRouteService,
  FeatureCatalogService,
} from '../services';

type FormMode = 'list' | 'create' | 'edit';

const TYPE_GROUP = 'tipos alerta emergencia';
const ORIGIN_GROUP = 'origen alerta emergencia';
const COVERAGE_GROUP = 'cobertura alerta';
const STATUS_GROUP = 'estados alerta emergencia';

@Component({
  selector: 'app-emergency-alerts',
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
  templateUrl: './emergency-alerts.html',
  styleUrl: '../catalogs/catalog-crud.css',
  styles: [
    `
      .catalog__table .catalog__badge.alert-badge--active {
        background: var(--mat-sys-error);
        color: var(--mat-sys-on-error);
      }

      .catalog__table .catalog__badge.alert-badge--active::before {
        animation: alert-pulse 1.2s ease-in-out infinite;
      }

      @keyframes alert-pulse {
        50% {
          opacity: 0.25;
        }
      }

      .alert-detail td {
        background: var(--mat-sys-surface-container-low);
      }

      .alert-detail__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.5rem 1.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
      }

      .alert-detail__label {
        display: block;
        font-size: 0.75rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .alert-sectors {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin: 0 0 1rem;
      }

      .alert-sector {
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        padding: 0.4rem 0.9rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .alert-sector--selected {
        border-color: var(--mat-sys-primary);
      }

      .alert-sector mat-form-field {
        margin-left: auto;
        min-width: 260px;
      }
    `,
  ],
})
export class EmergencyAlerts implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly alertService = inject(EmergencyAlertService);
  private readonly alertSectorService = inject(EmergencyAlertSectorService);
  private readonly airportService = inject(AirportService);
  private readonly sectorService = inject(AirportSectorService);
  private readonly routeService = inject(EvacuationRouteService);
  private readonly catalog = inject(FeatureCatalogService);
  private readonly authService = inject(AuthenticationService);

  protected readonly alerts = signal<EmergencyAlert[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly activeAirports = computed(() =>
    this.airports().filter((airport) => airport.is_active),
  );
  protected readonly sectors = signal<AirportSector[]>([]);
  protected readonly routes = signal<EvacuationRoute[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);

  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedStatusId = signal<number | null>(null);
  protected readonly search = signal('');

  protected readonly typeOptions = computed(() =>
    this.catalog.featuresOf(this.groups(), TYPE_GROUP),
  );
  protected readonly coverageOptions = computed(() =>
    this.catalog.featuresOf(this.groups(), COVERAGE_GROUP),
  );
  protected readonly statusOptions = computed(() =>
    this.catalog.featuresOf(this.groups(), STATUS_GROUP),
  );
  private readonly manualOriginId = computed(
    () => this.catalog.findByAbbreviation(this.groups(), ORIGIN_GROUP, 'MANUAL')?.id ?? null,
  );
  protected readonly activeStatusId = computed(
    () => this.catalog.findByAbbreviation(this.groups(), STATUS_GROUP, 'ACTIVE')?.id ?? null,
  );
  private readonly endedStatusId = computed(
    () => this.catalog.findByAbbreviation(this.groups(), STATUS_GROUP, 'ENDED')?.id ?? null,
  );
  private readonly sectorCoverageId = computed(
    () => this.catalog.findByAbbreviation(this.groups(), COVERAGE_GROUP, 'SECTOR')?.id ?? null,
  );

  protected readonly filteredAlerts = computed(() => {
    const airportId = this.selectedAirportId();
    const statusId = this.selectedStatusId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.alerts().filter(
      (alert) =>
        (!airportId || alert.airport_id === airportId) &&
        (statusId === null || alert.status_id === statusId) &&
        (!query ||
          [alert.observation, alert.custom_message_es, alert.custom_message_en].some((value) =>
            value?.toLocaleLowerCase().includes(query),
          )),
    );
  });

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingAlert = signal<EmergencyAlert | null>(null);
  protected readonly deleteTarget = signal<EmergencyAlert | null>(null);
  protected readonly finishTarget = signal<EmergencyAlert | null>(null);
  protected readonly confirmActivation = signal(false);

  // Detalle expandible: sectores de la alerta, cargados bajo demanda.
  protected readonly expandedId = signal<string | null>(null);
  protected readonly loadingDetailId = signal<string | null>(null);
  protected readonly alertSectors = signal<Record<string, EmergencyAlertSector[]>>({});

  // Sectores elegidos en el formulario (id de sector -> id de ruta de evacuación o null).
  protected readonly sectorSelection = signal<ReadonlyMap<string, string | null>>(new Map());

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null, Validators.required),
    alert_type_id: this.fb.control<number | null>(null, Validators.required),
    coverage_id: this.fb.control<number | null>(null, Validators.required),
    custom_message_es: ['', [Validators.maxLength(1000)]],
    custom_message_en: ['', [Validators.maxLength(1000)]],
    observation: ['', [Validators.maxLength(1000)]],
  });

  private readonly formAirportId = toSignal(this.form.controls.airport_id.valueChanges, {
    initialValue: this.form.controls.airport_id.value,
  });
  private readonly formCoverageId = toSignal(this.form.controls.coverage_id.valueChanges, {
    initialValue: this.form.controls.coverage_id.value,
  });
  protected readonly isSectorCoverage = computed(() => {
    const sectorCoverageId = this.sectorCoverageId();
    return sectorCoverageId !== null && this.formCoverageId() === sectorCoverageId;
  });
  protected readonly formSectors = computed(() =>
    this.sectors().filter(
      (sector) => sector.airport_id === this.formAirportId() && sector.is_active,
    ),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      alerts: this.alertService.getAll(),
      airports: this.airportService.getAll(),
      sectors: this.sectorService.getAll(),
      routes: this.routeService.getAll(),
      groups: this.catalog.loadGroups([TYPE_GROUP, ORIGIN_GROUP, COVERAGE_GROUP, STATUS_GROUP]),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ alerts, airports, sectors, routes, groups }) => {
          this.alerts.set(alerts ?? []);
          this.airports.set(airports ?? []);
          this.sectors.set(sectors ?? []);
          this.routes.set(routes ?? []);
          this.groups.set(groups ?? []);
          this.alertSectors.set({});
          this.expandedId.set(null);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected airportLabel(id: string | null): string {
    if (!id) return '—';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected featureLabel(id: number | null): string {
    return this.catalog.label(this.groups(), id);
  }

  protected sectorLabel(id: string | null): string {
    if (!id) return '—';
    const sector = this.sectors().find((item) => item.id === id);
    return sector ? `${sector.code} · ${sector.name}` : id;
  }

  protected routeLabel(id: string | null): string {
    if (!id) return 'Sin ruta de evacuación';
    const route = this.routes().find((item) => item.id === id);
    return route ? `${route.name_es} (${route.code})` : id;
  }

  protected routesOf(sectorId: string | null): EvacuationRoute[] {
    if (!sectorId) return [];
    return this.routes().filter((route) => route.airport_sector_id === sectorId && route.is_active);
  }

  protected isActive(alert: EmergencyAlert): boolean {
    const activeId = this.activeStatusId();
    return activeId !== null && alert.status_id === activeId;
  }

  protected statusBadgeClass(alert: EmergencyAlert): string {
    if (this.isActive(alert)) return 'alert-badge--active';
    const feature = this.catalog
      .featuresOf(this.groups(), STATUS_GROUP)
      .find((item) => item.id === alert.status_id);
    const abbreviation = (feature?.abbreviation ?? '').trim().toLocaleUpperCase();
    return abbreviation === 'ENDED' || abbreviation === 'CANCELLED' ? 'catalog__badge--off' : '';
  }

  // ---------- Detalle (sectores de la alerta) ----------

  protected toggleDetail(alert: EmergencyAlert): void {
    const id = alert.id;
    if (!id) return;
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(id);
    if (this.alertSectors()[id]) return;

    this.loadingDetailId.set(id);
    this.alertSectorService
      .getByEmergencyAlertId(id)
      .pipe(finalize(() => this.loadingDetailId.set(null)))
      .subscribe({
        next: (items) => this.alertSectors.update((cache) => ({ ...cache, [id]: items ?? [] })),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  // ---------- Alta (activar alerta) ----------

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.clearTargets();
    this.editingAlert.set(null);
    this.resetForm();
    this.form.controls.airport_id.setValue(this.selectedAirportId());
    this.mode.set('create');
  }

  protected onFormAirportChange(): void {
    // Los sectores elegidos dependen del aeropuerto.
    this.sectorSelection.set(new Map());
    this.confirmActivation.set(false);
  }

  protected isSectorSelected(sectorId: string | null): boolean {
    return sectorId !== null && this.sectorSelection().has(sectorId);
  }

  protected selectedRoute(sectorId: string | null): string | null {
    return sectorId ? (this.sectorSelection().get(sectorId) ?? null) : null;
  }

  protected toggleSector(sector: AirportSector): void {
    if (!sector.id) return;
    this.confirmActivation.set(false);
    const next = new Map(this.sectorSelection());
    if (next.has(sector.id)) {
      next.delete(sector.id);
    } else {
      // Se sugiere la ruta predeterminada del sector (editable).
      next.set(sector.id, this.routesOf(sector.id).find((route) => route.is_default)?.id ?? null);
    }
    this.sectorSelection.set(next);
  }

  protected setSectorRoute(sectorId: string | null, routeId: string | null): void {
    if (!sectorId || !this.sectorSelection().has(sectorId)) return;
    const next = new Map(this.sectorSelection());
    next.set(sectorId, routeId);
    this.sectorSelection.set(next);
  }

  // ---------- Edición (solo mensajes y observación) ----------

  protected startEdit(alert: EmergencyAlert): void {
    if (!alert.id || this.isSaving()) return;
    this.clearMessages();
    this.clearTargets();
    this.editingAlert.set(alert);
    this.form.reset({
      airport_id: alert.airport_id,
      alert_type_id: alert.alert_type_id,
      coverage_id: alert.coverage_id,
      custom_message_es: alert.custom_message_es ?? '',
      custom_message_en: alert.custom_message_en ?? '',
      observation: alert.observation ?? '',
    });
    this.sectorSelection.set(new Map());
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingAlert.set(null);
    this.confirmActivation.set(false);
    this.resetForm();
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.mode() === 'edit') {
      this.saveEdit();
      return;
    }

    if (this.manualOriginId() === null || this.activeStatusId() === null) {
      this.errorMessage.set(
        'No se puede activar la alerta: faltan valores en los catálogos "Origen alerta emergencia" (MANUAL) o "Estados alerta emergencia" (ACTIVE). Regístralos en Características.',
      );
      return;
    }
    if (this.isSectorCoverage() && this.sectorSelection().size === 0) {
      this.errorMessage.set(
        'Selecciona al menos un sector para una alerta con cobertura por sector.',
      );
      return;
    }
    // Paso crítico: se pide confirmación explícita antes de enviar.
    this.confirmActivation.set(true);
  }

  protected cancelActivation(): void {
    if (!this.isSaving()) this.confirmActivation.set(false);
  }

  protected confirmActivate(): void {
    if (this.isSaving() || this.mode() !== 'create') return;
    this.clearMessages();
    const originId = this.manualOriginId();
    const statusId = this.activeStatusId();
    if (this.form.invalid || originId === null || statusId === null) {
      this.confirmActivation.set(false);
      this.form.markAllAsTouched();
      if (originId === null || statusId === null) {
        this.errorMessage.set(
          'No se puede activar la alerta: faltan valores en los catálogos de origen (MANUAL) o estado (ACTIVE).',
        );
      }
      return;
    }

    const raw = this.form.getRawValue();
    const bySector = this.isSectorCoverage();
    const selection = [...this.sectorSelection().entries()];
    if (bySector && selection.length === 0) {
      this.confirmActivation.set(false);
      this.errorMessage.set(
        'Selecciona al menos un sector para una alerta con cobertura por sector.',
      );
      return;
    }

    const now = new Date().toISOString();
    const userId = this.currentUserId();
    const payload: EmergencyAlert = {
      id: null,
      airport_id: raw.airport_id as string,
      alert_type_id: raw.alert_type_id as number,
      origin_id: originId,
      coverage_id: raw.coverage_id as number,
      status_id: statusId,
      integration_message_id: null,
      custom_message_es: raw.custom_message_es.trim() || null,
      custom_message_en: raw.custom_message_en.trim() || null,
      requested_at: now,
      requested_by: userId,
      confirmed_at: now,
      confirmed_by: userId,
      started_at: now,
      ended_at: null,
      ended_by: null,
      deploy_duration_ms: null,
      restore_duration_ms: null,
      pa_triggered: false,
      observation: raw.observation.trim() || null,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };

    this.isSaving.set(true);
    this.alertService
      .add(payload)
      .pipe(
        switchMap((created) => {
          if (!bySector || !created.id) return of(created);
          const requests: Observable<unknown>[] = selection.map(([sectorId, routeId]) =>
            this.alertSectorService.add({
              id: null,
              emergency_alert_id: created.id as string,
              airport_sector_id: sectorId,
              evacuation_route_id: routeId,
              created_at: null,
              updated_at: null,
              created_by: null,
              modified_by: null,
            }),
          );
          return concat(...requests).pipe(
            toArray(),
            switchMap(() => of(created)),
            catchError((error: HttpErrorResponse) =>
              throwError(
                () =>
                  new SectorRegistrationError(
                    `La alerta se activó, pero no se pudieron registrar todos sus sectores: ${this.resolveError(error)}`,
                  ),
              ),
            ),
          );
        }),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.closeForm();
          this.successMessage.set('Alerta de emergencia activada correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse | SectorRegistrationError) => {
          this.confirmActivation.set(false);
          if (error instanceof SectorRegistrationError) {
            // La alerta ya existe: se vuelve al listado para revisarla.
            this.closeForm();
            this.load();
            this.errorMessage.set(error.message);
            return;
          }
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private saveEdit(): void {
    const current = this.editingAlert();
    if (!current?.id) return;
    const raw = this.form.getRawValue();
    const payload: EmergencyAlert = {
      ...current,
      custom_message_es: raw.custom_message_es.trim() || null,
      custom_message_en: raw.custom_message_en.trim() || null,
      observation: raw.observation.trim() || null,
    };
    this.isSaving.set(true);
    this.alertService
      .update(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.closeForm();
          this.successMessage.set('Alerta actualizada correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  // ---------- Finalizar alerta ----------

  protected askFinish(alert: EmergencyAlert): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.finishTarget.set(alert);
  }

  protected cancelFinish(): void {
    if (!this.isSaving()) this.finishTarget.set(null);
  }

  protected confirmFinish(): void {
    const target = this.finishTarget();
    if (!target?.id || this.isSaving()) return;
    const endedId = this.endedStatusId();
    if (endedId === null) {
      this.finishTarget.set(null);
      this.errorMessage.set(
        'No se puede finalizar la alerta: falta el valor ENDED en el catálogo "Estados alerta emergencia". Regístralo en Características.',
      );
      return;
    }

    // ended_at no puede ser anterior a started_at (validador y restricción de BD).
    const started = target.started_at ? new Date(target.started_at).getTime() : 0;
    const endedAt = new Date(
      Math.max(Date.now(), Number.isNaN(started) ? 0 : started),
    ).toISOString();
    const payload: EmergencyAlert = {
      ...target,
      status_id: endedId,
      ended_at: endedAt,
      ended_by: this.currentUserId() ?? target.ended_by,
    };

    this.isSaving.set(true);
    this.alertService
      .update(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.finishTarget.set(null);
          this.successMessage.set('Alerta finalizada correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.finishTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  // ---------- Eliminación (física) ----------

  protected askDelete(alert: EmergencyAlert): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.finishTarget.set(null);
    this.deleteTarget.set(alert);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.alertService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Alerta eliminada correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private closeForm(): void {
    this.mode.set('list');
    this.editingAlert.set(null);
    this.confirmActivation.set(false);
    this.resetForm();
  }

  private resetForm(): void {
    this.form.reset({
      airport_id: null,
      alert_type_id: null,
      coverage_id: null,
      custom_message_es: '',
      custom_message_en: '',
      observation: '',
    });
    this.sectorSelection.set(new Map());
  }

  private currentUserId(): string | null {
    const userId = this.authService.getCurrentUser()?.user_id?.trim();
    return userId ? userId.slice(0, 50) : null;
  }

  private clearTargets(): void {
    this.deleteTarget.set(null);
    this.finishTarget.set(null);
    this.confirmActivation.set(false);
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

// Error interno: la alerta se creó pero falló el registro de alguno de sus sectores.
class SectorRegistrationError extends Error {}
