import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { Airport, Feature, FeatureGroup, Runway } from '../models';
import { AirportService, FeatureService, RunwayService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

function positiveIntegerValidator(control: AbstractControl): ValidationErrors | null {
  const value: number | null = control.value;
  return value === null || (Number.isInteger(value) && value > 0) ? null : { positiveInteger: true };
}

@Component({
  selector: 'app-runways',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './runways.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class Runways implements OnInit {
  private static readonly StatusGroupNames = ['Estado de Recursos', 'Estados de Recursos'];

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly runwayService = inject(RunwayService);
  private readonly airportService = inject(AirportService);
  private readonly featureService = inject(FeatureService);

  protected readonly airportId = this.route.snapshot.paramMap.get('airportId') ?? '';
  protected readonly runways = signal<Runway[]>([]);
  protected readonly airport = signal<Airport | null>(null);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly statusFeatures = computed(() =>
    this.groups()
      .filter((group) => Runways.StatusGroupNames.some((name) => Runways.sameName(group.name, name)))
      .flatMap((group) => group.features ?? []),
  );
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  protected readonly search = signal('');
  protected readonly filteredRunways = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.runways().filter((runway) =>
      !query ||
      [runway.designator, runway.surface, this.featureLabel(runway.status_id)]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<Runway | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    designator: ['', [Validators.required, notBlank, Validators.maxLength(10)]],
    length_m: this.fb.control<number | null>(null, positiveIntegerValidator),
    width_m: this.fb.control<number | null>(null, positiveIntegerValidator),
    surface: ['', Validators.maxLength(100)],
    status_id: this.fb.control<number | null>(null, Validators.required),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      runways: this.runwayService.getByAirportId(this.airportId),
      airports: this.airportService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ runways, airports }) => {
          this.runways.set(runways ?? []);
          this.airport.set((airports ?? []).find((item) => item.id === this.airportId) ?? null);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): void {
    this.featureService
      .getAllFeatureGroups()
      .pipe(
        switchMap((groups) => {
          const relevant = (groups ?? []).filter((group) =>
            Runways.StatusGroupNames.some((name) => Runways.sameName(group.name, name)),
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

  private static sameName(candidate: string | null, target: string): boolean {
    return (candidate ?? '').trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
  }

  protected airportLabel(): string {
    const airport = this.airport();
    if (!airport) return this.airportId;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || this.airportId}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description || String(id);
  }

  protected goBack(): void {
    this.router.navigateByUrl('/airports');
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.form.reset({
      designator: '',
      length_m: null,
      width_m: null,
      surface: '',
      status_id: null,
      is_active: true,
    });
    this.mode.set('create');
  }

  protected startEdit(runway: Runway): void {
    if (!runway.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(runway.id);
    this.form.reset({
      designator: runway.designator ?? '',
      length_m: runway.length_m,
      width_m: runway.width_m,
      surface: runway.surface ?? '',
      status_id: runway.status_id,
      is_active: runway.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.form.reset();
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: Runway = {
      id: this.editingId(),
      airport_id: this.airportId,
      designator: raw.designator.trim(),
      length_m: raw.length_m,
      width_m: raw.width_m,
      surface: raw.surface.trim() || null,
      status_id: raw.status_id,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate ? this.runwayService.add(payload) : this.runwayService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.form.reset();
        this.successMessage.set(isCreate ? 'Pista creada correctamente.' : 'Pista actualizada correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(runway: Runway): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(runway);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.runwayService.delete(target.id).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Pista desactivada correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.deleteTarget.set(null);
        this.errorMessage.set(this.resolveError(error));
      },
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
