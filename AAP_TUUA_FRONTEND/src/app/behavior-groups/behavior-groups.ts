import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Airport, BehaviorGroup, Feature, FeatureGroup } from '../models';
import { AirportService, BehaviorGroupService, FeatureCatalogService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

function integer(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined) return null;
  return Number.isInteger(value) ? null : { integer: true };
}

@Component({
  selector: 'app-behavior-groups',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './behavior-groups.html',
  styleUrls: ['../catalogs/catalog-crud.css'],
  styles: [
    `
      .catalog__badge.catalog__badge--emergency {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }

      .bg__flag {
        margin-left: 0.4rem;
      }
    `,
  ],
})
export class BehaviorGroups implements OnInit {
  private static readonly DisplayTypeGroup = 'tipos pantalla';
  private static readonly ContentTypeGroup = 'tipos contenido grupo';
  private static readonly DirectionGroup = 'Tipo Operación Vuelo';
  private static readonly FlightTypeGroup = 'Tipos de Vuelo';

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly groupService = inject(BehaviorGroupService);
  private readonly airportService = inject(AirportService);
  private readonly catalog = inject(FeatureCatalogService);

  protected readonly behaviorGroups = signal<BehaviorGroup[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);

  protected readonly displayTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroups.DisplayTypeGroup),
  );
  protected readonly contentTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroups.ContentTypeGroup),
  );
  protected readonly directions = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroups.DirectionGroup),
  );
  protected readonly flightTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroups.FlightTypeGroup),
  );

  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly filteredGroups = computed(() => {
    const airportId = this.selectedAirportId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.behaviorGroups()
      .filter(
        (group) =>
          (!airportId || !group.airport_id || group.airport_id === airportId) &&
          (!query ||
            [group.code, group.name, group.description].some((value) =>
              value?.toLocaleLowerCase().includes(query),
            )),
      )
      .sort(
        (a, b) =>
          Number(b.is_emergency) - Number(a.is_emergency) ||
          a.priority - b.priority ||
          a.name.localeCompare(b.name),
      );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingGroup = signal<BehaviorGroup | null>(null);
  protected readonly deleteTarget = signal<BehaviorGroup | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null),
    code: ['', [Validators.required, notBlank, Validators.maxLength(30)]],
    name: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    standard_number: this.fb.control<number | null>(null, [
      integer,
      Validators.min(1),
      Validators.max(12),
    ]),
    display_type_id: this.fb.control<number | null>(null),
    content_type_id: this.fb.control<number | null>(null, Validators.required),
    flight_direction_id: this.fb.control<number | null>(null),
    flight_type_id: this.fb.control<number | null>(null),
    priority: this.fb.control<number | null>(100, [
      Validators.required,
      integer,
      Validators.min(0),
      Validators.max(32767),
    ]),
    is_emergency: [false],
    page_duration_seconds: this.fb.control<number | null>(null, [
      integer,
      Validators.min(1),
      Validators.max(32767),
    ]),
    rows_per_page: this.fb.control<number | null>(null, [
      integer,
      Validators.min(1),
      Validators.max(32767),
    ]),
    alternate_interval_seconds: this.fb.control<number | null>(null, [
      integer,
      Validators.min(1),
      Validators.max(32767),
    ]),
    max_flights: this.fb.control<number | null>(null, [
      integer,
      Validators.min(1),
      Validators.max(32767),
    ]),
    is_active: [true],
  });

  ngOnInit(): void {
    this.catalog
      .loadGroups([
        BehaviorGroups.DisplayTypeGroup,
        BehaviorGroups.ContentTypeGroup,
        BehaviorGroups.DirectionGroup,
        BehaviorGroups.FlightTypeGroup,
      ])
      .subscribe({
        next: (groups) => this.groups.set(groups),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      behaviorGroups: this.groupService.getAll(),
      airports: this.airportService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ behaviorGroups, airports }) => {
          this.behaviorGroups.set(behaviorGroups ?? []);
          this.airports.set(airports ?? []);
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
    if (!id) return 'Global';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected settingsLabel(group: BehaviorGroup): string {
    const parts: string[] = [];
    if (group.page_duration_seconds !== null) parts.push(`Página ${group.page_duration_seconds} s`);
    if (group.rows_per_page !== null) parts.push(`${group.rows_per_page} filas`);
    if (group.alternate_interval_seconds !== null) {
      parts.push(`Alterna cada ${group.alternate_interval_seconds} s`);
    }
    if (group.max_flights !== null) parts.push(`Máx. ${group.max_flights} vuelos`);
    return parts.length ? parts.join(' · ') : '—';
  }

  protected viewRules(group: BehaviorGroup): void {
    if (!group.id) return;
    this.router.navigate(['/behavior_groups', group.id, 'rules']);
  }

  protected viewTemplates(group: BehaviorGroup): void {
    if (!group.id) return;
    this.router.navigate(['/behavior_groups', group.id, 'templates']);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingGroup.set(null);
    this.resetForm();
    this.form.controls.airport_id.setValue(this.selectedAirportId());
    this.mode.set('create');
  }

  protected startEdit(group: BehaviorGroup): void {
    if (!group.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(group.id);
    this.editingGroup.set(group);
    this.form.reset({
      airport_id: group.airport_id,
      code: group.code ?? '',
      name: group.name ?? '',
      description: group.description ?? '',
      standard_number: group.standard_number,
      display_type_id: group.display_type_id,
      content_type_id: group.content_type_id,
      flight_direction_id: group.flight_direction_id,
      flight_type_id: group.flight_type_id,
      priority: group.priority,
      is_emergency: group.is_emergency,
      page_duration_seconds: group.page_duration_seconds,
      rows_per_page: group.rows_per_page,
      alternate_interval_seconds: group.alternate_interval_seconds,
      max_flights: group.max_flights,
      is_active: group.is_active,
    });
    // El número estándar de un grupo de fábrica no se modifica.
    if (group.is_standard) this.form.controls.standard_number.disable();
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.editingGroup.set(null);
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
    const current = this.editingGroup();
    const isCreate = this.mode() === 'create';
    const payload: BehaviorGroup = {
      id: isCreate ? null : this.editingId(),
      airport_id: raw.airport_id,
      code: raw.code.trim(),
      name: raw.name.trim(),
      description: raw.description.trim() || null,
      standard_number: raw.standard_number,
      is_standard: current?.is_standard ?? false,
      display_type_id: raw.display_type_id,
      content_type_id: raw.content_type_id as number,
      flight_direction_id: raw.flight_direction_id,
      flight_type_id: raw.flight_type_id,
      priority: raw.priority as number,
      is_emergency: raw.is_emergency,
      page_duration_seconds: raw.page_duration_seconds,
      rows_per_page: raw.rows_per_page,
      alternate_interval_seconds: raw.alternate_interval_seconds,
      max_flights: raw.max_flights,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    this.isSaving.set(true);
    const request$ = isCreate ? this.groupService.add(payload) : this.groupService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingGroup.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Grupo creado correctamente.' : 'Grupo actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(group: BehaviorGroup): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(group);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.groupService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Grupo desactivado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private resetForm(): void {
    this.form.controls.standard_number.enable();
    this.form.reset({
      airport_id: null,
      code: '',
      name: '',
      description: '',
      standard_number: null,
      display_type_id: null,
      content_type_id: null,
      flight_direction_id: null,
      flight_type_id: null,
      priority: 100,
      is_emergency: false,
      page_duration_seconds: null,
      rows_per_page: null,
      alternate_interval_seconds: null,
      max_flights: null,
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
