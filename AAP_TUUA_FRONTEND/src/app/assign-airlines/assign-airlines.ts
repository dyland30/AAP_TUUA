import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, concat, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Airline, LocalUser, LocalUserAirline } from '../models';
import { AirlineService, LocalUserAirlineService, LocalUserService } from '../services';

@Component({
  selector: 'app-assign-airlines',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './assign-airlines.html',
  styleUrl: '../assign-cashier-machines/assign-cashier-machines.css',
})
export class AssignAirlines implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly localUserService = inject(LocalUserService);
  private readonly airlineService = inject(AirlineService);
  private readonly localUserAirlineService = inject(LocalUserAirlineService);

  private readonly userId = this.route.snapshot.paramMap.get('userId');
  // Todas las filas existentes del usuario (activas e inactivas), por id de aerolínea.
  private existingRows = new Map<string, LocalUserAirline>();
  private originalIds = new Set<string>();

  protected readonly user = signal<LocalUser | null>(null);
  protected readonly airlines = signal<Airline[]>([]);
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly search = signal('');
  protected readonly filteredAirlines = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.airlines().filter(
      (airline) =>
        !query ||
        [airline.company_name, airline.short_name, airline.iata_code, airline.oaci_code].some(
          (value) => value?.toLocaleLowerCase().includes(query),
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
      airlines: this.airlineService.getAll(),
      assignments: this.localUserAirlineService.getByLocalUserId(this.userId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ user, airlines, assignments }) => {
          this.user.set(user);
          this.airlines.set((airlines ?? []).filter((airline) => airline.is_active));
          // La baja es lógica: una fila inactiva significa "no asignada".
          this.existingRows = new Map(
            (assignments ?? []).map((assignment) => [assignment.airline_id, assignment]),
          );
          const activeIds = new Set(
            (assignments ?? [])
              .filter((assignment) => assignment.is_active === true)
              .map((assignment) => assignment.airline_id),
          );
          this.selectedIds.set(activeIds);
          this.originalIds = new Set(activeIds);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected airlineLabel(airline: Airline): string {
    return airline.company_name || airline.short_name || airline.legal_name || airline.id || '—';
  }

  protected airlineCodes(airline: Airline): string {
    const codes = [
      airline.iata_code ? `IATA ${airline.iata_code}` : null,
      airline.oaci_code ? `OACI ${airline.oaci_code}` : null,
    ].filter((code): code is string => !!code);
    return codes.length > 0 ? codes.join(' · ') : '—';
  }

  protected isSelected(id: string | null): boolean {
    return id !== null && this.selectedIds().has(id);
  }

  protected toggle(airline: Airline): void {
    const id = airline.id;
    if (!id) return;

    this.clearMessages();
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  protected save(): void {
    if (!this.userId || this.isSaving()) return;

    this.clearMessages();
    const selected = this.selectedIds();
    const added = [...selected].filter((id) => !this.originalIds.has(id));
    const removed = [...this.originalIds].filter((id) => !selected.has(id));

    const requests: Observable<unknown>[] = [];
    for (const airlineId of removed) {
      requests.push(this.localUserAirlineService.delete(this.userId, airlineId));
    }
    for (const airlineId of added) {
      const existing = this.existingRows.get(airlineId);
      if (existing) {
        // Par ya existente (inactivo): un INSERT violaría la clave primaria, se reactiva.
        requests.push(this.localUserAirlineService.update({ ...existing, is_active: true }));
      } else {
        const assignment: LocalUserAirline = {
          local_user_id: this.userId,
          airline_id: airlineId,
          is_active: true,
          created_at: null,
          updated_at: null,
          created_by: null,
          modified_by: null,
        };
        requests.push(this.localUserAirlineService.add(assignment));
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
          this.successMessage.set('Aerolíneas asignadas correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveError(error));
          // Algunos cambios pudieron aplicarse: se recarga el estado real sin borrar el mensaje.
          this.reloadAssignments();
        },
      });
  }

  protected back(): void {
    this.router.navigate(['/users']);
  }

  private reloadAssignments(): void {
    if (!this.userId) return;
    this.localUserAirlineService.getByLocalUserId(this.userId).subscribe({
      next: (assignments) => {
        this.existingRows = new Map(
          (assignments ?? []).map((assignment) => [assignment.airline_id, assignment]),
        );
        const activeIds = new Set(
          (assignments ?? [])
            .filter((assignment) => assignment.is_active === true)
            .map((assignment) => assignment.airline_id),
        );
        this.originalIds = new Set(activeIds);
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
