import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CashierSessionReportFilter, CashierSessionReportResult } from '../models';

@Injectable({ providedIn: 'root' })
export class CashierSessionReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/CashierMachineSessionReport`;

  search(filter: CashierSessionReportFilter): Observable<CashierSessionReportResult> {
    return this.http.get<CashierSessionReportResult>(`${this.baseUrl}/Search`, {
      params: this.toParams(filter).set('page', filter.page).set('page_size', filter.page_size),
    });
  }

  // Descarga en Excel todos los turnos que cumplen los filtros (sin paginar).
  exportExcel(filter: CashierSessionReportFilter): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/Export`, {
      params: this.toParams(filter),
      responseType: 'blob',
    });
  }

  private toParams(filter: CashierSessionReportFilter): HttpParams {
    let params = new HttpParams().set('date_from', filter.date_from).set('date_to', filter.date_to);
    if (filter.airport_id) params = params.set('airport_id', filter.airport_id);
    if (filter.terminal_id) params = params.set('terminal_id', filter.terminal_id);
    return params;
  }
}
