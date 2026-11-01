import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AirportResourceAllocation } from '../models';

@Injectable({ providedIn: 'root' })
export class AirportResourceAllocationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AirportResourceAllocation`;

  getAll(): Observable<AirportResourceAllocation[]> {
    return this.http.get<AirportResourceAllocation[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<AirportResourceAllocation | null> {
    return this.http.get<AirportResourceAllocation | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportResourceId(airportResourceId: string): Observable<AirportResourceAllocation[]> {
    return this.http.get<AirportResourceAllocation[]>(
      `${this.baseUrl}/GetByAirportResourceId/${airportResourceId}`,
    );
  }

  getByFlightId(flightId: string): Observable<AirportResourceAllocation[]> {
    return this.http.get<AirportResourceAllocation[]>(`${this.baseUrl}/GetByFlightId/${flightId}`);
  }

  getByTurnaroundId(turnaroundId: string): Observable<AirportResourceAllocation[]> {
    return this.http.get<AirportResourceAllocation[]>(
      `${this.baseUrl}/GetByTurnaroundId/${turnaroundId}`,
    );
  }

  getByAirlineId(airlineId: string): Observable<AirportResourceAllocation[]> {
    return this.http.get<AirportResourceAllocation[]>(`${this.baseUrl}/GetByAirlineId/${airlineId}`);
  }

  getActiveByAirportResourceId(
    airportResourceId: string,
    date: string,
  ): Observable<AirportResourceAllocation[]> {
    const params = new HttpParams().set('airportResourceId', airportResourceId).set('date', date);
    return this.http.get<AirportResourceAllocation[]>(`${this.baseUrl}/GetActiveByAirportResourceId`, {
      params,
    });
  }

  add(allocation: AirportResourceAllocation): Observable<AirportResourceAllocation> {
    return this.http.post<AirportResourceAllocation>(`${this.baseUrl}/Add`, allocation);
  }

  update(allocation: AirportResourceAllocation): Observable<AirportResourceAllocation> {
    return this.http.put<AirportResourceAllocation>(`${this.baseUrl}/Update`, allocation);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
