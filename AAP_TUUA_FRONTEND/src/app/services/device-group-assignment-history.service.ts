import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeviceGroupAssignmentHistory } from '../models';

@Injectable({ providedIn: 'root' })
export class DeviceGroupAssignmentHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/DeviceGroupAssignmentHistory`;

  getAll(): Observable<DeviceGroupAssignmentHistory[]> {
    return this.http.get<DeviceGroupAssignmentHistory[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<DeviceGroupAssignmentHistory | null> {
    return this.http.get<DeviceGroupAssignmentHistory | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByDeviceId(deviceId: string): Observable<DeviceGroupAssignmentHistory[]> {
    return this.http.get<DeviceGroupAssignmentHistory[]>(
      `${this.baseUrl}/GetByDeviceId/${deviceId}`,
    );
  }
}
