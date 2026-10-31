import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Flight } from '../models';

export interface FlightScheduleQuery {
  airportId: string;
  scheduleDate: string;
}

@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Flight`;

  getAll(): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Flight | null> {
    return this.http.get<Flight | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  getByScheduleDate(query: FlightScheduleQuery): Observable<Flight[]> {
    const params = new HttpParams()
      .set('airportId', query.airportId)
      .set('scheduleDate', query.scheduleDate);
    return this.http.get<Flight[]>(`${this.baseUrl}/GetByScheduleDate`, { params });
  }

  getByAirlineId(airlineId: string): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.baseUrl}/GetByAirlineId/${airlineId}`);
  }

  getByStatusId(statusId: number): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.baseUrl}/GetByStatusId/${statusId}`);
  }

  add(flight: Flight): Observable<Flight> {
    return this.http.post<Flight>(`${this.baseUrl}/Add`, flight);
  }

  update(flight: Flight): Observable<Flight> {
    return this.http.put<Flight>(`${this.baseUrl}/Update`, flight);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
