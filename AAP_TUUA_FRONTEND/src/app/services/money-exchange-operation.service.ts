import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MoneyExchangeOperation } from '../models';

@Injectable({ providedIn: 'root' })
export class MoneyExchangeOperationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/MoneyExchangeOperation`;

  getAll(): Observable<MoneyExchangeOperation[]> {
    return this.http.get<MoneyExchangeOperation[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<MoneyExchangeOperation | null> {
    return this.http.get<MoneyExchangeOperation | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByCashierMachineSessionId(cashierMachineSessionId: string): Observable<MoneyExchangeOperation[]> {
    return this.http.get<MoneyExchangeOperation[]>(
      `${this.baseUrl}/GetByCashierMachineSessionId/${cashierMachineSessionId}`,
    );
  }

  getByExchangeRateId(exchangeRateId: string): Observable<MoneyExchangeOperation[]> {
    return this.http.get<MoneyExchangeOperation[]>(`${this.baseUrl}/GetByExchangeRateId/${exchangeRateId}`);
  }

  add(operation: MoneyExchangeOperation): Observable<MoneyExchangeOperation> {
    return this.http.post<MoneyExchangeOperation>(`${this.baseUrl}/Add`, operation);
  }

  update(operation: MoneyExchangeOperation): Observable<MoneyExchangeOperation> {
    return this.http.put<MoneyExchangeOperation>(`${this.baseUrl}/Update`, operation);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
