import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, concat, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Airport, CashierMachine, LocalUser, LocalUserCashierMachine, Terminal } from '../models';
import { AirportService } from '../services/airport.service';
import { CashierMachineService } from '../services/cashier-machine.service';
import { LocalUserCashierMachineService } from '../services/local-user-cashier-machine.service';
import { LocalUserService } from '../services/local-user.service';
import { TerminalService } from '../services/terminal.service';

@Component({
  selector: 'app-assign-cashier-machines',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './assign-cashier-machines.html',
  styleUrl: './assign-cashier-machines.css',
})
export class AssignCashierMachines implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly localUserService = inject(LocalUserService);
  private readonly cashierMachineService = inject(CashierMachineService);
  private readonly localUserCashierMachineService = inject(LocalUserCashierMachineService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);

  private readonly userId = this.route.snapshot.paramMap.get('userId');
  private originalCodes = new Set<string>();

  protected readonly user = signal<LocalUser | null>(null);
  protected readonly machines = signal<CashierMachine[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedTerminalId = signal<string | null>(null);
  protected readonly filteredTerminals = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.terminals().filter((terminal) => terminal.airport_id === airportId) : [];
  });
  protected readonly selectedCodes = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly search = signal('');
  protected readonly filteredMachines = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    const airportId = this.selectedAirportId();
    const terminalId = this.selectedTerminalId();
    return this.machines().filter((machine) => {
      if (airportId && this.airportIdOfMachine(machine) !== airportId) return false;
      if (terminalId && machine.terminal_id !== terminalId) return false;
      return (
        !query ||
        [machine.code, machine.description, machine.ipaddr].some((value) =>
          value?.toLocaleLowerCase().includes(query),
        )
      );
    });
  });
  protected readonly selectedCount = computed(() => this.selectedCodes().size);
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
      machines: this.cashierMachineService.getAll(),
      assignments: this.localUserCashierMachineService.getByLocalUserId(this.userId),
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ user, machines, assignments, airports, terminals }) => {
          this.user.set(user);
          this.machines.set(machines ?? []);
          this.airports.set(airports ?? []);
          this.terminals.set(terminals ?? []);
          const codes = new Set(
            (assignments ?? [])
              .map((assignment) => assignment.cashier_machine_code)
              .filter((code): code is string => !!code),
          );
          this.selectedCodes.set(codes);
          this.originalCodes = new Set(codes);
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

  protected onAirportChange(airportId: string | null): void {
    this.selectedAirportId.set(airportId);
    const terminalId = this.selectedTerminalId();
    if (terminalId && !this.filteredTerminals().some((terminal) => terminal.id === terminalId)) {
      this.selectedTerminalId.set(null);
    }
  }

  protected onTerminalChange(terminalId: string | null): void {
    this.selectedTerminalId.set(terminalId);
  }

  protected isSelected(code: string | null): boolean {
    return code !== null && this.selectedCodes().has(code);
  }

  protected toggle(machine: CashierMachine): void {
    const code = machine.code;
    if (!code) return;

    this.clearMessages();
    const next = new Set(this.selectedCodes());
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    this.selectedCodes.set(next);
  }

  protected save(): void {
    if (!this.userId || this.isSaving()) return;

    this.clearMessages();
    const selected = this.selectedCodes();
    const added = [...selected].filter((code) => !this.originalCodes.has(code));
    const removed = [...this.originalCodes].filter((code) => !selected.has(code));

    const requests: Observable<unknown>[] = [];
    for (const code of removed) {
      requests.push(this.localUserCashierMachineService.delete(this.userId, code));
    }
    for (const code of added) {
      const assignment: LocalUserCashierMachine = {
        local_user_id: this.userId,
        cashier_machine_code: code,
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      };
      requests.push(this.localUserCashierMachineService.add(assignment));
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
          this.successMessage.set('Cajas asignadas correctamente.');
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected back(): void {
    this.router.navigate(['/users']);
  }

  private airportIdOfMachine(machine: CashierMachine): string | null {
    if (!machine.terminal_id) return null;
    return this.terminals().find((terminal) => terminal.id === machine.terminal_id)?.airport_id ?? null;
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
