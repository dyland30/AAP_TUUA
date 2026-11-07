import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin } from 'rxjs';
import {
  Airport,
  LocalUser,
  Terminal,
  TuuaGate,
  TuuaGateUnlockKeyUsageFilter,
  TuuaGateUnlockKeyUsageReportItem,
} from '../models';
import { AirportService } from '../services/airport.service';
import { LocalUserService } from '../services/local-user.service';
import { TerminalService } from '../services/terminal.service';
import { TuuaGateUnlockKeyUsageHistoryService } from '../services/tuua-gate-unlock-key-usage-history.service';
import { TuuaGateService } from '../services/tuua-gate.service';

const MaxRangeDays = 92;

@Component({
  selector: 'app-gate-unlock-key-usage-report',
  imports: [
    DatePipe,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
  ],
  templateUrl: './gate-unlock-key-usage-report.html',
  styleUrls: ['../catalogs/catalog-crud.css', './gate-unlock-key-usage-report.css'],
})
export class GateUnlockKeyUsageReport implements OnInit {
  private readonly usageService = inject(TuuaGateUnlockKeyUsageHistoryService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);
  private readonly tuuaGateService = inject(TuuaGateService);
  private readonly localUserService = inject(LocalUserService);

  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly gates = signal<TuuaGate[]>([]);
  protected readonly users = signal<LocalUser[]>([]);
  protected readonly results = signal<TuuaGateUnlockKeyUsageReportItem[]>([]);
  protected readonly total = signal(0);
  protected readonly searched = signal(false);

  protected readonly dateFrom = signal<Date | null>(new Date());
  protected readonly dateTo = signal<Date | null>(new Date());
  protected readonly airportFilter = signal<string | null>(null);
  protected readonly terminalFilter = signal<string | null>(null);
  protected readonly gateFilter = signal<string | null>(null);
  protected readonly userFilter = signal<string | null>(null);

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly pageSizeOptions = [10, 20, 50, 100];

  protected readonly isLoading = signal(false);
  protected readonly isSearching = signal(false);
  protected readonly isExporting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly maxDate = new Date();

  protected readonly terminalOptions = computed(() => {
    const airportId = this.airportFilter();
    return this.terminals().filter((terminal) => !airportId || terminal.airport_id === airportId);
  });
  protected readonly gateOptions = computed(() => {
    const airportId = this.airportFilter();
    const terminalId = this.terminalFilter();
    const terminalIds = new Set(this.terminalOptions().map((terminal) => terminal.id));
    return this.gates().filter((gate) => {
      if (terminalId) return gate.terminal_id === terminalId;
      if (airportId) return gate.terminal_id !== null && terminalIds.has(gate.terminal_id);
      return true;
    });
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    forkJoin({
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
      gates: this.tuuaGateService.getAll(),
      users: this.localUserService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ airports, terminals, gates, users }) => {
          this.airports.set((airports ?? []).filter((airport) => airport.is_active));
          this.terminals.set((terminals ?? []).filter((terminal) => terminal.is_active));
          this.gates.set(gates ?? []);
          this.users.set(users ?? []);
          this.search();
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected onAirportChange(airportId: string | null): void {
    this.airportFilter.set(airportId);
    const terminalId = this.terminalFilter();
    if (terminalId && !this.terminalOptions().some((terminal) => terminal.id === terminalId)) {
      this.terminalFilter.set(null);
    }
    this.dropGateIfOutOfScope();
  }

  protected onTerminalChange(terminalId: string | null): void {
    this.terminalFilter.set(terminalId);
    this.dropGateIfOutOfScope();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.pageIndex.set(0);
    this.search();
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.search();
  }

  protected search(): void {
    if (this.isSearching()) return;
    const filter = this.buildFilter();
    if (!filter) return;

    this.isSearching.set(true);
    this.usageService
      .search(filter)
      .pipe(finalize(() => this.isSearching.set(false)))
      .subscribe({
        next: (result) => {
          this.results.set(result?.items ?? []);
          this.total.set(result?.total ?? 0);
          this.searched.set(true);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected exportExcel(): void {
    if (this.isExporting()) return;
    const filter = this.buildFilter();
    if (!filter) return;

    this.isExporting.set(true);
    this.usageService
      .exportExcel(filter)
      .pipe(finalize(() => this.isExporting.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `uso-llaves-destrabe-${filter.date_from}-${filter.date_to}.xlsx`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: (error: unknown) => this.resolveBlobError(error),
      });
  }

  protected clearFilters(): void {
    this.dateFrom.set(new Date());
    this.dateTo.set(new Date());
    this.airportFilter.set(null);
    this.terminalFilter.set(null);
    this.gateFilter.set(null);
    this.userFilter.set(null);
    this.pageIndex.set(0);
    this.search();
  }

  protected placeLabel(item: TuuaGateUnlockKeyUsageReportItem): string {
    return item.airport_iata_code || item.airport_name || '—';
  }

  private dropGateIfOutOfScope(): void {
    const code = this.gateFilter();
    if (code && !this.gateOptions().some((gate) => gate.code === code)) {
      this.gateFilter.set(null);
    }
  }

  // Valida los filtros y arma la consulta; devuelve null (y muestra el error) si algo es inválido.
  private buildFilter(): TuuaGateUnlockKeyUsageFilter | null {
    const from = this.dateFrom();
    const to = this.dateTo();
    this.errorMessage.set(null);
    if (!from || !to) {
      this.errorMessage.set('Indica el rango de fechas (desde y hasta).');
      return null;
    }
    if (from > to) {
      this.errorMessage.set('La fecha inicial no puede ser mayor a la fecha final.');
      return null;
    }
    if ((to.getTime() - from.getTime()) / 86_400_000 > MaxRangeDays) {
      this.errorMessage.set(`El rango de fechas no puede superar ${MaxRangeDays} días.`);
      return null;
    }
    return {
      date_from: GateUnlockKeyUsageReport.toDateKey(from),
      date_to: GateUnlockKeyUsageReport.toDateKey(to),
      airport_id: this.airportFilter(),
      terminal_id: this.terminalFilter(),
      tuua_gate_code: this.gateFilter(),
      user_id: this.userFilter(),
      page: this.pageIndex() + 1,
      page_size: this.pageSize(),
    };
  }

  // Fecha local sin zona horaria (yyyy-MM-dd): el backend filtra por día calendario.
  private static toDateKey(value: Date): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  // Con responseType blob el mensaje de error del servidor llega como Blob de texto.
  private resolveBlobError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
      error.error.text().then((text) =>
        this.errorMessage.set(text.trim() || 'No se pudo generar el archivo de Excel.'),
      );
      return;
    }
    this.errorMessage.set(this.resolveError(error));
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) return error.error;
      if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
