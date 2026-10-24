import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Runway } from '../models';

@Injectable({ providedIn: 'root' })
export class RunwayService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Runway`;

  getAll(): Observable<Runway[]> {
    return this.http.get<Runway[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Runway | null> {
    return this.http.get<Runway | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<Runway[]> {
    return this.http.get<Runway[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(runway: Runway): Observable<Runway> {
    return this.http.post<Runway>(`${this.baseUrl}/Add`, runway);
  }

  update(runway: Runway): Observable<Runway> {
    return this.http.put<Runway>(`${this.baseUrl}/Update`, runway);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
