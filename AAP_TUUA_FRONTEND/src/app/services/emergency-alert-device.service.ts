import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmergencyAlertDevice } from '../models';

@Injectable({ providedIn: 'root' })
export class EmergencyAlertDeviceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/EmergencyAlertDevice`;

  getAll(): Observable<EmergencyAlertDevice[]> {
    return this.http.get<EmergencyAlertDevice[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<EmergencyAlertDevice | null> {
    return this.http.get<EmergencyAlertDevice | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByEmergencyAlertId(emergencyAlertId: string): Observable<EmergencyAlertDevice[]> {
    return this.http.get<EmergencyAlertDevice[]>(
      `${this.baseUrl}/GetByEmergencyAlertId/${emergencyAlertId}`,
    );
  }

  add(device: EmergencyAlertDevice): Observable<EmergencyAlertDevice> {
    return this.http.post<EmergencyAlertDevice>(`${this.baseUrl}/Add`, device);
  }

  update(device: EmergencyAlertDevice): Observable<EmergencyAlertDevice> {
    return this.http.put<EmergencyAlertDevice>(`${this.baseUrl}/Update`, device);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
