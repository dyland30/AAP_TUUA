import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmergencyAlertSector } from '../models';

@Injectable({ providedIn: 'root' })
export class EmergencyAlertSectorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/EmergencyAlertSector`;

  getAll(): Observable<EmergencyAlertSector[]> {
    return this.http.get<EmergencyAlertSector[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<EmergencyAlertSector | null> {
    return this.http.get<EmergencyAlertSector | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByEmergencyAlertId(emergencyAlertId: string): Observable<EmergencyAlertSector[]> {
    return this.http.get<EmergencyAlertSector[]>(
      `${this.baseUrl}/GetByEmergencyAlertId/${emergencyAlertId}`,
    );
  }

  add(sector: EmergencyAlertSector): Observable<EmergencyAlertSector> {
    return this.http.post<EmergencyAlertSector>(`${this.baseUrl}/Add`, sector);
  }

  update(sector: EmergencyAlertSector): Observable<EmergencyAlertSector> {
    return this.http.put<EmergencyAlertSector>(`${this.baseUrl}/Update`, sector);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
