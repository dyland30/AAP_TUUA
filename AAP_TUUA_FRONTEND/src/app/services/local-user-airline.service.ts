import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocalUserAirline } from '../models';

@Injectable({ providedIn: 'root' })
export class LocalUserAirlineService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/LocalUserAirline`;

  getAll(): Observable<LocalUserAirline[]> {
    return this.http.get<LocalUserAirline[]>(`${this.baseUrl}/GetAll`);
  }

  getById(localUserId: string, airlineId: string): Observable<LocalUserAirline | null> {
    return this.http.get<LocalUserAirline | null>(
      `${this.baseUrl}/GetById/${localUserId}/${airlineId}`,
    );
  }

  getByLocalUserId(localUserId: string): Observable<LocalUserAirline[]> {
    return this.http.get<LocalUserAirline[]>(`${this.baseUrl}/GetByLocalUserId/${localUserId}`);
  }

  add(assignment: LocalUserAirline): Observable<LocalUserAirline> {
    return this.http.post<LocalUserAirline>(`${this.baseUrl}/Add`, assignment);
  }

  update(assignment: LocalUserAirline): Observable<LocalUserAirline> {
    return this.http.put<LocalUserAirline>(`${this.baseUrl}/Update`, assignment);
  }

  delete(localUserId: string, airlineId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${localUserId}/${airlineId}`);
  }
}
