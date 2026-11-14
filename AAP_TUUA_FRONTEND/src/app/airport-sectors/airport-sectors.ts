import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Airport, AirportSector, Terminal } from '../models';
import { AirportSectorService, AirportService, TerminalService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-airport-sectors',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './airport-sectors.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class AirportSectors implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly sectorService = inject(AirportSectorService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);

  protected readonly sectors = signal<AirportSector[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly filteredSectors = computed(() => {
    const airportId = this.selectedAirportId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.sectors().filter(
      (sector) =>
        (!airportId || sector.airport_id === airportId) &&
        (!query ||
          [sector.code, sector.name, sector.level].some((value) =>
            value?.toLocaleLowerCase().includes(query),
          )),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<AirportSector | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null, Validators.required),
    terminal_id: this.fb.control<string | null>(null),
    parent_id: this.fb.control<string | null>(null),
    code: ['', [Validators.required, notBlank, Validators.maxLength(20)]],
    name: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
    level: ['', [Validators.maxLength(20)]],
    description: ['', [Validators.maxLength(500)]],
    is_active: [true],
  });

  private readonly formAirportId = toSignal(this.form.controls.airport_id.valueChanges, {
    initialValue: this.form.controls.airport_id.value,
  });
  protected readonly formTerminals = computed(() =>
    this.terminals().filter((terminal) => terminal.airport_id === this.formAirportId()),
  );
  protected readonly parentOptions = computed(() =>
    this.sectors().filter(
      (sector) =>
        sector.airport_id === this.formAirportId() &&
        sector.is_active &&
        sector.id !== this.editingId(),
    ),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      sectors: this.sectorService.getAll(),
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ sectors, airports, terminals }) => {
          this.sectors.set(sectors ?? []);
          this.airports.set(airports ?? []);
          this.terminals.set(terminals ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected airportLabel(id: string | null): string {
    if (!id) return '—';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected terminalLabel(id: string | null): string {
    if (!id) return '—';
    return this.terminals().find((item) => item.id === id)?.name || id;
  }

  protected sectorLabel(id: string | null): string {
    if (!id) return '—';
    const sector = this.sectors().find((item) => item.id === id);
    return sector ? `${sector.code} · ${sector.name}` : id;
  }

  protected viewEvacuationRoutes(sector: AirportSector): void {
    if (!sector.id) return;
    this.router.navigate(['/airport_sectors', sector.id, 'evacuation_routes']);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    this.form.controls.airport_id.setValue(this.selectedAirportId());
    this.mode.set('create');
  }

  protected startEdit(sector: AirportSector): void {
    if (!sector.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(sector.id);
    this.form.reset({
      airport_id: sector.airport_id,
      terminal_id: sector.terminal_id,
      parent_id: sector.parent_id,
      code: sector.code ?? '',
      name: sector.name ?? '',
      level: sector.level ?? '',
      description: sector.description ?? '',
      is_active: sector.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.resetForm();
  }

  protected onFormAirportChange(): void {
    // Terminal y sector padre dependen del aeropuerto elegido.
    this.form.patchValue({ terminal_id: null, parent_id: null });
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: AirportSector = {
      id: this.editingId(),
      airport_id: raw.airport_id as string,
      terminal_id: raw.terminal_id,
      parent_id: raw.parent_id,
      code: raw.code.trim(),
      name: raw.name.trim(),
      level: raw.level.trim() || null,
      description: raw.description.trim() || null,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.sectorService.add(payload)
      : this.sectorService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Sector creado correctamente.' : 'Sector actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(sector: AirportSector): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(sector);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.sectorService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Sector desactivado correctamente.');
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
      airport_id: null,
      terminal_id: null,
      parent_id: null,
      code: '',
      name: '',
      level: '',
      description: '',
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
