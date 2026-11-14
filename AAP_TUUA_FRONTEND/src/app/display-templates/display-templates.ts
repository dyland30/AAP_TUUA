import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Airport, DisplayTemplate, DisplayTemplateVersion, FeatureGroup } from '../models';
import {
  AirportService,
  DisplayTemplateService,
  DisplayTemplateVersionService,
  FeatureCatalogService,
} from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

const DISPLAY_TYPE_GROUP = 'tipos pantalla';
const ORIENTATION_GROUP = 'orientacion pantalla';
const RESOLUTION_GROUP = 'resoluciones pantalla';

@Component({
  selector: 'app-display-templates',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './display-templates.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class DisplayTemplates implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly templateService = inject(DisplayTemplateService);
  private readonly versionService = inject(DisplayTemplateVersionService);
  private readonly airportService = inject(AirportService);
  private readonly catalogs = inject(FeatureCatalogService);

  protected readonly templates = signal<DisplayTemplate[]>([]);
  protected readonly versions = signal<DisplayTemplateVersion[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedTypeId = signal<number | null>(null);
  protected readonly search = signal('');
  protected readonly displayTypes = computed(() =>
    this.catalogs.featuresOf(this.groups(), DISPLAY_TYPE_GROUP),
  );
  protected readonly orientations = computed(() =>
    this.catalogs.featuresOf(this.groups(), ORIENTATION_GROUP),
  );
  protected readonly resolutions = computed(() =>
    this.catalogs.featuresOf(this.groups(), RESOLUTION_GROUP),
  );
  protected readonly filteredTemplates = computed(() => {
    const airportId = this.selectedAirportId();
    const typeId = this.selectedTypeId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.templates().filter(
      (item) =>
        (!airportId || item.airport_id === airportId) &&
        (typeId === null || item.display_type_id === typeId) &&
        (!query ||
          [item.code, item.name, item.description].some((value) =>
            value?.toLocaleLowerCase().includes(query),
          )),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<DisplayTemplate | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null),
    code: ['', [Validators.required, notBlank, Validators.maxLength(50)]],
    name: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    display_type_id: this.fb.control<number | null>(null, Validators.required),
    orientation_id: this.fb.control<number | null>(null, Validators.required),
    resolution_id: this.fb.control<number | null>(null, Validators.required),
    flight_slots: this.fb.control<number | null>(null, [
      Validators.min(1),
      Validators.max(99),
      Validators.pattern(/^\d+$/),
    ]),
    is_virtual_keypad: [false],
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      templates: this.templateService.getAll(),
      versions: this.versionService.getAll(),
      airports: this.airportService.getAll(),
      groups: this.catalogs.loadGroups([DISPLAY_TYPE_GROUP, ORIENTATION_GROUP, RESOLUTION_GROUP]),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ templates, versions, airports, groups }) => {
          this.templates.set(templates ?? []);
          this.versions.set(versions ?? []);
          this.airports.set(airports ?? []);
          this.groups.set(groups ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected airportLabel(id: string | null): string {
    if (!id) return 'Global';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected featureLabel(id: number | null): string {
    return this.catalogs.label(this.groups(), id);
  }

  protected optionLabel(feature: {
    description: string | null;
    abbreviation: string | null;
  }): string {
    return feature.description || feature.abbreviation || '—';
  }

  protected currentVersionLabel(template: DisplayTemplate): string {
    if (!template.current_version_id) return '—';
    const version = this.versions().find((item) => item.id === template.current_version_id);
    return version ? `v${version.version_number}` : '—';
  }

  protected viewVersions(template: DisplayTemplate): void {
    if (!template.id) return;
    this.router.navigate(['/display_templates', template.id, 'versions']);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    this.form.controls.airport_id.setValue(this.selectedAirportId());
    this.form.controls.display_type_id.setValue(this.selectedTypeId());
    this.mode.set('create');
  }

  protected startEdit(template: DisplayTemplate): void {
    if (!template.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(template.id);
    this.form.reset({
      airport_id: template.airport_id,
      code: template.code ?? '',
      name: template.name ?? '',
      description: template.description ?? '',
      display_type_id: template.display_type_id,
      orientation_id: template.orientation_id,
      resolution_id: template.resolution_id,
      flight_slots: template.flight_slots,
      is_virtual_keypad: template.is_virtual_keypad,
      is_active: template.is_active,
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
    const code = raw.code.trim();
    const editingId = this.editingId();
    if (
      raw.airport_id &&
      this.templates().some(
        (item) => item.id !== editingId && item.airport_id === raw.airport_id && item.code === code,
      )
    ) {
      this.errorMessage.set('Ya existe una plantilla con ese código en el aeropuerto elegido.');
      return;
    }

    const isCreate = this.mode() === 'create';
    const current = isCreate ? null : this.templates().find((item) => item.id === editingId);
    if (!isCreate && !current) {
      this.errorMessage.set('No se encontró la plantilla a actualizar. Actualiza la lista.');
      return;
    }

    const payload: DisplayTemplate = {
      ...(current ?? {
        current_version_id: null,
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      }),
      id: editingId,
      airport_id: raw.airport_id,
      code,
      name: raw.name.trim(),
      description: raw.description.trim() || null,
      display_type_id: raw.display_type_id as number,
      orientation_id: raw.orientation_id as number,
      resolution_id: raw.resolution_id as number,
      flight_slots: raw.flight_slots,
      is_virtual_keypad: raw.is_virtual_keypad,
      is_active: raw.is_active,
    };
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.templateService.add(payload)
      : this.templateService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Plantilla creada correctamente.' : 'Plantilla actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(template: DisplayTemplate): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(template);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.templateService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Plantilla desactivada correctamente.');
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
      code: '',
      name: '',
      description: '',
      display_type_id: null,
      orientation_id: null,
      resolution_id: null,
      flight_slots: null,
      is_virtual_keypad: false,
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
