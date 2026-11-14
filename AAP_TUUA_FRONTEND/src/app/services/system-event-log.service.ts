import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SystemEventLog } from '../models';

@Injectable({ providedIn: 'root' })
export class SystemEventLogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/SystemEventLog`;

  getAll(): Observable<SystemEventLog[]> {
    return this.http.get<SystemEventLog[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: number): Observable<SystemEventLog | null> {
    return this.http.get<SystemEventLog | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<SystemEventLog[]> {
    return this.http.get<SystemEventLog[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(log: SystemEventLog): Observable<SystemEventLog> {
    return this.http.post<SystemEventLog>(`${this.baseUrl}/Add`, log);
  }

  update(log: SystemEventLog): Observable<SystemEventLog> {
    return this.http.put<SystemEventLog>(`${this.baseUrl}/Update`, log);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
