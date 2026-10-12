import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TuuaGate } from '../models';

@Injectable({ providedIn: 'root' })
export class TuuaGateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/TuuaGate`;

  getAll(): Observable<TuuaGate[]> {
    return this.http.get<TuuaGate[]>(`${this.baseUrl}/GetAll`);
  }

  getByCode(code: string): Observable<TuuaGate | null> {
    return this.http.get<TuuaGate | null>(`${this.baseUrl}/GetByCode/${code}`);
  }

  getByTerminalId(terminalId: string): Observable<TuuaGate[]> {
    return this.http.get<TuuaGate[]>(`${this.baseUrl}/GetByTerminalId/${terminalId}`);
  }

  add(tuuaGate: TuuaGate): Observable<TuuaGate> {
    return this.http.post<TuuaGate>(`${this.baseUrl}/Add`, tuuaGate);
  }

  update(tuuaGate: TuuaGate): Observable<TuuaGate> {
    return this.http.put<TuuaGate>(`${this.baseUrl}/Update`, tuuaGate);
  }

  delete(code: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${code}`);
  }
}
