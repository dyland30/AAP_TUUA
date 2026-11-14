import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  DisplayTemplate,
  DisplayTemplateField,
  DisplayTemplateVersion,
  FeatureGroup,
} from '../models';
import {
  DisplayTemplateFieldService,
  DisplayTemplateService,
  DisplayTemplateVersionService,
  FeatureCatalogService,
} from '../services';
import { jsonText } from '../validators/json-text.validator';

type FormMode = 'list' | 'create' | 'edit';

const TEMPLATE_FIELD_GROUP = 'campos plantilla';
// numeric(7,2) en base de datos.
const MAX_COORDINATE = 99999.99;
const MAX_SMALLINT = 32767;

@Component({
  selector: 'app-display-template-fields',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './display-template-fields.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class DisplayTemplateFields implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fieldService = inject(DisplayTemplateFieldService);
  private readonly versionService = inject(DisplayTemplateVersionService);
  private readonly templateService = inject(DisplayTemplateService);
  private readonly catalogs = inject(FeatureCatalogService);

  protected readonly templateId = this.route.snapshot.paramMap.get('templateId') ?? '';
  protected readonly versionId = this.route.snapshot.paramMap.get('versionId') ?? '';
  protected readonly fields = signal<DisplayTemplateField[]>([]);
  protected readonly version = signal<DisplayTemplateVersion | null>(null);
  protected readonly template = signal<DisplayTemplate | null>(null);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly search = signal('');
  protected readonly fieldOptions = computed(() =>
    this.catalogs.featuresOf(this.groups(), TEMPLATE_FIELD_GROUP),
  );
  protected readonly filteredFields = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.fields()
      .filter(
        (item) =>
          !query ||
          [this.fieldLabel(item.field_id), item.format_mask].some((value) =>
            value?.toLocaleLowerCase().includes(query),
          ),
      )
      .sort((a, b) => a.sort_order - b.sort_order || a.z_index - b.z_index);
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<DisplayTemplateField | null>(null);

  protected readonly alignOptions = [
    { value: 'left', label: 'Izquierda' },
    { value: 'center', label: 'Centro' },
    { value: 'right', label: 'Derecha' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    field_id: this.fb.control<number | null>(null, Validators.required),
    pos_x: this.fb.control<number | null>(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_COORDINATE),
    ]),
    pos_y: this.fb.control<number | null>(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_COORDINATE),
    ]),
    width: this.fb.control<number | null>(10, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(MAX_COORDINATE),
    ]),
    height: this.fb.control<number | null>(10, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(MAX_COORDINATE),
    ]),
    z_index: this.fb.control<number | null>(0, [
      Validators.required,
      Validators.min(-MAX_SMALLINT),
      Validators.max(MAX_SMALLINT),
      Validators.pattern(/^-?\d+$/),
    ]),
    font_size: this.fb.control<number | null>(null, [
      Validators.min(1),
      Validators.max(MAX_SMALLINT),
      Validators.pattern(/^\d+$/),
    ]),
    text_align: this.fb.control<string | null>(null),
    format_mask: ['', [Validators.maxLength(50)]],
    is_bilingual: [true],
    is_visible: [true],
    sort_order: this.fb.control<number | null>(0, [
      Validators.required,
      Validators.min(-MAX_SMALLINT),
      Validators.max(MAX_SMALLINT),
      Validators.pattern(/^-?\d+$/),
    ]),
    properties: this.fb.nonNullable.control('', [jsonText]),
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      fields: this.fieldService.getByDisplayTemplateVersionId(this.versionId),
      version: this.versionService.getById(this.versionId),
      template: this.templateService.getById(this.templateId),
      groups: this.catalogs.loadGroups([TEMPLATE_FIELD_GROUP]),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ fields, version, template, groups }) => {
          // Filtro defensivo: solo campos de la versión indicada.
          this.fields.set(
            (fields ?? []).filter((item) => item.display_template_version_id === this.versionId),
          );
          this.version.set(version);
          this.template.set(template);
          this.groups.set(groups ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected fieldLabel(id: number | null): string {
    return this.catalogs.label(this.groups(), id);
  }

  protected optionLabel(feature: {
    description: string | null;
    abbreviation: string | null;
  }): string {
    return feature.description || feature.abbreviation || '—';
  }

  protected alignLabel(value: string | null): string {
    return this.alignOptions.find((item) => item.value === value)?.label ?? '—';
  }

  protected parentLabel(): string {
    const template = this.template();
    const version = this.version();
    const name = template ? `${template.code} · ${template.name}` : this.templateId;
    return version ? `${name} (versión ${version.version_number})` : name;
  }

  protected goBack(): void {
    this.router.navigate(['/display_templates', this.templateId, 'versions']);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    const next = this.fields().reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;
    this.form.controls.sort_order.setValue(Math.min(next, MAX_SMALLINT));
    this.mode.set('create');
  }

  protected startEdit(item: DisplayTemplateField): void {
    if (!item.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(item.id);
    this.form.reset({
      field_id: item.field_id,
      pos_x: item.pos_x,
      pos_y: item.pos_y,
      width: item.width,
      height: item.height,
      z_index: item.z_index,
      font_size: item.font_size,
      text_align: item.text_align,
      format_mask: item.format_mask ?? '',
      is_bilingual: item.is_bilingual,
      is_visible: item.is_visible,
      sort_order: item.sort_order,
      properties: this.prettyJson(item.properties),
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
    const editingId = this.editingId();
    const isCreate = this.mode() === 'create';
    const current = isCreate ? null : this.fields().find((item) => item.id === editingId);
    if (!isCreate && !current) {
      this.errorMessage.set('No se encontró el campo a actualizar. Actualiza la lista.');
      return;
    }

    const payload: DisplayTemplateField = {
      ...(current ?? {
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      }),
      id: editingId,
      display_template_version_id: this.versionId,
      field_id: raw.field_id as number,
      pos_x: raw.pos_x as number,
      pos_y: raw.pos_y as number,
      width: raw.width as number,
      height: raw.height as number,
      z_index: raw.z_index as number,
      font_size: raw.font_size,
      text_align: raw.text_align || null,
      format_mask: raw.format_mask.trim() || null,
      is_bilingual: raw.is_bilingual,
      is_visible: raw.is_visible,
      sort_order: raw.sort_order as number,
      properties: raw.properties.trim() || null,
    };
    this.isSaving.set(true);
    const request$ = isCreate ? this.fieldService.add(payload) : this.fieldService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Campo creado correctamente.' : 'Campo actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected toggleVisible(item: DisplayTemplateField, visible: boolean): void {
    if (!item.id || this.isSaving()) return;
    this.clearMessages();
    this.isSaving.set(true);
    this.fieldService
      .update({ ...item, is_visible: visible })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set(
            visible ? 'Campo marcado como visible.' : 'Campo marcado como oculto.',
          );
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveError(error));
          this.load();
        },
      });
  }

  protected askDelete(item: DisplayTemplateField): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(item);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.fieldService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Campo eliminado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private prettyJson(value: string | null): string {
    if (!value) return '';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  private resetForm(): void {
    this.form.reset({
      field_id: null,
      pos_x: 0,
      pos_y: 0,
      width: 10,
      height: 10,
      z_index: 0,
      font_size: null,
      text_align: null,
      format_mask: '',
      is_bilingual: true,
      is_visible: true,
      sort_order: 0,
      properties: '',
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
