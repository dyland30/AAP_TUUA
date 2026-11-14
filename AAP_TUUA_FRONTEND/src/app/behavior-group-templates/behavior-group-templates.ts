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
import {
  BehaviorGroup,
  BehaviorGroupTemplate,
  DisplayTemplate,
  Feature,
  FeatureGroup,
} from '../models';
import {
  BehaviorGroupService,
  BehaviorGroupTemplateService,
  DisplayTemplateService,
  FeatureCatalogService,
} from '../services';

type FormMode = 'list' | 'create' | 'edit';

function integer(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined) return null;
  return Number.isInteger(value) ? null : { integer: true };
}

@Component({
  selector: 'app-behavior-group-templates',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './behavior-group-templates.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class BehaviorGroupTemplates implements OnInit {
  private static readonly OrientationGroup = 'orientacion pantalla';
  private static readonly ResolutionGroup = 'resoluciones pantalla';

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assignmentService = inject(BehaviorGroupTemplateService);
  private readonly groupService = inject(BehaviorGroupService);
  private readonly templateService = inject(DisplayTemplateService);
  private readonly catalog = inject(FeatureCatalogService);

  protected readonly groupId = this.route.snapshot.paramMap.get('groupId') ?? '';
  protected readonly assignments = signal<BehaviorGroupTemplate[]>([]);
  protected readonly behaviorGroup = signal<BehaviorGroup | null>(null);
  protected readonly displayTemplates = signal<DisplayTemplate[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);

  protected readonly orientations = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroupTemplates.OrientationGroup),
  );
  protected readonly resolutions = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroupTemplates.ResolutionGroup),
  );

  protected readonly search = signal('');
  protected readonly filteredAssignments = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.assignments().filter(
      (item) =>
        !query ||
        [this.templateLabel(item.display_template_id)].some((value) =>
          value.toLocaleLowerCase().includes(query),
        ),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingAssignment = signal<BehaviorGroupTemplate | null>(null);
  protected readonly deleteTarget = signal<BehaviorGroupTemplate | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    display_template_id: this.fb.control<string | null>(null, Validators.required),
    orientation_id: this.fb.control<number | null>(null),
    resolution_id: this.fb.control<number | null>(null),
    flight_slots: this.fb.control<number | null>(null, [
      integer,
      Validators.min(1),
      Validators.max(32767),
    ]),
    is_default: [false],
    is_active: [true],
  });

  private readonly formIsDefault = toSignal(this.form.controls.is_default.valueChanges, {
    initialValue: this.form.controls.is_default.value,
  });
  private readonly formOrientationId = toSignal(this.form.controls.orientation_id.valueChanges, {
    initialValue: this.form.controls.orientation_id.value,
  });
  private readonly formResolutionId = toSignal(this.form.controls.resolution_id.valueChanges, {
    initialValue: this.form.controls.resolution_id.value,
  });

  protected readonly templateOptions = computed(() => {
    const airportId = this.behaviorGroup()?.airport_id ?? null;
    const current = this.editingAssignment()?.display_template_id;
    return this.displayTemplates().filter(
      (template) =>
        (template.is_active || template.id === current) &&
        (!airportId || !template.airport_id || template.airport_id === airportId),
    );
  });

  // Aviso no bloqueante: el servidor no valida que exista una sola plantilla predeterminada.
  protected readonly defaultConflict = computed(() => {
    if (!this.formIsDefault()) return false;
    const orientationId = this.formOrientationId();
    const resolutionId = this.formResolutionId();
    const editingId = this.editingId();
    return this.assignments().some(
      (item) =>
        item.is_default &&
        item.is_active &&
        item.id !== editingId &&
        item.orientation_id === orientationId &&
        item.resolution_id === resolutionId,
    );
  });

  ngOnInit(): void {
    this.catalog
      .loadGroups([BehaviorGroupTemplates.OrientationGroup, BehaviorGroupTemplates.ResolutionGroup])
      .subscribe({
        next: (groups) => this.groups.set(groups),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      assignments: this.assignmentService.getByBehaviorGroupId(this.groupId),
      group: this.groupService.getById(this.groupId),
      templates: this.templateService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ assignments, group, templates }) => {
          this.assignments.set(assignments ?? []);
          this.behaviorGroup.set(group);
          this.displayTemplates.set(templates ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected groupLabel(): string {
    const group = this.behaviorGroup();
    return group ? `${group.code} · ${group.name}` : this.groupId;
  }

  protected featureText(feature: Feature): string {
    return feature.description || feature.abbreviation || String(feature.id);
  }

  protected featureLabel(id: number | null): string {
    return this.catalog.label(this.groups(), id);
  }

  protected templateLabel(id: string | null): string {
    if (!id) return '—';
    const template = this.displayTemplates().find((item) => item.id === id);
    return template ? `${template.code} · ${template.name}` : id;
  }

  protected goBack(): void {
    this.router.navigateByUrl('/behavior_groups');
  }

  protected onTemplateChange(): void {
    // Sugiere orientación, resolución y vuelos por pantalla de la plantilla elegida.
    const id = this.form.controls.display_template_id.value;
    const template = this.displayTemplates().find((item) => item.id === id);
    if (!template) return;
    const controls = this.form.controls;
    if (controls.orientation_id.value === null) {
      controls.orientation_id.setValue(template.orientation_id);
    }
    if (controls.resolution_id.value === null) {
      controls.resolution_id.setValue(template.resolution_id);
    }
    if (controls.flight_slots.value === null) {
      controls.flight_slots.setValue(template.flight_slots);
    }
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingAssignment.set(null);
    this.resetForm();
    this.mode.set('create');
  }

  protected startEdit(item: BehaviorGroupTemplate): void {
    if (!item.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(item.id);
    this.editingAssignment.set(item);
    this.form.reset({
      display_template_id: item.display_template_id,
      orientation_id: item.orientation_id,
      resolution_id: item.resolution_id,
      flight_slots: item.flight_slots,
      is_default: item.is_default,
      is_active: item.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.editingAssignment.set(null);
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
    const payload: BehaviorGroupTemplate = {
      id: isCreate ? null : this.editingId(),
      behavior_group_id: this.groupId,
      display_template_id: raw.display_template_id as string,
      orientation_id: raw.orientation_id,
      resolution_id: raw.resolution_id,
      flight_slots: raw.flight_slots,
      is_default: raw.is_default,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.assignmentService.add(payload)
      : this.assignmentService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingAssignment.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Plantilla asignada correctamente.' : 'Asignación actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(item: BehaviorGroupTemplate): void {
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
    this.assignmentService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Asignación desactivada correctamente.');
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
      display_template_id: null,
      orientation_id: null,
      resolution_id: null,
      flight_slots: null,
      is_default: false,
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
