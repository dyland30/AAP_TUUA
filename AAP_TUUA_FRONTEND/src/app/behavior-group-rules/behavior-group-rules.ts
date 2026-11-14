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
  Airport,
  AirportSector,
  BehaviorGroup,
  BehaviorGroupRule,
  Feature,
  FeatureGroup,
} from '../models';
import {
  AirportSectorService,
  AirportService,
  BehaviorGroupRuleService,
  BehaviorGroupService,
  FeatureCatalogService,
} from '../services';

type FormMode = 'list' | 'create' | 'edit';

function integer(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined) return null;
  return Number.isInteger(value) ? null : { integer: true };
}

@Component({
  selector: 'app-behavior-group-rules',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './behavior-group-rules.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class BehaviorGroupRules implements OnInit {
  private static readonly RuleTypeGroup = 'tipos regla grupo';
  // Campo evaluado por la regla: se usa el catálogo de campos de vuelo de las plantillas.
  private static readonly FieldGroup = 'campos plantilla';
  private static readonly OperatorGroup = 'operadores regla';
  private static readonly FlightStatusGroup = 'estados vuelo fids';

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ruleService = inject(BehaviorGroupRuleService);
  private readonly groupService = inject(BehaviorGroupService);
  private readonly sectorService = inject(AirportSectorService);
  private readonly airportService = inject(AirportService);
  private readonly catalog = inject(FeatureCatalogService);

  protected readonly groupId = this.route.snapshot.paramMap.get('groupId') ?? '';
  protected readonly rules = signal<BehaviorGroupRule[]>([]);
  protected readonly behaviorGroup = signal<BehaviorGroup | null>(null);
  protected readonly sectors = signal<AirportSector[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);

  protected readonly ruleTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroupRules.RuleTypeGroup),
  );
  protected readonly fields = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroupRules.FieldGroup),
  );
  protected readonly operators = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroupRules.OperatorGroup),
  );
  protected readonly flightStatuses = computed(() =>
    this.catalog.featuresOf(this.groups(), BehaviorGroupRules.FlightStatusGroup),
  );

  protected readonly search = signal('');
  protected readonly filteredRules = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.rules()
      .filter(
        (rule) =>
          !query ||
          [
            this.featureLabel(rule.rule_type_id),
            this.featureLabel(rule.field_id),
            rule.rule_value,
          ].some((value) => value?.toLocaleLowerCase().includes(query)),
      )
      .sort((a, b) => a.sort_order - b.sort_order || a.priority - b.priority);
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingRule = signal<BehaviorGroupRule | null>(null);
  protected readonly deleteTarget = signal<BehaviorGroupRule | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    rule_type_id: this.fb.control<number | null>(null, Validators.required),
    field_id: this.fb.control<number | null>(null),
    operator_id: this.fb.control<number | null>(null),
    rule_value: ['', [Validators.maxLength(1000)]],
    status_filter_ids: this.fb.nonNullable.control<number[]>([]),
    show_from_offset_min: this.fb.control<number | null>(null, [integer]),
    show_until_offset_min: this.fb.control<number | null>(null, [integer]),
    duration_seconds: this.fb.control<number | null>(null, [
      integer,
      Validators.min(1),
      Validators.max(32767),
    ]),
    priority: this.fb.control<number | null>(100, [
      Validators.required,
      integer,
      Validators.min(0),
      Validators.max(32767),
    ]),
    sort_order: this.fb.control<number | null>(0, [
      Validators.required,
      integer,
      Validators.min(0),
      Validators.max(32767),
    ]),
    airport_sector_id: this.fb.control<string | null>(null),
    is_active: [true],
  });

  protected readonly sectorOptions = computed(() => {
    const airportId = this.behaviorGroup()?.airport_id ?? null;
    const current = this.editingRule()?.airport_sector_id;
    return this.sectors().filter(
      (sector) =>
        (!airportId || sector.airport_id === airportId) &&
        (sector.is_active || sector.id === current),
    );
  });

  // Evita que el usuario cargue un valor sin sentido cuando el operador no lo necesita.
  private readonly formOperatorId = toSignal(this.form.controls.operator_id.valueChanges, {
    initialValue: this.form.controls.operator_id.value,
  });
  protected readonly operatorHint = computed(() => {
    const operator = this.operators().find((item) => item.id === this.formOperatorId());
    const code = (operator?.abbreviation ?? '').toLocaleUpperCase();
    if (code === 'IN' || code === 'NOT_IN') return 'Lista de valores separados por coma.';
    if (code === 'BETWEEN') return 'Dos valores separados por coma (mínimo, máximo).';
    return 'Valor contra el que se compara el campo.';
  });

  ngOnInit(): void {
    this.catalog
      .loadGroups([
        BehaviorGroupRules.RuleTypeGroup,
        BehaviorGroupRules.FieldGroup,
        BehaviorGroupRules.OperatorGroup,
        BehaviorGroupRules.FlightStatusGroup,
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
      rules: this.ruleService.getByBehaviorGroupId(this.groupId),
      group: this.groupService.getById(this.groupId),
      sectors: this.sectorService.getAll(),
      airports: this.airportService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ rules, group, sectors, airports }) => {
          this.rules.set(rules ?? []);
          this.behaviorGroup.set(group);
          this.sectors.set(sectors ?? []);
          this.airports.set(airports ?? []);
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

  protected statusFilterLabel(ids: number[] | null): string {
    if (!ids || ids.length === 0) return 'Todos';
    return ids.map((id) => this.featureLabel(id)).join(', ');
  }

  protected windowLabel(rule: BehaviorGroupRule): string {
    const from = rule.show_from_offset_min;
    const until = rule.show_until_offset_min;
    if (from === null && until === null) return '—';
    const parts: string[] = [];
    if (from !== null) parts.push(`desde ${from} min`);
    if (until !== null) parts.push(`hasta ${until} min`);
    return parts.join(' ');
  }

  protected sectorLabel(sector: AirportSector): string {
    const base = `${sector.code} · ${sector.name}`;
    if (this.behaviorGroup()?.airport_id) return base;
    const airport = this.airports().find((item) => item.id === sector.airport_id);
    const code = airport?.iata_code || airport?.oaci_code;
    return code ? `${base} (${code})` : base;
  }

  protected sectorLabelById(id: string | null): string {
    if (!id) return '—';
    const sector = this.sectors().find((item) => item.id === id);
    return sector ? this.sectorLabel(sector) : id;
  }

  protected goBack(): void {
    this.router.navigateByUrl('/behavior_groups');
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingRule.set(null);
    this.resetForm();
    const nextOrder = this.rules().reduce((max, rule) => Math.max(max, rule.sort_order), -1) + 1;
    this.form.controls.sort_order.setValue(nextOrder);
    this.mode.set('create');
  }

  protected startEdit(rule: BehaviorGroupRule): void {
    if (!rule.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(rule.id);
    this.editingRule.set(rule);
    this.form.reset({
      rule_type_id: rule.rule_type_id,
      field_id: rule.field_id,
      operator_id: rule.operator_id,
      rule_value: rule.rule_value ?? '',
      status_filter_ids: rule.status_filter_ids ?? [],
      show_from_offset_min: rule.show_from_offset_min,
      show_until_offset_min: rule.show_until_offset_min,
      duration_seconds: rule.duration_seconds,
      priority: rule.priority,
      sort_order: rule.sort_order,
      airport_sector_id: rule.airport_sector_id,
      is_active: rule.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.editingRule.set(null);
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
    if (
      raw.show_from_offset_min !== null &&
      raw.show_until_offset_min !== null &&
      raw.show_from_offset_min > raw.show_until_offset_min
    ) {
      this.errorMessage.set('El inicio de la ventana debe ser menor o igual que el fin.');
      return;
    }

    const isCreate = this.mode() === 'create';
    const payload: BehaviorGroupRule = {
      id: isCreate ? null : this.editingId(),
      behavior_group_id: this.groupId,
      rule_type_id: raw.rule_type_id as number,
      field_id: raw.field_id,
      operator_id: raw.operator_id,
      rule_value: raw.rule_value.trim() || null,
      status_filter_ids: raw.status_filter_ids.length > 0 ? raw.status_filter_ids : null,
      show_from_offset_min: raw.show_from_offset_min,
      show_until_offset_min: raw.show_until_offset_min,
      duration_seconds: raw.duration_seconds,
      priority: raw.priority as number,
      sort_order: raw.sort_order as number,
      airport_sector_id: raw.airport_sector_id,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    this.isSaving.set(true);
    const request$ = isCreate ? this.ruleService.add(payload) : this.ruleService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingRule.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Regla creada correctamente.' : 'Regla actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(rule: BehaviorGroupRule): void {
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
      rule_type_id: null,
      field_id: null,
      operator_id: null,
      rule_value: '',
      status_filter_ids: [],
      show_from_offset_min: null,
      show_until_offset_min: null,
      duration_seconds: null,
      priority: 100,
      sort_order: 0,
      airport_sector_id: null,
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
