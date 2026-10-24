import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Stand } from '../models';

@Injectable({ providedIn: 'root' })
export class StandService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Stand`;

  getAll(): Observable<Stand[]> {
    return this.http.get<Stand[]>(`${this.baseUrl}/GetAll`);
  }

  getById(resourceId: string): Observable<Stand | null> {
    return this.http.get<Stand | null>(`${this.baseUrl}/GetById/${resourceId}`);
  }

  getByTerminalId(terminalId: string): Observable<Stand[]> {
    return this.http.get<Stand[]>(`${this.baseUrl}/GetByTerminalId/${terminalId}`);
  }

  add(stand: Stand): Observable<Stand> {
    return this.http.post<Stand>(`${this.baseUrl}/Add`, stand);
  }

  update(stand: Stand): Observable<Stand> {
    return this.http.put<Stand>(`${this.baseUrl}/Update`, stand);
  }

  delete(resourceId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${resourceId}`);
  }
}
