import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Flight,
  TuuaSaleContext,
  TuuaSalePricing,
  TuuaSalesOperation,
  TuuaSalesOperationSearchFilter,
  TuuaSalesOperationSearchItem,
  TuuaTicketSaleRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class TuuaSalesOperationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/TuuaSalesOperation`;

  getAll(): Observable<TuuaSalesOperation[]> {
    return this.http.get<TuuaSalesOperation[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<TuuaSalesOperation | null> {
    return this.http.get<TuuaSalesOperation | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByCashierMachineSessionId(cashierMachineSessionId: string): Observable<TuuaSalesOperation[]> {
    return this.http.get<TuuaSalesOperation[]>(
      `${this.baseUrl}/GetByCashierMachineSessionId/${cashierMachineSessionId}`,
    );
  }

  getSaleContext(): Observable<TuuaSaleContext> {
    return this.http.get<TuuaSaleContext>(`${this.baseUrl}/GetSaleContext`);
  }

  getSalePricing(flightTypeId: number): Observable<TuuaSalePricing> {
    return this.http.get<TuuaSalePricing>(`${this.baseUrl}/GetSalePricing/${flightTypeId}`);
  }

  getFlightsForSale(flightTypeId: number): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.baseUrl}/GetFlightsForSale/${flightTypeId}`);
  }

  sell(request: TuuaTicketSaleRequest): Observable<TuuaSalesOperation> {
    return this.http.post<TuuaSalesOperation>(`${this.baseUrl}/Sell`, request);
  }

  search(filter: TuuaSalesOperationSearchFilter): Observable<TuuaSalesOperationSearchItem[]> {
    let params = new HttpParams()
      .set('date_from', filter.date_from)
      .set('date_to', filter.date_to);
    if (filter.airport_id) params = params.set('airport_id', filter.airport_id);
    if (filter.terminal_id) params = params.set('terminal_id', filter.terminal_id);
    if (filter.status_id !== null) params = params.set('status_id', filter.status_id);
    return this.http.get<TuuaSalesOperationSearchItem[]>(`${this.baseUrl}/Search`, { params });
  }

  // Con ticketId se descarga solo ese ticket; sin él, todos los tickets de la venta.
  downloadTicketsPdf(id: string, ticketId?: string | null): Observable<Blob> {
    let params = new HttpParams();
    if (ticketId) params = params.set('ticketId', ticketId);
    return this.http.get(`${this.baseUrl}/TicketsPdf/${id}`, { params, responseType: 'blob' });
  }

  sendTicketsEmail(id: string, email: string | null): Observable<{ email: string }> {
    return this.http.post<{ email: string }>(`${this.baseUrl}/SendTicketsEmail/${id}`, { email });
  }

  add(salesOperation: TuuaSalesOperation): Observable<TuuaSalesOperation> {
    return this.http.post<TuuaSalesOperation>(`${this.baseUrl}/Add`, salesOperation);
  }

  update(salesOperation: TuuaSalesOperation): Observable<TuuaSalesOperation> {
    return this.http.put<TuuaSalesOperation>(`${this.baseUrl}/Update`, salesOperation);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
