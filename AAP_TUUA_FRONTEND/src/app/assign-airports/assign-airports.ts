import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, concat, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Airport, LocalUser, LocalUserAirport } from '../models';
import { AirportService, LocalUserAirportService, LocalUserService } from '../services';

@Component({
  selector: 'app-assign-airports',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
  ],
  templateUrl: './assign-airports.html',
  styleUrl: '../assign-cashier-machines/assign-cashier-machines.css',
})
export class AssignAirports implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly localUserService = inject(LocalUserService);
  private readonly airportService = inject(AirportService);
  private readonly localUserAirportService = inject(LocalUserAirportService);

  private readonly userId = this.route.snapshot.paramMap.get('userId');
  // Todas las filas existentes del usuario (activas e inactivas), por id de aeropuerto.
  private existingRows = new Map<string, LocalUserAirport>();

  protected readonly user = signal<LocalUser | null>(null);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly defaultId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly filteredAirports = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.airports().filter(
      (airport) =>
        !query ||
        [airport.name, airport.city, airport.iata_code, airport.oaci_code].some((value) =>
          value?.toLocaleLowerCase().includes(query),
        ),
    );
  });
  protected readonly selectedCount = computed(() => this.selectedIds().size);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    if (!this.userId) {
      this.errorMessage.set('No se especificó un usuario.');
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    forkJoin({
      user: this.localUserService.getById(this.userId),
      airports: this.airportService.getAll(),
      assignments: this.localUserAirportService.getByLocalUserId(this.userId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ user, airports, assignments }) => {
          this.user.set(user);
          this.airports.set((airports ?? []).filter((airport) => airport.is_active));
          this.applyAssignments(assignments ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected airportLabel(airport: Airport): string {
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || airport.id || '—'}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected airportDetail(airport: Airport): string {
    const codes = [
      airport.iata_code ? `IATA ${airport.iata_code}` : null,
      airport.oaci_code ? `OACI ${airport.oaci_code}` : null,
      airport.city,
    ].filter((value): value is string => !!value);
    return codes.length > 0 ? codes.join(' · ') : '—';
  }

  protected isSelected(id: string | null): boolean {
    return id !== null && this.selectedIds().has(id);
  }

  protected toggle(airport: Airport): void {
    const id = airport.id;
    if (!id) return;

    this.clearMessages();
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
      if (this.defaultId() === id) {
        // Si se desmarca el predeterminado, pasa a otro aeropuerto seleccionado.
        this.defaultId.set([...next][0] ?? null);
      }
    } else {
      next.add(id);
      if (!this.defaultId()) this.defaultId.set(id);
    }
    this.selectedIds.set(next);
  }

  protected setDefault(id: string | null): void {
    if (!id || !this.selectedIds().has(id)) return;
    this.clearMessages();
    this.defaultId.set(id);
  }

  protected save(): void {
    if (!this.userId || this.isSaving()) return;

    this.clearMessages();
    const selected = this.selectedIds();
    // Siempre exactamente un predeterminado cuando hay aeropuertos seleccionados.
    let defaultId = this.defaultId();
    if (selected.size === 0) {
      defaultId = null;
    } else if (!defaultId || !selected.has(defaultId)) {
      defaultId = [...selected][0];
    }

    const originalActive = [...this.existingRows.values()].filter((row) => row.is_active === true);
    const originalIds = new Set(originalActive.map((row) => row.airport_id));
    const added = [...selected].filter((id) => !originalIds.has(id));
    const removed = originalActive.filter((row) => !selected.has(row.airport_id));
    const kept = originalActive.filter((row) => selected.has(row.airport_id));

    const requests: Observable<unknown>[] = [];

    for (const row of removed) {
      if (row.is_default) {
        // La baja lógica conservaría is_default = true: se limpia junto con is_active.
        requests.push(
          this.localUserAirportService.update({ ...row, is_default: false, is_active: false }),
        );
      } else {
        requests.push(this.localUserAirportService.delete(this.userId, row.airport_id));
      }
    }

    // Primero se retira la marca de predeterminado y después se asigna la nueva.
    const keptChanges = kept
      .filter((row) => row.is_default !== (row.airport_id === defaultId))
      .sort((a, b) => Number(a.airport_id === defaultId) - Number(b.airport_id === defaultId));
    for (const row of keptChanges) {
      requests.push(
        this.localUserAirportService.update({ ...row, is_default: row.airport_id === defaultId }),
      );
    }

    for (const airportId of added) {
      const isDefault = airportId === defaultId;
      const existing = this.existingRows.get(airportId);
      if (existing) {
        // Par ya existente (inactivo): un INSERT violaría la clave primaria, se reactiva.
        requests.push(
          this.localUserAirportService.update({
            ...existing,
            is_active: true,
            is_default: isDefault,
          }),
        );
      } else {
        const assignment: LocalUserAirport = {
          local_user_id: this.userId,
          airport_id: airportId,
          is_default: isDefault,
          is_active: true,
          created_at: null,
          updated_at: null,
          created_by: null,
          modified_by: null,
        };
        requests.push(this.localUserAirportService.add(assignment));
      }
    }

    if (requests.length === 0) {
      this.successMessage.set('No hay cambios por guardar.');
      return;
    }

    this.isSaving.set(true);
    concat(...requests)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        complete: () => {
          this.load();
          this.successMessage.set('Aeropuertos asignados correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveError(error));
          // Algunos cambios pudieron aplicarse: se actualizan las filas reales sin tocar la selección.
          this.reloadRows();
        },
      });
  }

  protected back(): void {
    this.router.navigate(['/users']);
  }

  private applyAssignments(assignments: LocalUserAirport[]): void {
    // La baja es lógica: una fila inactiva significa "no asignada".
    this.existingRows = new Map(assignments.map((row) => [row.airport_id, row]));
    const active = assignments.filter((row) => row.is_active === true);
    this.selectedIds.set(new Set(active.map((row) => row.airport_id)));
    // Predeterminado: el marcado en servidor o, si no hay, el primero asignado.
    this.defaultId.set((active.find((row) => row.is_default) ?? active[0])?.airport_id ?? null);
  }

  private reloadRows(): void {
    if (!this.userId) return;
    this.localUserAirportService.getByLocalUserId(this.userId).subscribe({
      next: (assignments) => {
        this.existingRows = new Map((assignments ?? []).map((row) => [row.airport_id, row]));
      },
    });
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
