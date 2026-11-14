import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmergencyAlert } from '../models';

@Injectable({ providedIn: 'root' })
export class EmergencyAlertService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/EmergencyAlert`;

  getAll(): Observable<EmergencyAlert[]> {
    return this.http.get<EmergencyAlert[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<EmergencyAlert | null> {
    return this.http.get<EmergencyAlert | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<EmergencyAlert[]> {
    return this.http.get<EmergencyAlert[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(alert: EmergencyAlert): Observable<EmergencyAlert> {
    return this.http.post<EmergencyAlert>(`${this.baseUrl}/Add`, alert);
  }

  update(alert: EmergencyAlert): Observable<EmergencyAlert> {
    return this.http.put<EmergencyAlert>(`${this.baseUrl}/Update`, alert);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
