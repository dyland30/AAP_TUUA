import { DOCUMENT, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin } from 'rxjs';
import { Airport, AuditLog, FeatureGroup } from '../models';
import { AirportService, AuditLogService, FeatureCatalogService } from '../services';

const ACTION_GROUP = 'acciones auditoria';
const PAGE_SIZE = 50;

@Component({
  selector: 'app-audit-logs',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './audit-logs.html',
  styleUrl: '../catalogs/catalog-crud.css',
  styles: [
    `
      .audit__detail-row td {
        background: var(--mat-sys-surface-container-low);
      }
      .audit__detail {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      .audit__detail h4 {
        margin: 0 0 0.35rem;
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);
      }
      .audit__detail pre {
        margin: 0;
        padding: 0.6rem 0.75rem;
        max-height: 260px;
        overflow: auto;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        background: var(--mat-sys-surface-container-lowest);
        font-size: 0.78rem;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .audit__agent {
        grid-column: 1 / -1;
        font-size: 0.8rem;
        color: var(--mat-sys-on-surface-variant);
        word-break: break-word;
      }
      .audit__pager {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
        padding: 0.5rem 1rem;
        border-top: 1px solid var(--mat-sys-outline-variant);
        font-size: 0.875rem;
      }
      @media (max-width: 720px) {
        .audit__detail {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AuditLogs implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly auditLogService = inject(AuditLogService);
  private readonly airportService = inject(AirportService);
  private readonly featureCatalog = inject(FeatureCatalogService);

  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly actions = computed(() =>
    this.featureCatalog.featuresOf(this.groups(), ACTION_GROUP),
  );
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedActionId = signal<number | null>(null);
  protected readonly search = signal('');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly page = signal(0);
  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set<number>());
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly hasActiveFilters = computed(
    () =>
      this.selectedAirportId() !== null ||
      this.selectedActionId() !== null ||
      this.search().trim() !== '' ||
      this.dateFrom() !== '' ||
      this.dateTo() !== '',
  );
  protected readonly filteredLogs = computed(() => {
    const airportId = this.selectedAirportId();
    const actionId = this.selectedActionId();
    const query = this.search().trim().toLocaleLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo();
    return this.logs().filter((log) => {
      if (airportId && log.airport_id !== airportId) return false;
      if (actionId !== null && log.action_id !== actionId) return false;
      if (from || to) {
        const day = this.localDay(log.occurred_at);
        if (!day || (from && day < from) || (to && day > to)) return false;
      }
      return (
        !query ||
        [log.username, log.entity_name, log.entity_id, log.description, log.ip_address].some(
          (value) => value?.toLocaleLowerCase().includes(query),
        )
      );
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredLogs().length / PAGE_SIZE)),
  );
  protected readonly currentPage = computed(() => Math.min(this.page(), this.totalPages() - 1));
  protected readonly pagedLogs = computed(() => {
    const start = this.currentPage() * PAGE_SIZE;
    return this.filteredLogs().slice(start, start + PAGE_SIZE);
  });
  protected readonly rangeLabel = computed(() => {
    const total = this.filteredLogs().length;
    if (total === 0) return '0 de 0';
    const start = this.currentPage() * PAGE_SIZE;
    return `${start + 1}-${Math.min(start + PAGE_SIZE, total)} de ${total}`;
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    forkJoin({
      logs: this.auditLogService.getAll(),
      airports: this.airportService.getAll(),
      groups: this.featureCatalog.loadGroups([ACTION_GROUP]),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ logs, airports, groups }) => {
          // Más recientes primero.
          const sorted = [...(logs ?? [])].sort(
            (a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at) || b.id - a.id,
          );
          this.logs.set(sorted);
          this.airports.set(airports ?? []);
          this.groups.set(groups ?? []);
          this.expandedIds.set(new Set<number>());
          this.page.set(0);
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

  protected actionLabel(id: number | null): string {
    return this.featureCatalog.label(this.groups(), id);
  }

  protected entityLabel(log: AuditLog): string {
    const name = log.entity_name?.trim();
    const id = log.entity_id?.trim();
    if (name && id) return `${name} (${id})`;
    return name || id || '—';
  }

  protected setAirport(value: string | null): void {
    this.selectedAirportId.set(value);
    this.page.set(0);
  }

  protected setAction(value: number | null): void {
    this.selectedActionId.set(value);
    this.page.set(0);
  }

  protected setSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
  }

  protected setDateFrom(value: string): void {
    this.dateFrom.set(value);
    this.page.set(0);
  }

  protected setDateTo(value: string): void {
    this.dateTo.set(value);
    this.page.set(0);
  }

  protected clearFilters(): void {
    this.selectedAirportId.set(null);
    this.selectedActionId.set(null);
    this.search.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(0);
  }

  protected previousPage(): void {
    this.page.set(Math.max(0, this.currentPage() - 1));
  }

  protected nextPage(): void {
    this.page.set(Math.min(this.totalPages() - 1, this.currentPage() + 1));
  }

  protected isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }

  protected toggleExpanded(id: number): void {
    const next = new Set(this.expandedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expandedIds.set(next);
  }

  // Muestra los valores jsonb con sangría; si no son JSON válido se muestran tal cual.
  protected prettyJson(value: string | null): string {
    if (!value || !value.trim()) return '—';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  protected exportCsv(): void {
    const rows = this.filteredLogs();
    if (rows.length === 0) return;

    const header = [
      'Fecha y hora',
      'Usuario',
      'Acción',
      'Entidad',
      'Id de entidad',
      'Descripción',
      'IP',
      'Aeropuerto',
      'Valores anteriores',
      'Valores nuevos',
      'Agente de usuario',
    ];
    const lines = [header.map((value) => this.csvField(value)).join(',')];
    for (const log of rows) {
      lines.push(
        [
          this.formatTimestamp(log.occurred_at),
          log.username,
          this.actionLabel(log.action_id),
          log.entity_name,
          log.entity_id,
          log.description,
          log.ip_address,
          log.airport_id ? this.airportLabel(log.airport_id) : '',
          log.old_values,
          log.new_values,
          log.user_agent,
        ]
          .map((value) => this.csvField(value))
          .join(','),
      );
    }

    // BOM UTF-8 para que Excel reconozca los acentos.
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = `log-auditoria-${this.formatTimestamp(new Date().toISOString()).replace(/[: ]/g, '-')}.csv`;
    this.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  private csvField(value: string | null | undefined): string {
    let text = value ?? '';
    // Evita que Excel interprete el texto como una fórmula.
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  // Fecha local 'YYYY-MM-DD' de un instante (vacío si no es una fecha válida).
  private localDay(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
  }

  private formatTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value ?? '';
    return `${this.localDay(value)} ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}:${this.pad(date.getSeconds())}`;
  }

  private pad(value: number): string {
    return `${value}`.padStart(2, '0');
  }

  private resolveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
