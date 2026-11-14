import { HttpErrorResponse } from '@angular/common/http';
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
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AdCampaign, AdCampaignItem, FeatureGroup, MediaAsset } from '../models';
import {
  AdCampaignItemService,
  AdCampaignService,
  FeatureCatalogService,
  MediaAssetService,
} from '../services';

type FormMode = 'list' | 'create' | 'edit';

const MEDIA_TYPE_GROUP = 'tipos multimedia';
// sort_order y duration_seconds son smallint en la base de datos.
const MAX_SMALLINT = 32767;

function integerValidator(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  return value === null || value === undefined || Number.isInteger(value)
    ? null
    : { integer: true };
}

@Component({
  selector: 'app-ad-campaign-items',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './ad-campaign-items.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class AdCampaignItems implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly itemService = inject(AdCampaignItemService);
  private readonly campaignService = inject(AdCampaignService);
  private readonly mediaAssetService = inject(MediaAssetService);
  private readonly featureCatalog = inject(FeatureCatalogService);

  protected readonly campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
  protected readonly items = signal<AdCampaignItem[]>([]);
  protected readonly campaign = signal<AdCampaign | null>(null);
  protected readonly mediaAssets = signal<MediaAsset[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly sortedItems = computed(() =>
    [...this.items()].sort((a, b) => a.sort_order - b.sort_order),
  );
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<AdCampaignItem | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    media_asset_id: this.fb.control<string | null>(null, Validators.required),
    sort_order: this.fb.control<number | null>(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_SMALLINT),
      integerValidator,
    ]),
    duration_seconds: this.fb.control<number | null>(null, [
      Validators.min(1),
      Validators.max(MAX_SMALLINT),
      integerValidator,
    ]),
    is_active: [true],
  });

  private readonly formMediaAssetId = toSignal(this.form.controls.media_asset_id.valueChanges, {
    initialValue: this.form.controls.media_asset_id.value,
  });
  // Recursos activos de la campaña (del mismo aeropuerto o globales), más el ya asignado al editar.
  protected readonly mediaOptions = computed(() => {
    const airportId = this.campaign()?.airport_id ?? null;
    const selected = this.formMediaAssetId();
    return this.mediaAssets()
      .filter(
        (asset) =>
          asset.id === selected ||
          (asset.is_active && (!airportId || !asset.airport_id || asset.airport_id === airportId)),
      )
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      items: this.itemService.getByAdCampaignId(this.campaignId),
      campaign: this.campaignService.getById(this.campaignId),
      mediaAssets: this.mediaAssetService.getAll(),
      groups: this.featureCatalog.loadGroups([MEDIA_TYPE_GROUP]),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ items, campaign, mediaAssets, groups }) => {
          this.items.set(items ?? []);
          this.campaign.set(campaign);
          this.mediaAssets.set(mediaAssets ?? []);
          this.groups.set(groups ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected campaignLabel(): string {
    return this.campaign()?.name || this.campaignId;
  }

  protected assetOf(id: string | null): MediaAsset | null {
    return id ? (this.mediaAssets().find((asset) => asset.id === id) ?? null) : null;
  }

  protected assetLabel(id: string | null): string {
    if (!id) return '—';
    return this.assetOf(id)?.name || id;
  }

  protected assetTypeLabel(id: string | null): string {
    const asset = this.assetOf(id);
    return asset ? this.featureCatalog.label(this.groups(), asset.media_type_id) : '—';
  }

  // Duración propia del elemento o, si no tiene, la del recurso multimedia.
  protected durationLabel(item: AdCampaignItem): string {
    if (item.duration_seconds !== null && item.duration_seconds !== undefined) {
      return `${item.duration_seconds} s`;
    }
    const assetDuration = this.assetOf(item.media_asset_id)?.duration_seconds;
    return assetDuration ? `${assetDuration} s (del recurso)` : '—';
  }

  protected goBack(): void {
    this.router.navigateByUrl('/ad_campaigns');
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    const maxOrder = this.items().reduce((max, item) => Math.max(max, item.sort_order), 0);
    this.form.controls.sort_order.setValue(this.items().length > 0 ? maxOrder + 1 : 1);
    this.mode.set('create');
  }

  protected startEdit(item: AdCampaignItem): void {
    if (!item.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(item.id);
    this.form.reset({
      media_asset_id: item.media_asset_id,
      sort_order: item.sort_order,
      duration_seconds: item.duration_seconds,
      is_active: item.is_active,
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
    const isCreate = this.mode() === 'create';
    const current = isCreate ? null : this.items().find((item) => item.id === this.editingId());
    const payload: AdCampaignItem = {
      ...(current ?? {
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      }),
      id: this.editingId(),
      ad_campaign_id: this.campaignId,
      media_asset_id: raw.media_asset_id as string,
      sort_order: raw.sort_order ?? 0,
      duration_seconds: raw.duration_seconds,
      is_active: isCreate ? true : raw.is_active,
    };
    this.isSaving.set(true);
    const request$ = isCreate ? this.itemService.add(payload) : this.itemService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Contenido agregado correctamente.' : 'Contenido actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(item: AdCampaignItem): void {
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
    this.itemService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Contenido desactivado correctamente.');
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
      media_asset_id: null,
      sort_order: 0,
      duration_seconds: null,
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
