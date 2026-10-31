import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FlightCodeshare } from '../models';

@Injectable({ providedIn: 'root' })
export class FlightCodeshareService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/FlightCodeshare`;

  getAll(): Observable<FlightCodeshare[]> {
    return this.http.get<FlightCodeshare[]>(`${this.baseUrl}/GetAll`);
  }

  getById(
    flightId: string,
    airlineId: string,
    flightIdentity: string,
  ): Observable<FlightCodeshare | null> {
    return this.http.get<FlightCodeshare | null>(
      `${this.baseUrl}/GetById/${flightId}/${airlineId}/${encodeURIComponent(flightIdentity)}`,
    );
  }

  getByFlightId(flightId: string): Observable<FlightCodeshare[]> {
    return this.http.get<FlightCodeshare[]>(`${this.baseUrl}/GetByFlightId/${flightId}`);
  }

  getByAirlineId(airlineId: string): Observable<FlightCodeshare[]> {
    return this.http.get<FlightCodeshare[]>(`${this.baseUrl}/GetByAirlineId/${airlineId}`);
  }

  add(codeshare: FlightCodeshare): Observable<FlightCodeshare> {
    return this.http.post<FlightCodeshare>(`${this.baseUrl}/Add`, codeshare);
  }

  delete(flightId: string, airlineId: string, flightIdentity: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/Delete/${flightId}/${airlineId}/${encodeURIComponent(flightIdentity)}`,
    );
  }
}
