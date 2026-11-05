import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocalUserCashierMachine } from '../models';

@Injectable({ providedIn: 'root' })
export class LocalUserCashierMachineService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/LocalUserCashierMachine`;

  getAll(): Observable<LocalUserCashierMachine[]> {
    return this.http.get<LocalUserCashierMachine[]>(`${this.baseUrl}/GetAll`);
  }

  getByLocalUserId(localUserId: string): Observable<LocalUserCashierMachine[]> {
    return this.http.get<LocalUserCashierMachine[]>(`${this.baseUrl}/GetByLocalUserId/${localUserId}`);
  }

  getByCashierMachineCode(cashierMachineCode: string): Observable<LocalUserCashierMachine[]> {
    return this.http.get<LocalUserCashierMachine[]>(
      `${this.baseUrl}/GetByCashierMachineCode/${cashierMachineCode}`,
    );
  }

  add(assignment: LocalUserCashierMachine): Observable<LocalUserCashierMachine> {
    return this.http.post<LocalUserCashierMachine>(`${this.baseUrl}/Add`, assignment);
  }

  delete(localUserId: string, cashierMachineCode: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/Delete/${localUserId}/${cashierMachineCode}`,
    );
  }
}
