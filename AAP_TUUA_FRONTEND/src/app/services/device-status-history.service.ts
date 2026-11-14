import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeviceStatusHistory } from '../models';

@Injectable({ providedIn: 'root' })
export class DeviceStatusHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/DeviceStatusHistory`;

  getAll(): Observable<DeviceStatusHistory[]> {
    return this.http.get<DeviceStatusHistory[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<DeviceStatusHistory | null> {
    return this.http.get<DeviceStatusHistory | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByDeviceId(deviceId: string): Observable<DeviceStatusHistory[]> {
    return this.http.get<DeviceStatusHistory[]>(`${this.baseUrl}/GetByDeviceId/${deviceId}`);
  }
}
