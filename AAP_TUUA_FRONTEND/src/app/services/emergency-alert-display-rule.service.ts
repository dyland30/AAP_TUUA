import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmergencyAlertDisplayRule } from '../models';

@Injectable({ providedIn: 'root' })
export class EmergencyAlertDisplayRuleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/EmergencyAlertDisplayRule`;

  getAll(): Observable<EmergencyAlertDisplayRule[]> {
    return this.http.get<EmergencyAlertDisplayRule[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<EmergencyAlertDisplayRule | null> {
    return this.http.get<EmergencyAlertDisplayRule | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAlertTypeId(alertTypeId: number): Observable<EmergencyAlertDisplayRule[]> {
    return this.http.get<EmergencyAlertDisplayRule[]>(
      `${this.baseUrl}/GetByAlertTypeId/${alertTypeId}`,
    );
  }

  add(rule: EmergencyAlertDisplayRule): Observable<EmergencyAlertDisplayRule> {
    return this.http.post<EmergencyAlertDisplayRule>(`${this.baseUrl}/Add`, rule);
  }

  update(rule: EmergencyAlertDisplayRule): Observable<EmergencyAlertDisplayRule> {
    return this.http.put<EmergencyAlertDisplayRule>(`${this.baseUrl}/Update`, rule);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
