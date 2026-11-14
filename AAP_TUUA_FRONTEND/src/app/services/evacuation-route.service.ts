import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EvacuationRoute } from '../models';

@Injectable({ providedIn: 'root' })
export class EvacuationRouteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/EvacuationRoute`;

  getAll(): Observable<EvacuationRoute[]> {
    return this.http.get<EvacuationRoute[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<EvacuationRoute | null> {
    return this.http.get<EvacuationRoute | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportSectorId(airportSectorId: string): Observable<EvacuationRoute[]> {
    return this.http.get<EvacuationRoute[]>(
      `${this.baseUrl}/GetByAirportSectorId/${airportSectorId}`,
    );
  }

  add(route: EvacuationRoute): Observable<EvacuationRoute> {
    return this.http.post<EvacuationRoute>(`${this.baseUrl}/Add`, route);
  }

  update(route: EvacuationRoute): Observable<EvacuationRoute> {
    return this.http.put<EvacuationRoute>(`${this.baseUrl}/Update`, route);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
