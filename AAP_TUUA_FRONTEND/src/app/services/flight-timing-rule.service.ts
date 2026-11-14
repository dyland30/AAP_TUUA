import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FlightTimingRule } from '../models';

@Injectable({ providedIn: 'root' })
export class FlightTimingRuleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/FlightTimingRule`;

  getAll(): Observable<FlightTimingRule[]> {
    return this.http.get<FlightTimingRule[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<FlightTimingRule | null> {
    return this.http.get<FlightTimingRule | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<FlightTimingRule[]> {
    return this.http.get<FlightTimingRule[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(rule: FlightTimingRule): Observable<FlightTimingRule> {
    return this.http.post<FlightTimingRule>(`${this.baseUrl}/Add`, rule);
  }

  update(rule: FlightTimingRule): Observable<FlightTimingRule> {
    return this.http.put<FlightTimingRule>(`${this.baseUrl}/Update`, rule);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
