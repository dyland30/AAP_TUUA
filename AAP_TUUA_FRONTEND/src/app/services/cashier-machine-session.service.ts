import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CashierMachineSession } from '../models';

@Injectable({ providedIn: 'root' })
export class CashierMachineSessionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/CashierMachineSession`;

  getAll(): Observable<CashierMachineSession[]> {
    return this.http.get<CashierMachineSession[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<CashierMachineSession | null> {
    return this.http.get<CashierMachineSession | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getOpenByCashierMachineCode(cashierMachineCode: string): Observable<CashierMachineSession | null> {
    return this.http.get<CashierMachineSession | null>(
      `${this.baseUrl}/GetOpenByCashierMachineCode/${cashierMachineCode}`,
    );
  }

  getByLocalUserId(localUserId: string): Observable<CashierMachineSession[]> {
    return this.http.get<CashierMachineSession[]>(`${this.baseUrl}/GetByLocalUserId/${localUserId}`);
  }

  add(session: CashierMachineSession): Observable<CashierMachineSession> {
    return this.http.post<CashierMachineSession>(`${this.baseUrl}/Add`, session);
  }

  update(session: CashierMachineSession): Observable<CashierMachineSession> {
    return this.http.put<CashierMachineSession>(`${this.baseUrl}/Update`, session);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
