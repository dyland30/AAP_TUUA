import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Airport, Location, Terminal } from '../models';
import { AirportService, LocationService, TerminalService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

@Component({
  selector: 'app-terminals',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './terminals.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class Terminals implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly terminalService = inject(TerminalService);
  private readonly locationService = inject(LocationService);
  private readonly airportService = inject(AirportService);

  protected readonly airportId = this.route.snapshot.paramMap.get('airportId') ?? '';
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly airport = signal<Airport | null>(null);
  protected readonly search = signal('');
  protected readonly filteredTerminals = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.terminals().filter((terminal) =>
      !query || [terminal.name, this.locationLabel(terminal.location_id)]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<Terminal | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, notBlank, Validators.maxLength(50)]],
    location_id: this.fb.control<string | null>(null),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      terminals: this.terminalService.getByAirportId(this.airportId),
      locations: this.locationService.getByAirportId(this.airportId),
      airports: this.airportService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ terminals, locations, airports }) => {
          this.terminals.set(terminals ?? []);
          this.locations.set(locations ?? []);
          this.airport.set((airports ?? []).find((item) => item.id === this.airportId) ?? null);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected airportLabel(): string {
    const airport = this.airport();
    if (!airport) return this.airportId;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || this.airportId}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected locationLabel(id: string | null): string {
    if (!id) return 'Sin sede';
    return this.locations().find((item) => item.id === id)?.name || id;
  }

  protected goBack(): void {
    this.router.navigateByUrl('/airports');
  }

  protected viewResources(terminal: Terminal): void {
    if (!terminal.id) return;
    this.router.navigate(['/airports', this.airportId, 'terminals', terminal.id, 'resources']);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.form.reset({ name: '', location_id: null, is_active: true });
    this.mode.set('create');
  }

  protected startEdit(terminal: Terminal): void {
    if (!terminal.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(terminal.id);
    this.form.reset({
      name: terminal.name ?? '',
      location_id: terminal.location_id,
      is_active: terminal.is_active,
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
    const payload: Terminal = {
      id: this.editingId(),
      airport_id: this.airportId,
      location_id: raw.location_id,
      name: raw.name.trim() || null,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate ? this.terminalService.add(payload) : this.terminalService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.form.reset();
        this.successMessage.set(isCreate ? 'Terminal creada correctamente.' : 'Terminal actualizada correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(terminal: Terminal): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(terminal);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.terminalService.delete(target.id).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Terminal desactivada correctamente.');
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
