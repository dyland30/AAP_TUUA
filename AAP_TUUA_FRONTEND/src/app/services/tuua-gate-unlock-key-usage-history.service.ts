import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PagedResult,
  TuuaGateUnlockKeyUsageFilter,
  TuuaGateUnlockKeyUsageHistory,
  TuuaGateUnlockKeyUsageReportItem,
} from '../models';

@Injectable({ providedIn: 'root' })
export class TuuaGateUnlockKeyUsageHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/TuuaGateUnlockKeyUsageHistory`;

  getAll(): Observable<TuuaGateUnlockKeyUsageHistory[]> {
    return this.http.get<TuuaGateUnlockKeyUsageHistory[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<TuuaGateUnlockKeyUsageHistory | null> {
    return this.http.get<TuuaGateUnlockKeyUsageHistory | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByTuuaGateCode(tuuaGateCode: string): Observable<TuuaGateUnlockKeyUsageHistory[]> {
    return this.http.get<TuuaGateUnlockKeyUsageHistory[]>(`${this.baseUrl}/GetByTuuaGateCode/${tuuaGateCode}`);
  }

  add(history: TuuaGateUnlockKeyUsageHistory): Observable<TuuaGateUnlockKeyUsageHistory> {
    return this.http.post<TuuaGateUnlockKeyUsageHistory>(`${this.baseUrl}/Add`, history);
  }

  search(
    filter: TuuaGateUnlockKeyUsageFilter,
  ): Observable<PagedResult<TuuaGateUnlockKeyUsageReportItem>> {
    return this.http.get<PagedResult<TuuaGateUnlockKeyUsageReportItem>>(`${this.baseUrl}/Search`, {
      params: this.toParams(filter).set('page', filter.page).set('page_size', filter.page_size),
    });
  }

  // Descarga en Excel todos los registros que cumplen los filtros (sin paginar).
  exportExcel(filter: TuuaGateUnlockKeyUsageFilter): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/Export`, {
      params: this.toParams(filter),
      responseType: 'blob',
    });
  }

  private toParams(filter: TuuaGateUnlockKeyUsageFilter): HttpParams {
    let params = new HttpParams().set('date_from', filter.date_from).set('date_to', filter.date_to);
    if (filter.airport_id) params = params.set('airport_id', filter.airport_id);
    if (filter.terminal_id) params = params.set('terminal_id', filter.terminal_id);
    if (filter.tuua_gate_code) params = params.set('tuua_gate_code', filter.tuua_gate_code);
    if (filter.user_id) params = params.set('user_id', filter.user_id);
    return params;
  }
}
