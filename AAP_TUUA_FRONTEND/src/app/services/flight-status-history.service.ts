import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FlightStatusHistory } from '../models';

@Injectable({ providedIn: 'root' })
export class FlightStatusHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/FlightStatusHistory`;

  getAll(): Observable<FlightStatusHistory[]> {
    return this.http.get<FlightStatusHistory[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<FlightStatusHistory | null> {
    return this.http.get<FlightStatusHistory | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByFlightId(flightId: string): Observable<FlightStatusHistory[]> {
    return this.http.get<FlightStatusHistory[]>(`${this.baseUrl}/GetByFlightId/${flightId}`);
  }
}
