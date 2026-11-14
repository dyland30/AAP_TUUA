import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmergencyMessageTemplate } from '../models';

@Injectable({ providedIn: 'root' })
export class EmergencyMessageTemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/EmergencyMessageTemplate`;

  getAll(): Observable<EmergencyMessageTemplate[]> {
    return this.http.get<EmergencyMessageTemplate[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<EmergencyMessageTemplate | null> {
    return this.http.get<EmergencyMessageTemplate | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<EmergencyMessageTemplate[]> {
    return this.http.get<EmergencyMessageTemplate[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(template: EmergencyMessageTemplate): Observable<EmergencyMessageTemplate> {
    return this.http.post<EmergencyMessageTemplate>(`${this.baseUrl}/Add`, template);
  }

  update(template: EmergencyMessageTemplate): Observable<EmergencyMessageTemplate> {
    return this.http.put<EmergencyMessageTemplate>(`${this.baseUrl}/Update`, template);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
