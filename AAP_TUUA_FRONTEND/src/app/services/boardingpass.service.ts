import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BoardingpassSearchFilter, BoardingpassSearchItem, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class BoardingpassService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/BoardingpassDaeSeae`;

  search(filter: BoardingpassSearchFilter): Observable<PagedResult<BoardingpassSearchItem>> {
    return this.http.get<PagedResult<BoardingpassSearchItem>>(`${this.baseUrl}/Search`, {
      params: this.toParams(filter).set('page', filter.page).set('page_size', filter.page_size),
    });
  }

  // Descarga en Excel todos los registros que cumplen los filtros (sin paginar).
  exportExcel(filter: BoardingpassSearchFilter): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/Export`, {
      params: this.toParams(filter),
      responseType: 'blob',
    });
  }

  private toParams(filter: BoardingpassSearchFilter): HttpParams {
    let params = new HttpParams().set('date_from', filter.date_from).set('date_to', filter.date_to);
    if (filter.time_from) params = params.set('time_from', filter.time_from);
    if (filter.time_to) params = params.set('time_to', filter.time_to);
    if (filter.airport_id) params = params.set('airport_id', filter.airport_id);
    if (filter.terminal_id) params = params.set('terminal_id', filter.terminal_id);
    if (filter.flight_type_id !== null) params = params.set('flight_type_id', filter.flight_type_id);
    if (filter.status_id !== null) params = params.set('status_id', filter.status_id);
    return params;
  }
}
