import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Location } from '../models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Location`;

  getAll(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Location | null> {
    return this.http.get<Location | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(location: Location): Observable<Location> {
    return this.http.post<Location>(`${this.baseUrl}/Add`, location);
  }

  update(location: Location): Observable<Location> {
    return this.http.put<Location>(`${this.baseUrl}/Update`, location);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
