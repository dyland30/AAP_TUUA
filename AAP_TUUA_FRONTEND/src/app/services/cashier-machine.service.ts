import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CashierMachine } from '../models';

@Injectable({ providedIn: 'root' })
export class CashierMachineService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/CashierMachine`;

  getAll(): Observable<CashierMachine[]> {
    return this.http.get<CashierMachine[]>(`${this.baseUrl}/GetAll`);
  }

  getByCode(code: string): Observable<CashierMachine | null> {
    return this.http.get<CashierMachine | null>(`${this.baseUrl}/GetByCode/${code}`);
  }

  add(cashierMachine: CashierMachine): Observable<CashierMachine> {
    return this.http.post<CashierMachine>(`${this.baseUrl}/Add`, cashierMachine);
  }

  update(cashierMachine: CashierMachine): Observable<CashierMachine> {
    return this.http.put<CashierMachine>(`${this.baseUrl}/Update`, cashierMachine);
  }

  delete(code: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${code}`);
  }
}
