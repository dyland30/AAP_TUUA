import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import {
  Airport,
  BoardingpassSearchFilter,
  BoardingpassSearchItem,
  Feature,
  FeatureGroup,
  Terminal,
} from '../models';
import { AirportService } from '../services/airport.service';
import { BoardingpassService } from '../services/boardingpass.service';
import { FeatureService } from '../services/feature.service';
import { TerminalService } from '../services/terminal.service';

const FlightTypeGroupName = 'Tipos de Vuelo';
const StatusGroupName = 'Estados Boardingpass';
const MaxRangeDays = 92;

@Component({
  selector: 'app-boardingpass-search',
  imports: [
    DatePipe,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
  ],
  templateUrl: './boardingpass-search.html',
  styleUrls: ['../catalogs/catalog-crud.css', './boardingpass-search.css'],
})
export class BoardingpassSearch implements OnInit {
  private readonly boardingpassService = inject(BoardingpassService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);
  private readonly featureService = inject(FeatureService);

  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly results = signal<BoardingpassSearchItem[]>([]);
  protected readonly total = signal(0);
  protected readonly searched = signal(false);

  protected readonly dateFrom = signal<Date | null>(new Date());
  protected readonly dateTo = signal<Date | null>(new Date());
  protected readonly timeFrom = signal('');
  protected readonly timeTo = signal('');
  protected readonly airportFilter = signal<string | null>(null);
  protected readonly terminalFilter = signal<string | null>(null);
  protected readonly flightTypeFilter = signal<number | null>(null);
  protected readonly statusFilter = signal<number | null>(null);

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly pageSizeOptions = [10, 20, 50, 100];

  protected readonly isLoading = signal(false);
  protected readonly isSearching = signal(false);
  protected readonly isExporting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly maxDate = new Date();

  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.groups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  protected readonly flightTypes = computed(() => this.activeFeatures(FlightTypeGroupName));
  protected readonly statuses = computed(() => this.activeFeatures(StatusGroupName));
  protected readonly terminalOptions = computed(() => {
    const airportId = this.airportFilter();
    return this.terminals().filter((terminal) => !airportId || terminal.airport_id === airportId);
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
        const names = [FlightTypeGroupName, StatusGroupName].map((name) =>
          BoardingpassSearch.normalize(name),
        );
        const relevant = (groups ?? []).filter((group) =>
          names.includes(BoardingpassSearch.normalize(group.name)),
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

  private activeFeatures(groupName: string): Feature[] {
    const name = BoardingpassSearch.normalize(groupName);
    return (
      this.groups()
        .find((group) => BoardingpassSearch.normalize(group.name) === name)
        ?.features?.filter((feature) => feature.is_active) ?? []
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
    this.pageIndex.set(0);
    this.search();
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.search();
  }

  // Valida los filtros y arma la consulta; devuelve null (y muestra el error) si algo es inválido.
  private buildFilter(): BoardingpassSearchFilter | null {
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
    const timeFrom = this.timeFrom() || null;
    const timeTo = this.timeTo() || null;
    if (timeFrom && timeTo && timeFrom > timeTo) {
      this.errorMessage.set('La hora inicial no puede ser mayor a la hora final.');
      return null;
    }
    return {
      date_from: BoardingpassSearch.toDateKey(from),
      date_to: BoardingpassSearch.toDateKey(to),
      time_from: timeFrom,
      time_to: timeTo,
      airport_id: this.airportFilter(),
      terminal_id: this.terminalFilter(),
      flight_type_id: this.flightTypeFilter(),
      status_id: this.statusFilter(),
      page: this.pageIndex() + 1,
      page_size: this.pageSize(),
    };
  }

  protected search(): void {
    if (this.isSearching()) return;
    const filter = this.buildFilter();
    if (!filter) return;

    this.isSearching.set(true);
    this.boardingpassService
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
    this.boardingpassService
      .exportExcel(filter)
      .pipe(finalize(() => this.isExporting.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `boardingpass-${filter.date_from}-${filter.date_to}.xlsx`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: (error: unknown) => this.resolveBlobError(error),
      });
  }

  protected clearFilters(): void {
    this.dateFrom.set(new Date());
    this.dateTo.set(new Date());
    this.timeFrom.set('');
    this.timeTo.set('');
    this.airportFilter.set(null);
    this.terminalFilter.set(null);
    this.flightTypeFilter.set(null);
    this.statusFilter.set(null);
    this.pageIndex.set(0);
    this.search();
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description ?? String(id);
  }

  protected placeLabel(item: BoardingpassSearchItem): string {
    return item.airport_iata_code || item.airport_name || '—';
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
