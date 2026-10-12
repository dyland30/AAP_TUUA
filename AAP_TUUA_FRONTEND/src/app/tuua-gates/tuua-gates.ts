import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { Airport, Feature, FeatureGroup, Terminal, TuuaGate } from '../models';
import { AirportService, FeatureService, TerminalService, TuuaGateService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

@Component({
  selector: 'app-tuua-gates',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './tuua-gates.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class TuuaGates implements OnInit {
  private static readonly FlightTypeGroupName = 'Tipos de Vuelo';
  private static readonly GateTypeGroupName = 'Tipos Puertas TUUA';

  private readonly fb = inject(FormBuilder);
  private readonly tuuaGateService = inject(TuuaGateService);
  private readonly terminalService = inject(TerminalService);
  private readonly airportService = inject(AirportService);
  private readonly featureService = inject(FeatureService);

  protected readonly gates = signal<TuuaGate[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly filteredTerminals = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.terminals().filter((terminal) => terminal.airport_id === airportId) : [];
  });
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly flightTypeFeatures = computed(() => this.featuresOfGroup(TuuaGates.FlightTypeGroupName));
  protected readonly gateTypeFeatures = computed(() => this.featuresOfGroup(TuuaGates.GateTypeGroupName));
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  protected readonly search = signal('');
  protected readonly filteredGates = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.gates().filter((gate) =>
      !query || [gate.code, gate.ipaddr, gate.description, this.terminalLabel(gate.terminal_id),
        this.featureLabel(gate.flight_type_id), this.featureLabel(gate.tuua_gate_type_id)]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingCode = signal<string | null>(null);
  protected readonly deleteTarget = signal<TuuaGate | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    ipaddr: ['', Validators.maxLength(50)],
    description: ['', Validators.maxLength(200)],
    terminal_id: this.fb.control<string | null>(null, Validators.required),
    flight_type_id: this.fb.control<number | null>(null, Validators.required),
    tuua_gate_type_id: this.fb.control<number | null>(null, Validators.required),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      gates: this.tuuaGateService.getAll(),
      terminals: this.terminalService.getAll(),
      airports: this.airportService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ gates, terminals, airports }) => {
          this.gates.set(gates ?? []);
          this.terminals.set(terminals ?? []);
          this.airports.set(airports ?? []);
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
            [TuuaGates.FlightTypeGroupName, TuuaGates.GateTypeGroupName]
              .some((name) => TuuaGates.sameName(group.name, name)),
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

  private featuresOfGroup(name: string): Feature[] {
    const group = this.groups().find((item) => TuuaGates.sameName(item.name, name));
    return group?.features ?? [];
  }

  private static sameName(candidate: string | null, target: string): boolean {
    return (candidate ?? '').trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
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

  protected onAirportChange(airportId: string | null): void {
    this.selectedAirportId.set(airportId);
    const terminalId = this.form.controls.terminal_id.value;
    if (terminalId && !this.filteredTerminals().some((terminal) => terminal.id === terminalId)) {
      this.form.controls.terminal_id.setValue(null);
    }
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description || String(id);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingCode.set(null);
    this.selectedAirportId.set(null);
    this.form.reset({ ipaddr: '', description: '', terminal_id: null, flight_type_id: null, tuua_gate_type_id: null, is_active: true });
    this.mode.set('create');
  }

  protected startEdit(gate: TuuaGate): void {
    if (!gate.code || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingCode.set(gate.code);
    const terminal = this.terminals().find((item) => item.id === gate.terminal_id);
    this.selectedAirportId.set(terminal?.airport_id ?? null);
    this.form.reset({
      ipaddr: gate.ipaddr ?? '',
      description: gate.description ?? '',
      terminal_id: gate.terminal_id,
      flight_type_id: gate.flight_type_id,
      tuua_gate_type_id: gate.tuua_gate_type_id,
      is_active: gate.is_active,
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
    const payload: TuuaGate = {
      code: this.editingCode(),
      ipaddr: raw.ipaddr.trim() || null,
      description: raw.description.trim() || null,
      terminal_id: raw.terminal_id,
      flight_type_id: raw.flight_type_id,
      tuua_gate_type_id: raw.tuua_gate_type_id,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate ? this.tuuaGateService.add(payload) : this.tuuaGateService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingCode.set(null);
        this.form.reset();
        this.successMessage.set(isCreate ? 'Puerta TUUA creada correctamente.' : 'Puerta TUUA actualizada correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(gate: TuuaGate): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(gate);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.code || this.isSaving()) return;
    this.isSaving.set(true);
    this.tuuaGateService.delete(target.code).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Puerta TUUA desactivada correctamente.');
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
