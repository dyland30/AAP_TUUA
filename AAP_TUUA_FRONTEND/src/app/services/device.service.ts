import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Device } from '../models';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Device`;

  getAll(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Device | null> {
    return this.http.get<Device | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(device: Device): Observable<Device> {
    return this.http.post<Device>(`${this.baseUrl}/Add`, device);
  }

  update(device: Device): Observable<Device> {
    return this.http.put<Device>(`${this.baseUrl}/Update`, device);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
