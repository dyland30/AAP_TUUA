import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { Feature, FeatureGroup } from '../models';
import { FeatureService } from '../services/feature.service';

@Component({
  selector: 'app-features',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './features.html',
  styleUrl: './features.css',
})
export class Features implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly featureService = inject(FeatureService);

  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly features = signal<Feature[]>([]);
  protected readonly selectedGroupId = signal<number | null>(null);
  protected readonly selectedGroup = computed(
    () => this.groups().find((group) => group.id === this.selectedGroupId()) ?? null,
  );

  protected readonly editingGroupId = signal<number | null>(null);
  protected readonly editingFeatureId = signal<number | null>(null);
  protected readonly deleteFeatureTarget = signal<Feature | null>(null);

  protected readonly isLoadingGroups = signal(false);
  protected readonly isLoadingFeatures = signal(false);
  protected readonly isSavingGroup = signal(false);
  protected readonly isSavingFeature = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly groupCreateForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
  });

  protected readonly groupEditForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
  });

  protected readonly featureCreateForm = this.fb.nonNullable.group({
    description: ['', [Validators.required]],
    abbreviation: [''],
    feature_value: ['', [Validators.required]],
    is_active: [true],
    parent_id: this.fb.control<number | null>(null),
  });

  protected readonly featureEditForm = this.fb.nonNullable.group({
    description: ['', [Validators.required]],
    abbreviation: [''],
    feature_value: ['', [Validators.required]],
    is_active: [true],
    parent_id: this.fb.control<number | null>(null),
  });

  ngOnInit(): void {
    this.loadGroups();
  }

  /* ----------------------------- Carga de datos ----------------------------- */

  protected loadGroups(selectId?: number): void {
    this.isLoadingGroups.set(true);
    this.featureService
      .getAllFeatureGroups()
      .pipe(finalize(() => this.isLoadingGroups.set(false)))
      .subscribe({
        next: (groups) => {
          const list = groups ?? [];
          this.groups.set(list);

          const current = selectId ?? this.selectedGroupId();
          const stillExists = current !== null && list.some((group) => group.id === current);
          this.selectGroup(stillExists ? (current as number) : (list[0]?.id ?? null));
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected selectGroup(groupId: number | null): void {
    this.selectedGroupId.set(groupId);
    this.editingFeatureId.set(null);
    this.deleteFeatureTarget.set(null);
    this.features.set([]);

    if (groupId === null) {
      return;
    }

    this.loadFeatures(groupId);
  }

  protected loadFeatures(groupId: number): void {
    this.isLoadingFeatures.set(true);
    this.featureService
      .getFeaturesByGroup(groupId)
      .pipe(finalize(() => this.isLoadingFeatures.set(false)))
      .subscribe({
        next: (features) => this.features.set(features ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  /* ------------------------------ Feature groups ---------------------------- */

  protected addGroup(): void {
    if (this.isSavingGroup()) {
      return;
    }

    this.clearMessages();

    if (this.groupCreateForm.invalid) {
      this.groupCreateForm.markAllAsTouched();
      return;
    }

    const raw = this.groupCreateForm.getRawValue();
    const payload = this.buildGroupPayload(0, raw.name, raw.description);

    this.isSavingGroup.set(true);
    this.featureService
      .addFeatureGroup(payload)
      .pipe(finalize(() => this.isSavingGroup.set(false)))
      .subscribe({
        next: (created) => {
          this.groupCreateForm.reset({ name: '', description: '' });
          this.successMessage.set('Grupo creado correctamente.');
          this.loadGroups(created?.id);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected startEditGroup(group: FeatureGroup): void {
    this.clearMessages();
    this.editingGroupId.set(group.id);
    this.groupEditForm.reset({ name: group.name ?? '', description: group.description ?? '' });
  }

  protected cancelEditGroup(): void {
    this.editingGroupId.set(null);
    this.groupEditForm.reset({ name: '', description: '' });
  }

  protected saveGroup(): void {
    const id = this.editingGroupId();
    if (id === null || this.isSavingGroup()) {
      return;
    }

    this.clearMessages();

    if (this.groupEditForm.invalid) {
      this.groupEditForm.markAllAsTouched();
      return;
    }

    const raw = this.groupEditForm.getRawValue();
    const payload = this.buildGroupPayload(id, raw.name, raw.description);

    this.isSavingGroup.set(true);
    this.featureService
      .updateFeatureGroup(payload)
      .pipe(finalize(() => this.isSavingGroup.set(false)))
      .subscribe({
        next: () => {
          this.editingGroupId.set(null);
          this.groupEditForm.reset({ name: '', description: '' });
          this.successMessage.set('Grupo actualizado correctamente.');
          this.loadGroups(id);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  /* -------------------------------- Features -------------------------------- */

  protected addFeature(): void {
    const groupId = this.selectedGroupId();
    if (groupId === null || this.isSavingFeature()) {
      return;
    }

    this.clearMessages();

    if (this.featureCreateForm.invalid) {
      this.featureCreateForm.markAllAsTouched();
      return;
    }

    const payload = this.buildFeaturePayload(0, groupId, this.featureCreateForm.getRawValue());

    this.isSavingFeature.set(true);
    this.featureService
      .addFeature(payload)
      .pipe(finalize(() => this.isSavingFeature.set(false)))
      .subscribe({
        next: () => {
          this.resetFeatureCreateForm();
          this.successMessage.set('Feature creado correctamente.');
          this.loadFeatures(groupId);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected startEditFeature(feature: Feature): void {
    this.clearMessages();
    this.editingFeatureId.set(feature.id);
    this.featureEditForm.reset({
      description: feature.description ?? '',
      abbreviation: feature.abbreviation ?? '',
      feature_value: feature.feature_value ?? '',
      is_active: feature.is_active,
      parent_id: feature.parent_id,
    });
  }

  protected cancelEditFeature(): void {
    this.editingFeatureId.set(null);
    this.resetFeatureEditForm();
  }

  protected saveFeature(): void {
    const id = this.editingFeatureId();
    const groupId = this.selectedGroupId();
    if (id === null || groupId === null || this.isSavingFeature()) {
      return;
    }

    this.clearMessages();

    if (this.featureEditForm.invalid) {
      this.featureEditForm.markAllAsTouched();
      return;
    }

    const payload = this.buildFeaturePayload(id, groupId, this.featureEditForm.getRawValue());

    this.isSavingFeature.set(true);
    this.featureService
      .updateFeature(payload)
      .pipe(finalize(() => this.isSavingFeature.set(false)))
      .subscribe({
        next: () => {
          this.editingFeatureId.set(null);
          this.resetFeatureEditForm();
          this.successMessage.set('Feature actualizado correctamente.');
          this.loadFeatures(groupId);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected askDeleteFeature(feature: Feature): void {
    this.clearMessages();
    this.deleteFeatureTarget.set(feature);
  }

  protected cancelDeleteFeature(): void {
    this.deleteFeatureTarget.set(null);
  }

  protected confirmDeleteFeature(): void {
    const target = this.deleteFeatureTarget();
    const groupId = this.selectedGroupId();
    if (!target || groupId === null || this.isSavingFeature()) {
      return;
    }

    this.isSavingFeature.set(true);
    this.featureService
      .updateFeature({ ...target, is_active: false })
      .pipe(finalize(() => this.isSavingFeature.set(false)))
      .subscribe({
        next: () => {
          this.deleteFeatureTarget.set(null);
          this.successMessage.set('Feature eliminado correctamente.');
          this.loadFeatures(groupId);
        },
        error: (error: HttpErrorResponse) => {
          this.deleteFeatureTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  /* --------------------------------- Helpers -------------------------------- */

  protected parentOptions(): Feature[] {
    const editingId = this.editingFeatureId();
    return this.features().filter((feature) => feature.id !== editingId);
  }

  protected parentLabel(parentId: number | null): string {
    if (parentId === null) {
      return '—';
    }
    return this.features().find((feature) => feature.id === parentId)?.description ?? '—';
  }

  private buildGroupPayload(id: number, name: string, description: string): FeatureGroup {
    return {
      id,
      name,
      description,
      features: null,
      created_by: null,
      modified_by: null,
      created_date: null,
      modified_date: null,
    };
  }

  private buildFeaturePayload(
    id: number,
    groupId: number,
    raw: {
      description: string;
      abbreviation: string;
      feature_value: string;
      is_active: boolean;
      parent_id: number | null;
    },
  ): Feature {
    return {
      id,
      description: raw.description,
      abbreviation: raw.abbreviation || null,
      feature_value: raw.feature_value,
      is_active: raw.is_active,
      parent_id: raw.parent_id,
      feature_group_id: groupId,
      created_by: null,
      modified_by: null,
      created_date: null,
      modified_date: null,
    };
  }

  private resetFeatureCreateForm(): void {
    this.featureCreateForm.reset({
      description: '',
      abbreviation: '',
      feature_value: '',
      is_active: true,
      parent_id: null,
    });
  }

  private resetFeatureEditForm(): void {
    this.featureEditForm.reset({
      description: '',
      abbreviation: '',
      feature_value: '',
      is_active: true,
      parent_id: null,
    });
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
