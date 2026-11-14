import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuditLog } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AuditLog`;

  getAll(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: number): Observable<AuditLog | null> {
    return this.http.get<AuditLog | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(log: AuditLog): Observable<AuditLog> {
    return this.http.post<AuditLog>(`${this.baseUrl}/Add`, log);
  }
}
