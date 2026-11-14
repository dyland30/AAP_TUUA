import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotificationRecipient } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationRecipientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/NotificationRecipient`;

  getAll(): Observable<NotificationRecipient[]> {
    return this.http.get<NotificationRecipient[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<NotificationRecipient | null> {
    return this.http.get<NotificationRecipient | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<NotificationRecipient[]> {
    return this.http.get<NotificationRecipient[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(recipient: NotificationRecipient): Observable<NotificationRecipient> {
    return this.http.post<NotificationRecipient>(`${this.baseUrl}/Add`, recipient);
  }

  update(recipient: NotificationRecipient): Observable<NotificationRecipient> {
    return this.http.put<NotificationRecipient>(`${this.baseUrl}/Update`, recipient);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
