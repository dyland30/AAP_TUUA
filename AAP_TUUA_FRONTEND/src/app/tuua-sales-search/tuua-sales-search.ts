import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import {
  Airport,
  Feature,
  FeatureGroup,
  Terminal,
  TuuaSalesOperationSearchItem,
  TuuaTicket,
} from '../models';
import { AirportService } from '../services/airport.service';
import { FeatureService } from '../services/feature.service';
import { TerminalService } from '../services/terminal.service';
import { TuuaSalesOperationService } from '../services/tuua-sales-operation.service';

const CatalogGroupNames = [
  'Estados Operacion Venta',
  'Estados Ticket TUUA',
  'Tipos de Pago',
  'Monedas',
];
const SaleStatusGroupName = 'Estados Operacion Venta';
const CancelledValue = 'anulado';
const MaxRangeDays = 92;

@Component({
  selector: 'app-tuua-sales-search',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './tuua-sales-search.html',
  styleUrls: ['../catalogs/catalog-crud.css', './tuua-sales-search.css'],
})
export class TuuaSalesSearch implements OnInit {
  private readonly salesService = inject(TuuaSalesOperationService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);
  private readonly featureService = inject(FeatureService);

  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly results = signal<TuuaSalesOperationSearchItem[]>([]);
  protected readonly searched = signal(false);
  protected readonly expandedId = signal<string | null>(null);

  protected readonly dateFrom = signal<Date | null>(new Date());
  protected readonly dateTo = signal<Date | null>(new Date());
  protected readonly airportFilter = signal<string | null>(null);
  protected readonly terminalFilter = signal<string | null>(null);
  protected readonly statusFilter = signal<number | null>(null);

  protected readonly isLoading = signal(false);
  protected readonly isSearching = signal(false);
  protected readonly downloadingKey = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly maxDate = new Date();

  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  protected readonly saleStatuses = computed(
    () =>
      this.groups()
        .find(
          (group) =>
            TuuaSalesSearch.normalize(group.name) === TuuaSalesSearch.normalize(SaleStatusGroupName),
        )
        ?.features?.filter((feature) => feature.is_active) ?? [],
  );
  protected readonly terminalOptions = computed(() => {
    const airportId = this.airportFilter();
    return this.terminals().filter((terminal) => !airportId || terminal.airport_id === airportId);
  });
  protected readonly ticketCount = computed(() =>
    this.results().reduce((sum, operation) => sum + operation.tickets.length, 0),
  );
  // Importe vendido por moneda, sin contar las operaciones anuladas.
  protected readonly totalsByCurrency = computed(() => {
    const totals = new Map<number, number>();
    for (const operation of this.results()) {
      if (this.isCancelled(operation)) continue;
      totals.set(operation.currency_id, (totals.get(operation.currency_id) ?? 0) + operation.total);
    }
    return [...totals].map(([currencyId, total]) => ({
      currency: this.featureCode(currencyId),
      total,
    }));
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    forkJoin({
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
      groups: this.loadCatalog(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ airports, terminals, groups }) => {
          this.airports.set((airports ?? []).filter((airport) => airport.is_active));
          this.terminals.set((terminals ?? []).filter((terminal) => terminal.is_active));
          this.groups.set(groups);
          this.search();
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog() {
    return this.featureService.getAllFeatureGroups().pipe(
      switchMap((groups) => {
        const names = CatalogGroupNames.map((name) => TuuaSalesSearch.normalize(name));
        const relevant = (groups ?? []).filter((group) =>
          names.includes(TuuaSalesSearch.normalize(group.name)),
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
    );
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
    this.search();
  }

  protected search(): void {
    if (this.isSearching()) return;
    const from = this.dateFrom();
    const to = this.dateTo();
    this.errorMessage.set(null);
    if (!from || !to) {
      this.errorMessage.set('Indica el rango de fechas (desde y hasta).');
      return;
    }
    if (from > to) {
      this.errorMessage.set('La fecha inicial no puede ser mayor a la fecha final.');
      return;
    }
    if ((to.getTime() - from.getTime()) / 86_400_000 > MaxRangeDays) {
      this.errorMessage.set(`El rango de fechas no puede superar ${MaxRangeDays} días.`);
      return;
    }

    this.isSearching.set(true);
    this.salesService
      .search({
        date_from: TuuaSalesSearch.toDateKey(from),
        date_to: TuuaSalesSearch.toDateKey(to),
        airport_id: this.airportFilter(),
        terminal_id: this.terminalFilter(),
        status_id: this.statusFilter(),
      })
      .pipe(finalize(() => this.isSearching.set(false)))
      .subscribe({
        next: (results) => {
          this.results.set(results ?? []);
          this.expandedId.set(null);
          this.searched.set(true);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected clearFilters(): void {
    this.dateFrom.set(new Date());
    this.dateTo.set(new Date());
    this.airportFilter.set(null);
    this.terminalFilter.set(null);
    this.statusFilter.set(null);
    this.search();
  }

  protected toggle(operation: TuuaSalesOperationSearchItem): void {
    this.expandedId.set(this.expandedId() === operation.id ? null : operation.id);
  }

  protected download(operation: TuuaSalesOperationSearchItem, ticket?: TuuaTicket): void {
    if (!operation.id || this.downloadingKey()) return;
    this.errorMessage.set(null);
    this.downloadingKey.set(ticket?.id ?? operation.id);
    this.salesService
      .downloadTicketsPdf(operation.id, ticket?.id)
      .pipe(finalize(() => this.downloadingKey.set(null)))
      .subscribe({
        next: (blob) => {
          const first = ticket ?? operation.tickets[0];
          const name = ticket
            ? `ticket-tuua-${ticket.serial}-${ticket.sequential_number}`
            : `tickets-tuua-${first?.serial ?? ''}-${first?.sequential_number ?? operation.id}`;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${name}.pdf`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected isCancelled(operation: TuuaSalesOperationSearchItem): boolean {
    return (
      this.featureIndex().get(operation.status_id)?.feature_value?.toLowerCase() === CancelledValue
    );
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description ?? String(id);
  }

  protected featureCode(id: number | null): string {
    if (id === null) return '';
    const feature = this.featureIndex().get(id);
    return feature?.feature_value ?? feature?.description ?? '';
  }

  protected placeLabel(operation: TuuaSalesOperationSearchItem): string {
    return operation.airport_iata_code || operation.airport_name || '—';
  }

  private static normalize(value: string | null): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLocaleLowerCase();
  }

  // Fecha local sin zona horaria (yyyy-MM-dd): el backend filtra por día calendario.
  private static toDateKey(value: Date): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof Blob) return 'No se pudo generar el PDF de los tickets.';
      if (typeof error.error === 'string' && error.error.trim()) return error.error;
      if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
