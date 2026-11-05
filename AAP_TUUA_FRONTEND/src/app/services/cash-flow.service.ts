import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CashFlow } from '../models';

@Injectable({ providedIn: 'root' })
export class CashFlowService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/CashFlow`;

  getAll(): Observable<CashFlow[]> {
    return this.http.get<CashFlow[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<CashFlow | null> {
    return this.http.get<CashFlow | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByCashierMachineSessionId(cashierMachineSessionId: string): Observable<CashFlow[]> {
    return this.http.get<CashFlow[]>(
      `${this.baseUrl}/GetByCashierMachineSessionId/${cashierMachineSessionId}`,
    );
  }

  getBySalesOperationId(tuuaSalesOperationId: string): Observable<CashFlow[]> {
    return this.http.get<CashFlow[]>(`${this.baseUrl}/GetBySalesOperationId/${tuuaSalesOperationId}`);
  }

  getByMoneyExchangeOperationId(moneyExchangeOperationId: string): Observable<CashFlow[]> {
    return this.http.get<CashFlow[]>(
      `${this.baseUrl}/GetByMoneyExchangeOperationId/${moneyExchangeOperationId}`,
    );
  }

  add(cashFlow: CashFlow): Observable<CashFlow> {
    return this.http.post<CashFlow>(`${this.baseUrl}/Add`, cashFlow);
  }

  update(cashFlow: CashFlow): Observable<CashFlow> {
    return this.http.put<CashFlow>(`${this.baseUrl}/Update`, cashFlow);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
