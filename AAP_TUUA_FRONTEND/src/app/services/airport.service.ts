import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Airport } from '../models';

@Injectable({ providedIn: 'root' })
export class AirportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Airport`;

  getAll(): Observable<Airport[]> {
    return this.http.get<Airport[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Airport | null> {
    return this.http.get<Airport | null>(`${this.baseUrl}/GetById/${id}`);
  }

  add(airport: Airport): Observable<Airport> {
    return this.http.post<Airport>(`${this.baseUrl}/Add`, airport);
  }

  update(airport: Airport): Observable<Airport> {
    return this.http.put<Airport>(`${this.baseUrl}/Update`, airport);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
