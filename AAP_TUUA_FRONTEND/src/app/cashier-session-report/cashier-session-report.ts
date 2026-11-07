import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, forkJoin } from 'rxjs';
import {
  Airport,
  CashierSessionReportAmounts,
  CashierSessionReportFilter,
  CashierSessionReportItem,
  CashierSessionReportResult,
  CashierSessionReportTickets,
  Feature,
  Terminal,
} from '../models';
import { AirportService } from '../services/airport.service';
import { CashierSessionReportService } from '../services/cashier-session-report.service';
import { TerminalService } from '../services/terminal.service';

const MaxRangeDays = 92;

type AmountField = 'sales_amount' | 'income_amount' | 'expense_amount' | 'balance_amount' | 'difference_amount';

interface CurrencyAmount {
  currencyId: number;
  value: number;
}

@Component({
  selector: 'app-cashier-session-report',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './cashier-session-report.html',
  styleUrls: ['../catalogs/catalog-crud.css', './cashier-session-report.css'],
})
export class CashierSessionReport implements OnInit {
  private readonly reportService = inject(CashierSessionReportService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);

  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly report = signal<CashierSessionReportResult | null>(null);
  // Filtros con los que se generó el reporte mostrado, para el encabezado y la exportación.
  private readonly appliedFilter = signal<CashierSessionReportFilter | null>(null);

  protected readonly dateFrom = signal<Date | null>(new Date());
  protected readonly dateTo = signal<Date | null>(new Date());
  protected readonly airportFilter = signal<string | null>(null);
  protected readonly terminalFilter = signal<string | null>(null);

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
  protected readonly items = computed(() => this.report()?.result.items ?? []);
  protected readonly total = computed(() => this.report()?.result.total ?? 0);
  protected readonly currencies = computed(() => this.report()?.currencies ?? []);
  protected readonly flightTypes = computed(() => this.report()?.flight_types ?? []);
  protected readonly reportTitle = computed(() => {
    const filter = this.appliedFilter();
    if (!filter) return '';
    const from = CashierSessionReport.formatDateKey(filter.date_from);
    const to = CashierSessionReport.formatDateKey(filter.date_to);
    return from === to ? `Apertura del ${from}` : `Apertura del ${from} al ${to}`;
  });
  protected readonly reportScope = computed(() => {
    const filter = this.appliedFilter();
    if (!filter) return '';
    const airport = this.airports().find((item) => item.id === filter.airport_id);
    const terminal = this.terminals().find((item) => item.id === filter.terminal_id);
    const parts = [airport ? this.airportLabel(airport) : 'Todos los aeropuertos'];
    if (terminal) parts.push(terminal.name ?? '');
    return parts.join(' · ');
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    forkJoin({
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ airports, terminals }) => {
          this.airports.set((airports ?? []).filter((airport) => airport.is_active));
          this.terminals.set((terminals ?? []).filter((terminal) => terminal.is_active));
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
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.pageIndex.set(0);
    this.search();
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    // La paginación conserva los filtros del reporte mostrado, aunque se hayan editado sin buscar.
    const applied = this.appliedFilter();
    this.search(applied ? { ...applied, page: event.pageIndex + 1, page_size: event.pageSize } : null);
  }

  protected search(override: CashierSessionReportFilter | null = null): void {
    if (this.isSearching()) return;
    const filter = override ?? this.buildFilter();
    if (!filter) return;

    this.isSearching.set(true);
    this.reportService
      .search(filter)
      .pipe(finalize(() => this.isSearching.set(false)))
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.appliedFilter.set(filter);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected exportExcel(): void {
    if (this.isExporting()) return;
    const filter = this.buildFilter();
    if (!filter) return;

    this.isExporting.set(true);
    this.reportService
      .exportExcel(filter)
      .pipe(finalize(() => this.isExporting.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte-turnos-${filter.date_from}-${filter.date_to}.xlsx`;
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
    this.pageIndex.set(0);
    this.search();
  }

  protected airportLabel(airport: Airport): string {
    return airport.iata_code ? `${airport.iata_code} · ${airport.name ?? ''}` : (airport.name ?? '');
  }

  protected placeLabel(item: CashierSessionReportItem): string {
    return item.airport_iata_code || item.airport_name || '—';
  }

  protected ticketsOf(tickets: CashierSessionReportTickets[], flightTypeId: number): number {
    return tickets
      .filter((item) => item.flight_type_id === flightTypeId)
      .reduce((sum, item) => sum + item.tickets_count, 0);
  }

  // Montos de un campo por moneda, en el orden de las columnas; omite las monedas sin valor.
  protected amountsOf(amounts: CashierSessionReportAmounts[], field: AmountField): CurrencyAmount[] {
    return this.currencies()
      .map((currency) => {
        const value = amounts.find((item) => item.currency_id === currency.id)?.[field];
        return { currencyId: currency.id, value: value ?? 0, present: value !== null && value !== undefined };
      })
      .filter((item) => item.present && item.value !== 0)
      .map(({ currencyId, value }) => ({ currencyId, value }));
  }

  protected currencyCode(id: number): string {
    const feature: Feature | undefined = this.currencies().find((item) => item.id === id);
    return feature?.abbreviation || feature?.feature_value || feature?.description || String(id);
  }

  protected closingLabel(item: CashierSessionReportItem): string {
    if (item.closing_has_difference === null) return item.is_closed ? 'Sin cuadre' : 'Abierto';
    return item.closing_has_difference ? 'Con diferencia' : 'Cuadrado';
  }

  // Valida los filtros y arma la consulta; devuelve null (y muestra el error) si algo es inválido.
  private buildFilter(): CashierSessionReportFilter | null {
    const from = this.dateFrom();
    const to = this.dateTo();
    this.errorMessage.set(null);
    if (!from || !to) {
      this.errorMessage.set('Indica el rango de fechas de apertura (desde y hasta).');
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
      date_from: CashierSessionReport.toDateKey(from),
      date_to: CashierSessionReport.toDateKey(to),
      airport_id: this.airportFilter(),
      terminal_id: this.terminalFilter(),
      page: this.pageIndex() + 1,
      page_size: this.pageSize(),
    };
  }

  // Fecha local sin zona horaria (yyyy-MM-dd): el backend filtra por día calendario.
  private static toDateKey(value: Date): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  private static formatDateKey(key: string): string {
    const [year, month, day] = key.split('-');
    return `${day}/${month}/${year}`;
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
