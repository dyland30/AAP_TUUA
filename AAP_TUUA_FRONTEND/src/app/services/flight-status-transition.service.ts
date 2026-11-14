import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FlightStatusTransition } from '../models';

@Injectable({ providedIn: 'root' })
export class FlightStatusTransitionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/FlightStatusTransition`;

  getAll(): Observable<FlightStatusTransition[]> {
    return this.http.get<FlightStatusTransition[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<FlightStatusTransition | null> {
    return this.http.get<FlightStatusTransition | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByFromStatusId(fromStatusId: number): Observable<FlightStatusTransition[]> {
    return this.http.get<FlightStatusTransition[]>(
      `${this.baseUrl}/GetByFromStatusId/${fromStatusId}`,
    );
  }

  add(transition: FlightStatusTransition): Observable<FlightStatusTransition> {
    return this.http.post<FlightStatusTransition>(`${this.baseUrl}/Add`, transition);
  }

  update(transition: FlightStatusTransition): Observable<FlightStatusTransition> {
    return this.http.put<FlightStatusTransition>(`${this.baseUrl}/Update`, transition);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
