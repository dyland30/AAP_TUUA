import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OperationalAlert } from '../models';

@Injectable({ providedIn: 'root' })
export class OperationalAlertService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/OperationalAlert`;

  getAll(): Observable<OperationalAlert[]> {
    return this.http.get<OperationalAlert[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<OperationalAlert | null> {
    return this.http.get<OperationalAlert | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByFlightId(flightId: string): Observable<OperationalAlert[]> {
    return this.http.get<OperationalAlert[]>(`${this.baseUrl}/GetByFlightId/${flightId}`);
  }

  add(alert: OperationalAlert): Observable<OperationalAlert> {
    return this.http.post<OperationalAlert>(`${this.baseUrl}/Add`, alert);
  }

  update(alert: OperationalAlert): Observable<OperationalAlert> {
    return this.http.put<OperationalAlert>(`${this.baseUrl}/Update`, alert);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
