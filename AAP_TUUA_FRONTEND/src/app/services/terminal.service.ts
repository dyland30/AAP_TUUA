import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Terminal } from '../models';

@Injectable({ providedIn: 'root' })
export class TerminalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Terminal`;

  getAll(): Observable<Terminal[]> {
    return this.http.get<Terminal[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Terminal | null> {
    return this.http.get<Terminal | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<Terminal[]> {
    return this.http.get<Terminal[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(terminal: Terminal): Observable<Terminal> {
    return this.http.post<Terminal>(`${this.baseUrl}/Add`, terminal);
  }

  update(terminal: Terminal): Observable<Terminal> {
    return this.http.put<Terminal>(`${this.baseUrl}/Update`, terminal);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
