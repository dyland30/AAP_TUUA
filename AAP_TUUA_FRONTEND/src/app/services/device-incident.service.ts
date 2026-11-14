import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeviceIncident } from '../models';

@Injectable({ providedIn: 'root' })
export class DeviceIncidentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/DeviceIncident`;

  getAll(): Observable<DeviceIncident[]> {
    return this.http.get<DeviceIncident[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<DeviceIncident | null> {
    return this.http.get<DeviceIncident | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByDeviceId(deviceId: string): Observable<DeviceIncident[]> {
    return this.http.get<DeviceIncident[]>(`${this.baseUrl}/GetByDeviceId/${deviceId}`);
  }

  add(incident: DeviceIncident): Observable<DeviceIncident> {
    return this.http.post<DeviceIncident>(`${this.baseUrl}/Add`, incident);
  }

  update(incident: DeviceIncident): Observable<DeviceIncident> {
    return this.http.put<DeviceIncident>(`${this.baseUrl}/Update`, incident);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
