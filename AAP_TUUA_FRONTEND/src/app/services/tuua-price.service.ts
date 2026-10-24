import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TuuaPrice } from '../models';

export interface ActivePriceQuery {
  flightTypeId: number;
  locationId: string;
  terminalId: string;
  currencyId: number;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class TuuaPriceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/TuuaPrice`;

  getAll(): Observable<TuuaPrice[]> {
    return this.http.get<TuuaPrice[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<TuuaPrice | null> {
    return this.http.get<TuuaPrice | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByLocationAndTerminal(locationId: string, terminalId: string): Observable<TuuaPrice[]> {
    return this.http.get<TuuaPrice[]>(
      `${this.baseUrl}/GetByLocationAndTerminal/${locationId}/${terminalId}`,
    );
  }

  getActivePrice(query: ActivePriceQuery): Observable<TuuaPrice | null> {
    const params = new HttpParams()
      .set('flightTypeId', query.flightTypeId)
      .set('locationId', query.locationId)
      .set('terminalId', query.terminalId)
      .set('currencyId', query.currencyId)
      .set('date', query.date);
    return this.http.get<TuuaPrice | null>(`${this.baseUrl}/GetActivePrice`, { params });
  }

  add(tuuaPrice: TuuaPrice): Observable<TuuaPrice> {
    return this.http.post<TuuaPrice>(`${this.baseUrl}/Add`, tuuaPrice);
  }

  update(tuuaPrice: TuuaPrice): Observable<TuuaPrice> {
    return this.http.put<TuuaPrice>(`${this.baseUrl}/Update`, tuuaPrice);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
