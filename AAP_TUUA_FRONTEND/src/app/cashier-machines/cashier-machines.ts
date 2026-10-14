import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin } from 'rxjs';
import { Airport, CashierMachine, Location, Terminal } from '../models';
import { AirportService, CashierMachineService, LocationService, TerminalService } from '../services';

@Component({
  selector: 'app-cashier-machines',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './cashier-machines.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class CashierMachines implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cashierMachineService = inject(CashierMachineService);
  private readonly terminalService = inject(TerminalService);
  private readonly locationService = inject(LocationService);
  private readonly airportService = inject(AirportService);

  protected readonly machines = signal<CashierMachine[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly filteredTerminals = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.terminals().filter((terminal) => terminal.airport_id === airportId) : [];
  });
  protected readonly filteredLocations = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.locations().filter((location) => location.airport_id === airportId) : [];
  });
  protected readonly search = signal('');
  protected readonly filteredMachines = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.machines().filter((machine) =>
      !query || [machine.code, machine.ipaddr, machine.description, this.terminalLabel(machine.terminal_id),
        this.locationLabel(machine.location_id)]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingCode = signal<string | null>(null);
  protected readonly deleteTarget = signal<CashierMachine | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    ipaddr: ['', Validators.maxLength(50)],
    description: ['', Validators.maxLength(200)],
    terminal_id: this.fb.control<string | null>(null, Validators.required),
    location_id: this.fb.control<string | null>(null),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      machines: this.cashierMachineService.getAll(),
      terminals: this.terminalService.getAll(),
      locations: this.locationService.getAll(),
      airports: this.airportService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ machines, terminals, locations, airports }) => {
          this.machines.set(machines ?? []);
          this.terminals.set(terminals ?? []);
          this.locations.set(locations ?? []);
          this.airports.set(airports ?? []);
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
    const terminal = this.terminals().find((item) => item.id === id);
    if (!terminal) return id;
    return `${terminal.name || terminal.id} · ${this.airportLabel(terminal.airport_id)}`;
  }

  protected locationLabel(id: string | null): string {
    if (!id) return 'Sin sede';
    return this.locations().find((item) => item.id === id)?.name || id;
  }

  protected onAirportChange(airportId: string | null): void {
    this.selectedAirportId.set(airportId);
    const terminalId = this.form.controls.terminal_id.value;
    if (terminalId && !this.filteredTerminals().some((terminal) => terminal.id === terminalId)) {
      this.form.controls.terminal_id.setValue(null);
    }
    const locationId = this.form.controls.location_id.value;
    if (locationId && !this.filteredLocations().some((location) => location.id === locationId)) {
      this.form.controls.location_id.setValue(null);
    }
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingCode.set(null);
    this.selectedAirportId.set(null);
    this.form.reset({ ipaddr: '', description: '', terminal_id: null, location_id: null, is_active: true });
    this.mode.set('create');
  }

  protected startEdit(machine: CashierMachine): void {
    if (!machine.code || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingCode.set(machine.code);
    const terminal = this.terminals().find((item) => item.id === machine.terminal_id);
    this.selectedAirportId.set(terminal?.airport_id ?? null);
    this.form.reset({
      ipaddr: machine.ipaddr ?? '',
      description: machine.description ?? '',
      terminal_id: machine.terminal_id,
      location_id: machine.location_id,
      is_active: machine.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingCode.set(null);
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
    const payload: CashierMachine = {
      code: this.editingCode(),
      ipaddr: raw.ipaddr.trim() || null,
      description: raw.description.trim() || null,
      terminal_id: raw.terminal_id,
      location_id: raw.location_id,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.cashierMachineService.add(payload)
      : this.cashierMachineService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingCode.set(null);
        this.form.reset();
        this.successMessage.set(isCreate ? 'Caja registrada correctamente.' : 'Caja actualizada correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(machine: CashierMachine): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(machine);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.code || this.isSaving()) return;
    this.isSaving.set(true);
    this.cashierMachineService.delete(target.code).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Caja desactivada correctamente.');
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
