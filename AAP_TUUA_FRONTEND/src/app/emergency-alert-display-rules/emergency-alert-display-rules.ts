import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { EmergencyAlertDisplayRule, Feature, FeatureGroup } from '../models';
import { EmergencyAlertDisplayRuleService, FeatureCatalogService } from '../services';

type FormMode = 'list' | 'create' | 'edit';

const ALERT_TYPE_GROUP = 'tipos alerta emergencia';
const DISPLAY_TYPE_GROUP = 'tipos pantalla';

@Component({
  selector: 'app-emergency-alert-display-rules',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './emergency-alert-display-rules.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class EmergencyAlertDisplayRules implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ruleService = inject(EmergencyAlertDisplayRuleService);
  private readonly catalog = inject(FeatureCatalogService);

  protected readonly rules = signal<EmergencyAlertDisplayRule[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly alertTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), ALERT_TYPE_GROUP),
  );
  protected readonly displayTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), DISPLAY_TYPE_GROUP),
  );

  protected readonly selectedAlertTypeId = signal<number | null>(null);
  protected readonly filteredRules = computed(() => {
    const alertTypeId = this.selectedAlertTypeId();
    return this.rules()
      .filter((rule) => alertTypeId === null || rule.alert_type_id === alertTypeId)
      .sort(
        (a, b) =>
          this.featureLabel(a.alert_type_id).localeCompare(this.featureLabel(b.alert_type_id)) ||
          this.featureLabel(a.display_type_id).localeCompare(this.featureLabel(b.display_type_id)),
      );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<EmergencyAlertDisplayRule | null>(null);
  private editingRecord: EmergencyAlertDisplayRule | null = null;

  protected readonly form = this.fb.nonNullable.group({
    alert_type_id: this.fb.control<number | null>(null, Validators.required),
    display_type_id: this.fb.control<number | null>(null, Validators.required),
    is_active: [true],
  });

  private readonly formAlertTypeId = toSignal(this.form.controls.alert_type_id.valueChanges, {
    initialValue: this.form.controls.alert_type_id.value,
  });
  private readonly formDisplayTypeId = toSignal(this.form.controls.display_type_id.valueChanges, {
    initialValue: this.form.controls.display_type_id.value,
  });
  // Regla existente (activa o no) con el mismo par tipo de alerta + tipo de pantalla.
  protected readonly duplicateRule = computed(() => {
    const alertTypeId = this.formAlertTypeId();
    const displayTypeId = this.formDisplayTypeId();
    if (alertTypeId === null || displayTypeId === null) return null;
    return (
      this.rules().find(
        (rule) =>
          rule.id !== this.editingId() &&
          rule.alert_type_id === alertTypeId &&
          rule.display_type_id === displayTypeId,
      ) ?? null
    );
  });

  ngOnInit(): void {
    this.loadCatalogs();
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.ruleService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rules) => this.rules.set(rules ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalogs(): void {
    this.catalog.loadGroups([ALERT_TYPE_GROUP, DISPLAY_TYPE_GROUP]).subscribe({
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

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingRecord = null;
    this.resetForm();
    this.form.controls.alert_type_id.setValue(this.selectedAlertTypeId());
    this.mode.set('create');
  }

  protected startEdit(rule: EmergencyAlertDisplayRule): void {
    if (!rule.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(rule.id);
    this.editingRecord = rule;
    this.form.reset({
      alert_type_id: rule.alert_type_id,
      display_type_id: rule.display_type_id,
      is_active: rule.is_active,
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

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.duplicateRule()) return;

    const raw = this.form.getRawValue();
    const isCreate = this.mode() === 'create';
    const current = isCreate ? null : this.editingRecord;
    const payload: EmergencyAlertDisplayRule = {
      ...current,
      id: isCreate ? null : this.editingId(),
      alert_type_id: raw.alert_type_id as number,
      display_type_id: raw.display_type_id as number,
      is_active: isCreate ? true : raw.is_active,
      created_at: current?.created_at ?? null,
      updated_at: current?.updated_at ?? null,
      created_by: current?.created_by ?? null,
      modified_by: current?.modified_by ?? null,
    };
    this.isSaving.set(true);
    const request$ = isCreate ? this.ruleService.add(payload) : this.ruleService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingRecord = null;
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Regla creada correctamente.' : 'Regla actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(rule: EmergencyAlertDisplayRule): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(rule);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.ruleService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Regla desactivada correctamente.');
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
      alert_type_id: null,
      display_type_id: null,
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
