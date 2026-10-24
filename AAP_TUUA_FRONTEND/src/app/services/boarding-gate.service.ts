import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BoardingGate } from '../models';

@Injectable({ providedIn: 'root' })
export class BoardingGateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/BoardingGate`;

  getAll(): Observable<BoardingGate[]> {
    return this.http.get<BoardingGate[]>(`${this.baseUrl}/GetAll`);
  }

  getById(resourceId: string): Observable<BoardingGate | null> {
    return this.http.get<BoardingGate | null>(`${this.baseUrl}/GetById/${resourceId}`);
  }

  getByTerminalId(terminalId: string): Observable<BoardingGate[]> {
    return this.http.get<BoardingGate[]>(`${this.baseUrl}/GetByTerminalId/${terminalId}`);
  }

  add(boardingGate: BoardingGate): Observable<BoardingGate> {
    return this.http.post<BoardingGate>(`${this.baseUrl}/Add`, boardingGate);
  }

  update(boardingGate: BoardingGate): Observable<BoardingGate> {
    return this.http.put<BoardingGate>(`${this.baseUrl}/Update`, boardingGate);
  }

  delete(resourceId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${resourceId}`);
  }
}
