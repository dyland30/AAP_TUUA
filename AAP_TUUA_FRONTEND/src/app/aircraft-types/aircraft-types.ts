import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { AircraftType, Feature, FeatureGroup } from '../models';
import { AircraftTypeService, FeatureService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

function positiveNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value: number | null = control.value;
  return value === null || value > 0 ? null : { positiveNumber: true };
}

function positiveIntegerValidator(control: AbstractControl): ValidationErrors | null {
  const value: number | null = control.value;
  return value === null || (Number.isInteger(value) && value > 0) ? null : { positiveInteger: true };
}

@Component({
  selector: 'app-aircraft-types',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './aircraft-types.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class AircraftTypes implements OnInit {
  private static readonly ManufacturerGroupNames = [
    'Fabricante - Aircraft',
    'Fabricantes - Aircraft',
    'Fabricante Aircraft',
  ];
  private static readonly SizeCodeGroupNames = [
    'Aircraft Size Codes',
    'Aircraft Size Code',
    'Códigos de Tamaño de Aeronave',
  ];

  private readonly fb = inject(FormBuilder);
  private readonly aircraftTypeService = inject(AircraftTypeService);
  private readonly featureService = inject(FeatureService);

  protected readonly aircraftTypes = signal<AircraftType[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly manufacturerFeatures = computed(() =>
    this.featuresOfGroup(AircraftTypes.ManufacturerGroupNames),
  );
  protected readonly sizeCodeFeatures = computed(() =>
    this.featuresOfGroup(AircraftTypes.SizeCodeGroupNames),
  );
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  protected readonly search = signal('');
  protected readonly filteredAircraftTypes = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.aircraftTypes().filter((aircraftType) =>
      !query ||
      [
        aircraftType.icao_code,
        aircraftType.iata_code,
        aircraftType.model,
        this.featureLabel(aircraftType.manufacturer_id),
        this.featureLabel(aircraftType.size_code_id),
      ].some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<AircraftType | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    icao_code: ['', [Validators.required, notBlank, Validators.maxLength(4)]],
    iata_code: ['', Validators.maxLength(3)],
    manufacturer_id: this.fb.control<number | null>(null, Validators.required),
    model: ['', [Validators.required, notBlank]],
    size_code_id: this.fb.control<number | null>(null, Validators.required),
    wingspan_m: this.fb.control<number | null>(null, positiveNumberValidator),
    length_m: this.fb.control<number | null>(null, positiveNumberValidator),
    max_seats: this.fb.control<number | null>(null, positiveIntegerValidator),
    is_widebody: [false],
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.aircraftTypeService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (aircraftTypes) => this.aircraftTypes.set(aircraftTypes ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): void {
    const relevantNames = [
      ...AircraftTypes.ManufacturerGroupNames,
      ...AircraftTypes.SizeCodeGroupNames,
    ];
    this.featureService
      .getAllFeatureGroups()
      .pipe(
        switchMap((groups) => {
          const relevant = (groups ?? []).filter((group) =>
            relevantNames.some((name) => AircraftTypes.sameName(group.name, name)),
          );
          if (relevant.length === 0) return of<FeatureGroup[]>([]);
          return forkJoin(
            relevant.map((group) =>
              this.featureService
                .getFeaturesByGroup(group.id)
                .pipe(map((features) => ({ ...group, features: features ?? [] }))),
            ),
          );
        }),
      )
      .subscribe({
        next: (groups) => this.groups.set(groups),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private featuresOfGroup(names: string[]): Feature[] {
    const group = this.groups().find((item) =>
      names.some((name) => AircraftTypes.sameName(item.name, name)),
    );
    return group?.features ?? [];
  }

  private static sameName(candidate: string | null, target: string): boolean {
    return (candidate ?? '').trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description || String(id);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    this.mode.set('create');
  }

  protected startEdit(aircraftType: AircraftType): void {
    if (!aircraftType.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(aircraftType.id);
    this.form.reset({
      icao_code: aircraftType.icao_code ?? '',
      iata_code: aircraftType.iata_code ?? '',
      manufacturer_id: aircraftType.manufacturer_id,
      model: aircraftType.model ?? '',
      size_code_id: aircraftType.size_code_id,
      wingspan_m: aircraftType.wingspan_m,
      length_m: aircraftType.length_m,
      max_seats: aircraftType.max_seats,
      is_widebody: aircraftType.is_widebody ?? false,
      is_active: aircraftType.is_active ?? true,
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
    const payload: AircraftType = {
      id: this.editingId(),
      icao_code: raw.icao_code.trim().toUpperCase(),
      iata_code: raw.iata_code.trim().toUpperCase() || null,
      manufacturer_id: raw.manufacturer_id,
      model: raw.model.trim(),
      size_code_id: raw.size_code_id,
      wingspan_m: raw.wingspan_m,
      length_m: raw.length_m,
      max_seats: raw.max_seats,
      is_widebody: raw.is_widebody,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.aircraftTypeService.add(payload)
      : this.aircraftTypeService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate
            ? 'Tipo de aeronave creado correctamente.'
            : 'Tipo de aeronave actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(aircraftType: AircraftType): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(aircraftType);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.aircraftTypeService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Tipo de aeronave desactivado correctamente.');
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
      icao_code: '',
      iata_code: '',
      manufacturer_id: null,
      model: '',
      size_code_id: null,
      wingspan_m: null,
      length_m: null,
      max_seats: null,
      is_widebody: false,
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
