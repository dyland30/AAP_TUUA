import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin } from 'rxjs';
import { Airport, Location } from '../models';
import { AirportService, LocationService } from '../services';
import { notBlank } from '../validators/not-blank.validator';
import { UbigeoSelector } from '../ubigeo-selector/ubigeo-selector';

@Component({
  selector: 'app-locations',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    UbigeoSelector,
  ],
  templateUrl: './locations.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class Locations implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly locationService = inject(LocationService);
  private readonly airportService = inject(AirportService);

  protected readonly locations = signal<Location[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly search = signal('');
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly filteredLocations = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    const airportId = this.selectedAirportId();
    return this.locations().filter((location) =>
      (!airportId || location.airport_id === airportId) &&
      [location.name, location.description, location.ubigeo, this.airportLabel(location.airport_id)]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<Location | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null, Validators.required),
    name: ['', [Validators.required, notBlank, Validators.maxLength(500)]],
    description: ['', Validators.maxLength(500)],
    ubigeo: ['', [Validators.required, notBlank, Validators.maxLength(10)]],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({ locations: this.locationService.getAll(), airports: this.airportService.getAll() })
      .pipe(finalize(() => this.isLoading.set(false))).subscribe({
        next: ({ locations, airports }) => {
          this.locations.set(locations ?? []);
          this.airports.set(airports ?? []);
          if (!this.airports().some((airport) => airport.id === this.selectedAirportId())) {
            this.selectedAirportId.set(null);
          }
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected airportLabel(id: string | null): string {
    if (!id) return 'Sin aeropuerto';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}${airport.is_active ? '' : ' · Inactivo'}`;
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.form.reset({ airport_id: this.selectedAirportId() });
    this.mode.set('create');
  }

  protected startEdit(location: Location): void {
    if (!location.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(location.id);
    this.form.reset({ airport_id: location.airport_id, name: location.name ?? '',
      description: location.description ?? '', ubigeo: location.ubigeo ?? '' });
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
    const payload: Location = { id: this.editingId(), airport_id: raw.airport_id,
      name: raw.name.trim() || null, description: raw.description.trim() || null, ubigeo: raw.ubigeo.trim() || null };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate ? this.locationService.add(payload) : this.locationService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.form.reset();
        this.successMessage.set(isCreate ? 'Sede creada correctamente.' : 'Sede actualizada correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(location: Location): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(location);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.locationService.delete(target.id).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Sede eliminada correctamente.');
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
