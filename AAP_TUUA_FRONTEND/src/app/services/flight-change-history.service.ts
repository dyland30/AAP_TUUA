import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FlightChangeHistory } from '../models';

@Injectable({ providedIn: 'root' })
export class FlightChangeHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/FlightChangeHistory`;

  getAll(): Observable<FlightChangeHistory[]> {
    return this.http.get<FlightChangeHistory[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<FlightChangeHistory | null> {
    return this.http.get<FlightChangeHistory | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByFlightId(flightId: string): Observable<FlightChangeHistory[]> {
    return this.http.get<FlightChangeHistory[]>(`${this.baseUrl}/GetByFlightId/${flightId}`);
  }

  add(history: FlightChangeHistory): Observable<FlightChangeHistory> {
    return this.http.post<FlightChangeHistory>(`${this.baseUrl}/Add`, history);
  }
}
