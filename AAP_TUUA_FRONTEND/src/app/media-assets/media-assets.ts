import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin } from 'rxjs';
import { Airport, FeatureGroup, MediaAsset } from '../models';
import { AirportService, FeatureCatalogService, MediaAssetService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

const MEDIA_TYPE_GROUP = 'tipos multimedia';
const TEXT_TYPE_ABBREVIATION = 'TEXT';
const IMAGE_TYPE_ABBREVIATIONS = ['JPG', 'PNG', 'GIF', 'SVG'];
const MAX_INT32 = 2147483647;

@Component({
  selector: 'app-media-assets',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './media-assets.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class MediaAssets implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assetService = inject(MediaAssetService);
  private readonly airportService = inject(AirportService);
  private readonly catalogs = inject(FeatureCatalogService);

  protected readonly assets = signal<MediaAsset[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedTypeId = signal<number | null>(null);
  protected readonly search = signal('');
  protected readonly mediaTypes = computed(() =>
    this.catalogs.featuresOf(this.groups(), MEDIA_TYPE_GROUP),
  );
  protected readonly textTypeId = computed(
    () =>
      this.catalogs.findByAbbreviation(this.groups(), MEDIA_TYPE_GROUP, TEXT_TYPE_ABBREVIATION)
        ?.id ?? null,
  );
  protected readonly filteredAssets = computed(() => {
    const airportId = this.selectedAirportId();
    const typeId = this.selectedTypeId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.assets().filter(
      (asset) =>
        (!airportId || asset.airport_id === airportId) &&
        (typeId === null || asset.media_type_id === typeId) &&
        (!query ||
          [asset.name, asset.storage_path, asset.mime_type, asset.text_content].some((value) =>
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
  protected readonly deleteTarget = signal<MediaAsset | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null),
    media_type_id: this.fb.control<number | null>(null, Validators.required),
    name: ['', [Validators.required, notBlank, Validators.maxLength(200)]],
    storage_path: ['', [Validators.required, notBlank, Validators.maxLength(500)]],
    text_content: ['', [Validators.maxLength(2000)]],
    mime_type: ['', [Validators.maxLength(100)]],
    file_size_bytes: this.fb.control<number | null>(null, [
      Validators.min(0),
      Validators.max(Number.MAX_SAFE_INTEGER),
      Validators.pattern(/^\d+$/),
    ]),
    width_px: this.fb.control<number | null>(null, [
      Validators.min(1),
      Validators.max(MAX_INT32),
      Validators.pattern(/^\d+$/),
    ]),
    height_px: this.fb.control<number | null>(null, [
      Validators.min(1),
      Validators.max(MAX_INT32),
      Validators.pattern(/^\d+$/),
    ]),
    duration_seconds: this.fb.control<number | null>(null, [
      Validators.min(0),
      Validators.max(MAX_INT32),
      Validators.pattern(/^\d+$/),
    ]),
    checksum_sha256: ['', [Validators.maxLength(64)]],
    is_active: [true],
  });

  private readonly formTypeId = toSignal(this.form.controls.media_type_id.valueChanges, {
    initialValue: this.form.controls.media_type_id.value,
  });
  // Los mensajes de texto no tienen archivo: se pide el contenido en lugar de la ruta.
  protected readonly isTextType = computed(
    () => this.textTypeId() !== null && this.formTypeId() === this.textTypeId(),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      assets: this.assetService.getAll(),
      airports: this.airportService.getAll(),
      groups: this.catalogs.loadGroups([MEDIA_TYPE_GROUP]),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ assets, airports, groups }) => {
          this.assets.set(assets ?? []);
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

  protected typeLabel(id: number | null): string {
    return this.catalogs.label(this.groups(), id);
  }

  protected optionLabel(feature: {
    description: string | null;
    abbreviation: string | null;
  }): string {
    return feature.description || feature.abbreviation || '—';
  }

  protected isImage(asset: MediaAsset): boolean {
    if ((asset.mime_type ?? '').toLocaleLowerCase().startsWith('image/')) return true;
    return IMAGE_TYPE_ABBREVIATIONS.includes(this.typeAbbreviation(asset.media_type_id));
  }

  protected canPreview(asset: MediaAsset): boolean {
    const path = (asset.storage_path ?? '').trim();
    return this.isImage(asset) && (/^https?:\/\//i.test(path) || path.startsWith('/'));
  }

  protected typeIcon(asset: MediaAsset): string {
    if (this.isImage(asset)) return 'image';
    const abbreviation = this.typeAbbreviation(asset.media_type_id);
    if (abbreviation === TEXT_TYPE_ABBREVIATION) return 'text_fields';
    if (
      abbreviation === 'MP4' ||
      (asset.mime_type ?? '').toLocaleLowerCase().startsWith('video/')
    ) {
      return 'movie';
    }
    return 'insert_drive_file';
  }

  protected sizeLabel(bytes: number | null): string {
    if (bytes === null || bytes === undefined) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  protected contentLabel(asset: MediaAsset): string {
    const value = asset.storage_path || asset.text_content;
    if (!value) return '—';
    return value.length > 60 ? `${value.slice(0, 60)}…` : value;
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    this.form.controls.airport_id.setValue(this.selectedAirportId());
    this.form.controls.media_type_id.setValue(this.selectedTypeId());
    this.applyTypeValidators();
    this.mode.set('create');
  }

  protected startEdit(asset: MediaAsset): void {
    if (!asset.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(asset.id);
    this.form.reset({
      airport_id: asset.airport_id,
      media_type_id: asset.media_type_id,
      name: asset.name ?? '',
      storage_path: asset.storage_path ?? '',
      text_content: asset.text_content ?? '',
      mime_type: asset.mime_type ?? '',
      file_size_bytes: asset.file_size_bytes,
      width_px: asset.width_px,
      height_px: asset.height_px,
      duration_seconds: asset.duration_seconds,
      checksum_sha256: asset.checksum_sha256 ?? '',
      is_active: asset.is_active,
    });
    this.applyTypeValidators();
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.resetForm();
  }

  protected onTypeChange(): void {
    this.applyTypeValidators();
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    this.applyTypeValidators();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const editingId = this.editingId();
    const isCreate = this.mode() === 'create';
    const current = isCreate ? null : this.assets().find((item) => item.id === editingId);
    if (!isCreate && !current) {
      this.errorMessage.set('No se encontró el recurso a actualizar. Actualiza la lista.');
      return;
    }

    const isText = this.isTextType();
    const payload: MediaAsset = {
      ...(current ?? {
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      }),
      id: editingId,
      airport_id: raw.airport_id,
      media_type_id: raw.media_type_id as number,
      name: raw.name.trim(),
      storage_path: isText ? null : raw.storage_path.trim() || null,
      text_content: isText ? raw.text_content.trim() || null : null,
      mime_type: raw.mime_type.trim() || null,
      file_size_bytes: raw.file_size_bytes,
      width_px: raw.width_px,
      height_px: raw.height_px,
      duration_seconds: raw.duration_seconds,
      checksum_sha256: raw.checksum_sha256.trim() || null,
      is_active: raw.is_active,
    };
    this.isSaving.set(true);
    const request$ = isCreate ? this.assetService.add(payload) : this.assetService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Recurso creado correctamente.' : 'Recurso actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(asset: MediaAsset): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(asset);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.assetService
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

  private typeAbbreviation(id: number | null): string {
    if (id === null || id === undefined) return '';
    for (const group of this.groups()) {
      const feature = (group.features ?? []).find((item) => item.id === id);
      if (feature) return (feature.abbreviation ?? '').trim().toLocaleUpperCase();
    }
    return '';
  }

  // Ruta obligatoria salvo en mensajes de texto, donde es obligatorio el contenido.
  private applyTypeValidators(): void {
    const isText =
      this.textTypeId() !== null && this.form.controls.media_type_id.value === this.textTypeId();
    const pathRules: ValidatorFn[] = [Validators.maxLength(500)];
    const textRules: ValidatorFn[] = [Validators.maxLength(2000)];
    if (isText) textRules.push(Validators.required, notBlank);
    else pathRules.push(Validators.required, notBlank);
    this.form.controls.storage_path.setValidators(pathRules);
    this.form.controls.text_content.setValidators(textRules);
    this.form.controls.storage_path.updateValueAndValidity({ emitEvent: false });
    this.form.controls.text_content.updateValueAndValidity({ emitEvent: false });
  }

  private resetForm(): void {
    this.form.reset({
      airport_id: null,
      media_type_id: null,
      name: '',
      storage_path: '',
      text_content: '',
      mime_type: '',
      file_size_bytes: null,
      width_px: null,
      height_px: null,
      duration_seconds: null,
      checksum_sha256: '',
      is_active: true,
    });
    this.applyTypeValidators();
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
