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
import { finalize, forkJoin } from 'rxjs';
import {
  Airport,
  DisplayTemplate,
  EmergencyMessageTemplate,
  Feature,
  FeatureGroup,
  MediaAsset,
} from '../models';
import {
  AirportService,
  DisplayTemplateService,
  EmergencyMessageTemplateService,
  FeatureCatalogService,
  MediaAssetService,
} from '../services';
import { jsonText } from '../validators/json-text.validator';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

const ALERT_TYPE_GROUP = 'tipos alerta emergencia';
const LANGUAGE_GROUP = 'idiomas';

@Component({
  selector: 'app-emergency-message-templates',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './emergency-message-templates.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class EmergencyMessageTemplates implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly templateService = inject(EmergencyMessageTemplateService);
  private readonly airportService = inject(AirportService);
  private readonly displayTemplateService = inject(DisplayTemplateService);
  private readonly mediaAssetService = inject(MediaAssetService);
  private readonly catalog = inject(FeatureCatalogService);

  protected readonly templates = signal<EmergencyMessageTemplate[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly displayTemplates = signal<DisplayTemplate[]>([]);
  protected readonly mediaAssets = signal<MediaAsset[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly alertTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), ALERT_TYPE_GROUP),
  );
  protected readonly languages = computed(() =>
    this.catalog.featuresOf(this.groups(), LANGUAGE_GROUP),
  );

  protected readonly selectedAlertTypeId = signal<number | null>(null);
  protected readonly selectedLanguageId = signal<number | null>(null);
  protected readonly search = signal('');
  protected readonly filteredTemplates = computed(() => {
    const alertTypeId = this.selectedAlertTypeId();
    const languageId = this.selectedLanguageId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.templates()
      .filter(
        (template) =>
          (alertTypeId === null || template.alert_type_id === alertTypeId) &&
          (languageId === null || template.language_id === languageId) &&
          (!query ||
            [template.title, template.subtitle].some((value) =>
              value?.toLocaleLowerCase().includes(query),
            )),
      )
      .sort(
        (a, b) =>
          this.featureLabel(a.alert_type_id).localeCompare(this.featureLabel(b.alert_type_id)) ||
          this.featureLabel(a.language_id).localeCompare(this.featureLabel(b.language_id)),
      );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<EmergencyMessageTemplate | null>(null);
  private editingRecord: EmergencyMessageTemplate | null = null;

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null),
    alert_type_id: this.fb.control<number | null>(null, Validators.required),
    language_id: this.fb.control<number | null>(null, Validators.required),
    title: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
    subtitle: ['', [Validators.maxLength(200)]],
    instructions: ['', [jsonText]],
    ticker_text: ['', [Validators.maxLength(1000)]],
    display_template_id: this.fb.control<string | null>(null),
    icon_media_asset_id: this.fb.control<string | null>(null),
    is_active: [true],
  });

  private readonly formAirportId = toSignal(this.form.controls.airport_id.valueChanges, {
    initialValue: this.form.controls.airport_id.value,
  });
  // Plantillas visuales y recursos multimedia globales o del aeropuerto elegido.
  protected readonly formDisplayTemplates = computed(() =>
    this.displayTemplates().filter(
      (template) =>
        template.is_active &&
        (template.airport_id === null || template.airport_id === this.formAirportId()),
    ),
  );
  protected readonly formMediaAssets = computed(() =>
    this.mediaAssets().filter(
      (asset) =>
        asset.is_active && (asset.airport_id === null || asset.airport_id === this.formAirportId()),
    ),
  );

  ngOnInit(): void {
    this.loadCatalogs();
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      templates: this.templateService.getAll(),
      airports: this.airportService.getAll(),
      displayTemplates: this.displayTemplateService.getAll(),
      mediaAssets: this.mediaAssetService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ templates, airports, displayTemplates, mediaAssets }) => {
          this.templates.set(templates ?? []);
          this.airports.set(airports ?? []);
          this.displayTemplates.set(displayTemplates ?? []);
          this.mediaAssets.set(mediaAssets ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalogs(): void {
    this.catalog.loadGroups([ALERT_TYPE_GROUP, LANGUAGE_GROUP]).subscribe({
      next: (groups) => this.groups.set(groups),
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
    if (!id) return 'Global (todos)';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected displayTemplateLabel(id: string | null): string {
    if (!id) return '—';
    const template = this.displayTemplates().find((item) => item.id === id);
    return template ? `${template.code} · ${template.name}` : id;
  }

  protected mediaAssetLabel(id: string | null): string {
    if (!id) return '—';
    return this.mediaAssets().find((item) => item.id === id)?.name || id;
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingRecord = null;
    this.resetForm();
    this.form.patchValue({
      alert_type_id: this.selectedAlertTypeId(),
      language_id: this.selectedLanguageId(),
    });
    this.mode.set('create');
  }

  protected startEdit(template: EmergencyMessageTemplate): void {
    if (!template.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(template.id);
    this.editingRecord = template;
    this.form.reset({
      airport_id: template.airport_id,
      alert_type_id: template.alert_type_id,
      language_id: template.language_id,
      title: template.title ?? '',
      subtitle: template.subtitle ?? '',
      instructions: template.instructions ?? '',
      ticker_text: template.ticker_text ?? '',
      display_template_id: template.display_template_id,
      icon_media_asset_id: template.icon_media_asset_id,
      is_active: template.is_active,
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
    // Plantilla visual e ícono dependen del aeropuerto elegido (o son globales).
    this.form.patchValue({ display_template_id: null, icon_media_asset_id: null });
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
    const payload: EmergencyMessageTemplate = {
      ...current,
      id: isCreate ? null : this.editingId(),
      airport_id: raw.airport_id,
      alert_type_id: raw.alert_type_id as number,
      language_id: raw.language_id as number,
      title: raw.title.trim(),
      subtitle: raw.subtitle.trim() || null,
      instructions: raw.instructions.trim() || null,
      ticker_text: raw.ticker_text.trim() || null,
      display_template_id: raw.display_template_id,
      icon_media_asset_id: raw.icon_media_asset_id,
      is_active: isCreate ? true : raw.is_active,
      created_at: current?.created_at ?? null,
      updated_at: current?.updated_at ?? null,
      created_by: current?.created_by ?? null,
      modified_by: current?.modified_by ?? null,
    };
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.templateService.add(payload)
      : this.templateService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingRecord = null;
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Mensaje creado correctamente.' : 'Mensaje actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(template: EmergencyMessageTemplate): void {
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
          this.successMessage.set('Mensaje desactivado correctamente.');
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
      alert_type_id: null,
      language_id: null,
      title: '',
      subtitle: '',
      instructions: '',
      ticker_text: '',
      display_template_id: null,
      icon_media_asset_id: null,
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
