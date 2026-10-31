import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin } from 'rxjs';
import { Aircraft, AircraftType, Airline } from '../models';
import { AircraftService, AircraftTypeService, AirlineService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

function positiveIntegerValidator(control: AbstractControl): ValidationErrors | null {
  const value: number | null = control.value;
  return value === null || (Number.isInteger(value) && value > 0) ? null : { positiveInteger: true };
}

@Component({
  selector: 'app-aircrafts',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './aircrafts.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class Aircrafts implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly aircraftService = inject(AircraftService);
  private readonly aircraftTypeService = inject(AircraftTypeService);
  private readonly airlineService = inject(AirlineService);

  protected readonly aircrafts = signal<Aircraft[]>([]);
  protected readonly aircraftTypes = signal<AircraftType[]>([]);
  protected readonly airlines = signal<Airline[]>([]);
  private readonly aircraftTypeIndex = computed(() => {
    const index = new Map<string, AircraftType>();
    for (const aircraftType of this.aircraftTypes()) {
      if (aircraftType.id) index.set(aircraftType.id, aircraftType);
    }
    return index;
  });
  private readonly airlineIndex = computed(() => {
    const index = new Map<string, Airline>();
    for (const airline of this.airlines()) {
      if (airline.id) index.set(airline.id, airline);
    }
    return index;
  });
  protected readonly search = signal('');
  protected readonly filteredAircrafts = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.aircrafts().filter((aircraft) =>
      !query ||
      [aircraft.registration, this.aircraftTypeLabel(aircraft.aircraft_type_id), this.airlineLabel(aircraft.operator_id)]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<Aircraft | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    registration: ['', [Validators.required, notBlank, Validators.maxLength(20)]],
    aircraft_type_id: this.fb.control<string | null>(null, Validators.required),
    operator_id: this.fb.control<string | null>(null),
    seat_count: this.fb.control<number | null>(null, positiveIntegerValidator),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.aircraftService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (aircrafts) => this.aircrafts.set(aircrafts ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): void {
    forkJoin({
      aircraftTypes: this.aircraftTypeService.getAll(),
      airlines: this.airlineService.getAll(),
    }).subscribe({
      next: ({ aircraftTypes, airlines }) => {
        this.aircraftTypes.set(aircraftTypes ?? []);
        this.airlines.set(airlines ?? []);
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected aircraftTypeLabel(id: string | null): string {
    if (!id) return '—';
    const aircraftType = this.aircraftTypeIndex().get(id);
    if (!aircraftType) return id;
    return `${aircraftType.icao_code || '—'} - ${aircraftType.model || '—'}`;
  }

  protected airlineLabel(id: string | null): string {
    if (!id) return '—';
    return this.airlineIndex().get(id)?.company_name || id;
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    this.mode.set('create');
  }

  protected startEdit(aircraft: Aircraft): void {
    if (!aircraft.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(aircraft.id);
    this.form.reset({
      registration: aircraft.registration ?? '',
      aircraft_type_id: aircraft.aircraft_type_id,
      operator_id: aircraft.operator_id,
      seat_count: aircraft.seat_count,
      is_active: aircraft.is_active ?? true,
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
    const payload: Aircraft = {
      id: this.editingId(),
      registration: raw.registration.trim().toUpperCase(),
      aircraft_type_id: raw.aircraft_type_id,
      operator_id: raw.operator_id,
      seat_count: raw.seat_count,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate ? this.aircraftService.add(payload) : this.aircraftService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Aeronave creada correctamente.' : 'Aeronave actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(aircraft: Aircraft): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(aircraft);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.aircraftService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Aeronave desactivada correctamente.');
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
      registration: '',
      aircraft_type_id: null,
      operator_id: null,
      seat_count: null,
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
