import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CashierSessionBalance, CashierSessionCloseRequest, CashierSessionClosing } from '../models';

@Injectable({ providedIn: 'root' })
export class CashierSessionClosingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/CashierMachineSessionClosing`;

  // Saldos esperados del turno abierto del usuario autenticado.
  getBalance(): Observable<CashierSessionBalance> {
    return this.http.get<CashierSessionBalance>(`${this.baseUrl}/GetBalance`);
  }

  getBySessionId(cashierMachineSessionId: string): Observable<CashierSessionClosing | null> {
    return this.http.get<CashierSessionClosing | null>(
      `${this.baseUrl}/GetBySessionId/${cashierMachineSessionId}`,
    );
  }

  close(request: CashierSessionCloseRequest): Observable<CashierSessionClosing> {
    return this.http.post<CashierSessionClosing>(`${this.baseUrl}/Close`, request);
  }
}
