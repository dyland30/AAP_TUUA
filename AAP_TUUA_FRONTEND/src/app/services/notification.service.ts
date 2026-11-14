import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Notification`;

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Notification | null> {
    return this.http.get<Notification | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getBySystemEventLogId(systemEventLogId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(
      `${this.baseUrl}/GetBySystemEventLogId/${systemEventLogId}`,
    );
  }

  add(notification: Notification): Observable<Notification> {
    return this.http.post<Notification>(`${this.baseUrl}/Add`, notification);
  }

  update(notification: Notification): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/Update`, notification);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
