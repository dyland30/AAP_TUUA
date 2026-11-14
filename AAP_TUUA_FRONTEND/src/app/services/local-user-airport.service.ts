import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocalUserAirport } from '../models';

@Injectable({ providedIn: 'root' })
export class LocalUserAirportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/LocalUserAirport`;

  getAll(): Observable<LocalUserAirport[]> {
    return this.http.get<LocalUserAirport[]>(`${this.baseUrl}/GetAll`);
  }

  getById(localUserId: string, airportId: string): Observable<LocalUserAirport | null> {
    return this.http.get<LocalUserAirport | null>(
      `${this.baseUrl}/GetById/${localUserId}/${airportId}`,
    );
  }

  getByLocalUserId(localUserId: string): Observable<LocalUserAirport[]> {
    return this.http.get<LocalUserAirport[]>(`${this.baseUrl}/GetByLocalUserId/${localUserId}`);
  }

  add(assignment: LocalUserAirport): Observable<LocalUserAirport> {
    return this.http.post<LocalUserAirport>(`${this.baseUrl}/Add`, assignment);
  }

  update(assignment: LocalUserAirport): Observable<LocalUserAirport> {
    return this.http.put<LocalUserAirport>(`${this.baseUrl}/Update`, assignment);
  }

  delete(localUserId: string, airportId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${localUserId}/${airportId}`);
  }
}
