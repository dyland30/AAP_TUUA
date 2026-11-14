import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { DisplayTemplate, DisplayTemplateVersion, FeatureGroup, MediaAsset } from '../models';
import {
  DisplayTemplateService,
  DisplayTemplateVersionService,
  FeatureCatalogService,
  MediaAssetService,
} from '../services';
import { jsonText } from '../validators/json-text.validator';

type FormMode = 'list' | 'create' | 'edit';

const MEDIA_TYPE_GROUP = 'tipos multimedia';

@Component({
  selector: 'app-display-template-versions',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './display-template-versions.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class DisplayTemplateVersions implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly versionService = inject(DisplayTemplateVersionService);
  private readonly templateService = inject(DisplayTemplateService);
  private readonly mediaAssetService = inject(MediaAssetService);
  private readonly catalogs = inject(FeatureCatalogService);

  protected readonly templateId = this.route.snapshot.paramMap.get('templateId') ?? '';
  protected readonly versions = signal<DisplayTemplateVersion[]>([]);
  protected readonly template = signal<DisplayTemplate | null>(null);
  protected readonly mediaAssets = signal<MediaAsset[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly search = signal('');
  protected readonly filteredVersions = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.versions().filter(
      (item) =>
        !query ||
        String(item.version_number).includes(query) ||
        (item.change_notes ?? '').toLocaleLowerCase().includes(query),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<DisplayTemplateVersion | null>(null);
  protected readonly publishTarget = signal<DisplayTemplateVersion | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    version_number: this.fb.control<number | null>(1, [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^\d+$/),
    ]),
    layout: this.fb.nonNullable.control('', [jsonText]),
    styles: this.fb.nonNullable.control('', [jsonText]),
    background_media_asset_id: this.fb.control<string | null>(null),
    change_notes: ['', [Validators.maxLength(500)]],
  });

  private readonly formBackgroundId = toSignal(
    this.form.controls.background_media_asset_id.valueChanges,
    { initialValue: this.form.controls.background_media_asset_id.value },
  );
  protected readonly backgroundOptions = computed(() => {
    const airportId = this.template()?.airport_id ?? null;
    const selected = this.formBackgroundId();
    return this.mediaAssets().filter(
      (asset) =>
        asset.id === selected ||
        (asset.is_active && (!airportId || !asset.airport_id || asset.airport_id === airportId)),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      versions: this.versionService.getByDisplayTemplateId(this.templateId),
      template: this.templateService.getById(this.templateId),
      mediaAssets: this.mediaAssetService.getAll(),
      groups: this.catalogs.loadGroups([MEDIA_TYPE_GROUP]),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ versions, template, mediaAssets, groups }) => {
          this.versions.set(versions ?? []);
          this.template.set(template);
          this.mediaAssets.set(mediaAssets ?? []);
          this.groups.set(groups ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected templateLabel(): string {
    const template = this.template();
    return template ? `${template.code} · ${template.name}` : this.templateId;
  }

  protected mediaLabel(id: string | null): string {
    if (!id) return '—';
    const asset = this.mediaAssets().find((item) => item.id === id);
    if (!asset) return id;
    return `${asset.name} (${this.catalogs.label(this.groups(), asset.media_type_id)})`;
  }

  protected isCurrent(version: DisplayTemplateVersion): boolean {
    return !!version.id && this.template()?.current_version_id === version.id;
  }

  protected goBack(): void {
    this.router.navigateByUrl('/display_templates');
  }

  protected viewFields(version: DisplayTemplateVersion): void {
    if (!version.id) return;
    this.router.navigate(['/display_templates', this.templateId, 'versions', version.id, 'fields']);
  }

  protected viewWidgets(version: DisplayTemplateVersion): void {
    if (!version.id) return;
    this.router.navigate([
      '/display_templates',
      this.templateId,
      'versions',
      version.id,
      'widgets',
    ]);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.closeConfirmations();
    this.editingId.set(null);
    this.resetForm();
    const next = this.versions().reduce((max, item) => Math.max(max, item.version_number), 0) + 1;
    this.form.controls.version_number.setValue(next);
    this.mode.set('create');
  }

  protected startEdit(version: DisplayTemplateVersion): void {
    if (!version.id || this.isSaving()) return;
    this.clearMessages();
    this.closeConfirmations();
    this.editingId.set(version.id);
    this.form.reset({
      version_number: version.version_number,
      layout: this.prettyJson(version.layout),
      styles: this.prettyJson(version.styles),
      background_media_asset_id: version.background_media_asset_id,
      change_notes: version.change_notes ?? '',
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
    const versionNumber = raw.version_number as number;
    if (
      this.versions().some((item) => item.id !== editingId && item.version_number === versionNumber)
    ) {
      this.errorMessage.set('Ya existe una versión con ese número para esta plantilla.');
      return;
    }

    const isCreate = this.mode() === 'create';
    const current = isCreate ? null : this.versions().find((item) => item.id === editingId);
    if (!isCreate && !current) {
      this.errorMessage.set('No se encontró la versión a actualizar. Actualiza la lista.');
      return;
    }

    const payload: DisplayTemplateVersion = {
      ...(current ?? {
        is_published: false,
        published_at: null,
        published_by: null,
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      }),
      id: editingId,
      display_template_id: this.templateId,
      version_number: versionNumber,
      layout: raw.layout.trim() || null,
      styles: raw.styles.trim() || null,
      background_media_asset_id: raw.background_media_asset_id,
      change_notes: raw.change_notes.trim() || null,
    };
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.versionService.add(payload)
      : this.versionService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Versión creada correctamente.' : 'Versión actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askPublish(version: DisplayTemplateVersion): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.closeConfirmations();
    this.publishTarget.set(version);
  }

  protected cancelPublish(): void {
    if (!this.isSaving()) this.publishTarget.set(null);
  }

  // Publica la versión (is_published + published_at) y la deja como versión vigente de la plantilla.
  protected confirmPublish(): void {
    const target = this.publishTarget();
    if (!target?.id || this.isSaving()) return;
    const template = this.template();
    const published: DisplayTemplateVersion = {
      ...target,
      is_published: true,
      published_at: new Date().toISOString(),
    };
    this.isSaving.set(true);
    this.versionService
      .update(published)
      .pipe(
        switchMap(() =>
          template
            ? this.templateService.update({ ...template, current_version_id: target.id })
            : of(null),
        ),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.publishTarget.set(null);
          this.successMessage.set(
            `Versión ${target.version_number} publicada y establecida como vigente.`,
          );
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.publishTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
          this.load();
        },
      });
  }

  protected askDelete(version: DisplayTemplateVersion): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.closeConfirmations();
    this.deleteTarget.set(version);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.versionService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Versión eliminada correctamente.');
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

  private closeConfirmations(): void {
    this.deleteTarget.set(null);
    this.publishTarget.set(null);
  }

  private resetForm(): void {
    this.form.reset({
      version_number: 1,
      layout: '',
      styles: '',
      background_media_asset_id: null,
      change_notes: '',
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
