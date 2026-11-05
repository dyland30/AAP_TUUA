import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ExchangeRate } from '../models';

export interface ExchangeRateQuery {
  day: string;
  baseCurrencyId: number;
  targetCurrencyId: number;
}

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ExchangeRate`;

  getAll(): Observable<ExchangeRate[]> {
    return this.http.get<ExchangeRate[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<ExchangeRate | null> {
    return this.http.get<ExchangeRate | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByCurrencies(baseCurrencyId: number, targetCurrencyId: number): Observable<ExchangeRate[]> {
    const params = new HttpParams()
      .set('baseCurrencyId', baseCurrencyId)
      .set('targetCurrencyId', targetCurrencyId);
    return this.http.get<ExchangeRate[]>(`${this.baseUrl}/GetByCurrencies`, { params });
  }

  getByDayAndCurrencies(query: ExchangeRateQuery): Observable<ExchangeRate | null> {
    const params = new HttpParams()
      .set('day', query.day)
      .set('baseCurrencyId', query.baseCurrencyId)
      .set('targetCurrencyId', query.targetCurrencyId);
    return this.http.get<ExchangeRate | null>(`${this.baseUrl}/GetByDayAndCurrencies`, { params });
  }

  add(exchangeRate: ExchangeRate): Observable<ExchangeRate> {
    return this.http.post<ExchangeRate>(`${this.baseUrl}/Add`, exchangeRate);
  }

  update(exchangeRate: ExchangeRate): Observable<ExchangeRate> {
    return this.http.put<ExchangeRate>(`${this.baseUrl}/Update`, exchangeRate);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
