import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { finalize } from 'rxjs';
import { Airport } from '../models';
import { AirportService } from '../services/airport.service';
import { notBlank } from '../validators/not-blank.validator';
import { UbigeoSelector } from '../ubigeo-selector/ubigeo-selector';

function coordinateValidator(control: AbstractControl): ValidationErrors | null {
  const value: number | null = control.value;
  if (value === null) return null;
  if (!Number.isFinite(value) || Math.abs(value) > 9999.999999) return { coordinate: true };
  const scaled = value * 1_000_000;
  return Math.abs(scaled - Math.round(scaled)) > 0.00001 ? { coordinate: true } : null;
}

function integerValidator(control: AbstractControl): ValidationErrors | null {
  const value: number | null = control.value;
  return value === null || (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647)
    ? null : { integer: true };
}

@Component({
  selector: 'app-airports',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    UbigeoSelector,
  ],
  templateUrl: './airports.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class Airports implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly airportService = inject(AirportService);

  protected readonly airports = signal<Airport[]>([]);
  protected readonly search = signal('');
  protected readonly filteredAirports = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.airports().filter((airport) =>
      !query || [airport.name, airport.iata_code, airport.oaci_code, airport.city, airport.region]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<Airport | null>(null);

  protected readonly textFields = [
    { key: 'name', label: 'Nombre', maxLength: 500, requiredMessage: 'El nombre es obligatorio.' },
    { key: 'iata_code', label: 'Código IATA', maxLength: 5, requiredMessage: null },
    { key: 'oaci_code', label: 'Código OACI', maxLength: 5, requiredMessage: null },
    { key: 'city', label: 'Ciudad', maxLength: 200, requiredMessage: 'La ciudad es obligatoria.' },
    { key: 'region', label: 'Región', maxLength: 200, requiredMessage: 'La región es obligatoria.' },
    { key: 'country_code', label: 'Código de país', maxLength: 5, requiredMessage: 'El código de país es obligatorio.' },
    { key: 'timezone', label: 'Zona horaria', maxLength: 100, requiredMessage: null },
    { key: 'airport_type', label: 'Tipo de aeropuerto', maxLength: 100, requiredMessage: null },
  ] as const;
  protected readonly numericFields = [
    { key: 'latitude', label: 'Latitud', step: '0.000001' },
    { key: 'longitude', label: 'Longitud', step: '0.000001' },
    { key: 'elevation_m', label: 'Elevación (metros)', step: '1' },
    { key: 'elevation_f', label: 'Elevación (pies)', step: '1' },
  ] as const;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, notBlank, Validators.maxLength(500)]],
    iata_code: ['', Validators.maxLength(5)],
    oaci_code: ['', Validators.maxLength(5)],
    city: ['', [Validators.required, notBlank, Validators.maxLength(200)]],
    region: ['', [Validators.required, notBlank, Validators.maxLength(200)]],
    country_code: ['', [Validators.required, notBlank, Validators.maxLength(5)]],
    ubigeo: ['', Validators.maxLength(10)],
    timezone: ['', Validators.maxLength(100)],
    airport_type: ['', Validators.maxLength(100)],
    latitude: this.fb.control<number | null>(null, coordinateValidator),
    longitude: this.fb.control<number | null>(null, coordinateValidator),
    elevation_m: this.fb.control<number | null>(null, integerValidator),
    elevation_f: this.fb.control<number | null>(null, integerValidator),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.airportService.getAll().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (airports) => this.airports.set(airports ?? []),
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.form.reset();
    this.mode.set('create');
  }

  protected startEdit(airport: Airport): void {
    if (!airport.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(airport.id);
    this.form.reset({
      name: airport.name ?? '', iata_code: airport.iata_code ?? '', oaci_code: airport.oaci_code ?? '',
      city: airport.city ?? '', region: airport.region ?? '', country_code: airport.country_code ?? '',
      ubigeo: airport.ubigeo ?? '', timezone: airport.timezone ?? '', airport_type: airport.airport_type ?? '',
      latitude: airport.latitude, longitude: airport.longitude,
      elevation_m: airport.elevation_m, elevation_f: airport.elevation_f, is_active: airport.is_active,
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
    const payload: Airport = {
      ...raw, id: this.editingId(), name: raw.name.trim() || null,
      iata_code: raw.iata_code.trim() || null, oaci_code: raw.oaci_code.trim() || null,
      city: raw.city.trim() || null, region: raw.region.trim() || null,
      country_code: raw.country_code.trim() || null, ubigeo: raw.ubigeo.trim() || null,
      timezone: raw.timezone.trim() || null, airport_type: raw.airport_type.trim() || null,
      created_at: null, updated_at: null, created_by: null, modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate ? this.airportService.add(payload) : this.airportService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.form.reset();
        this.successMessage.set(isCreate ? 'Aeropuerto creado correctamente.' : 'Aeropuerto actualizado correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(airport: Airport): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(airport);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.airportService.delete(target.id).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Aeropuerto desactivado correctamente.');
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
