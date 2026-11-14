import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AirportSector, EvacuationRoute } from '../models';
import { AirportSectorService, EvacuationRouteService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-evacuation-routes',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './evacuation-routes.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class EvacuationRoutes implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routeService = inject(EvacuationRouteService);
  private readonly sectorService = inject(AirportSectorService);

  protected readonly sectorId = this.route.snapshot.paramMap.get('sectorId') ?? '';
  protected readonly routes = signal<EvacuationRoute[]>([]);
  protected readonly sector = signal<AirportSector | null>(null);
  protected readonly search = signal('');
  protected readonly filteredRoutes = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.routes().filter(
      (item) =>
        !query ||
        [item.code, item.name_es, item.name_en, item.exit_name].some((value) =>
          value?.toLocaleLowerCase().includes(query),
        ),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<EvacuationRoute | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, notBlank, Validators.maxLength(20)]],
    name_es: ['', [Validators.required, notBlank, Validators.maxLength(200)]],
    name_en: ['', [Validators.maxLength(200)]],
    direction_icon: ['', [Validators.maxLength(50)]],
    exit_name: ['', [Validators.maxLength(100)]],
    is_default: [false],
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      routes: this.routeService.getByAirportSectorId(this.sectorId),
      sector: this.sectorService.getById(this.sectorId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ routes, sector }) => {
          this.routes.set(routes ?? []);
          this.sector.set(sector);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected sectorLabel(): string {
    const sector = this.sector();
    return sector ? `${sector.code} · ${sector.name}` : this.sectorId;
  }

  protected goBack(): void {
    this.router.navigateByUrl('/airport_sectors');
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    this.mode.set('create');
  }

  protected startEdit(item: EvacuationRoute): void {
    if (!item.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(item.id);
    this.form.reset({
      code: item.code ?? '',
      name_es: item.name_es ?? '',
      name_en: item.name_en ?? '',
      direction_icon: item.direction_icon ?? '',
      exit_name: item.exit_name ?? '',
      is_default: item.is_default,
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
    const payload: EvacuationRoute = {
      id: this.editingId(),
      airport_sector_id: this.sectorId,
      code: raw.code.trim(),
      name_es: raw.name_es.trim(),
      name_en: raw.name_en.trim() || null,
      direction_icon: raw.direction_icon.trim() || null,
      exit_name: raw.exit_name.trim() || null,
      is_default: raw.is_default,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate ? this.routeService.add(payload) : this.routeService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Ruta creada correctamente.' : 'Ruta actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(item: EvacuationRoute): void {
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
    this.routeService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Ruta desactivada correctamente.');
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
      code: '',
      name_es: '',
      name_en: '',
      direction_icon: '',
      exit_name: '',
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
