import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FlightImportRow } from '../models';

@Injectable({ providedIn: 'root' })
export class FlightImportRowService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/FlightImportRow`;

  getAll(): Observable<FlightImportRow[]> {
    return this.http.get<FlightImportRow[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<FlightImportRow | null> {
    return this.http.get<FlightImportRow | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByFlightImportBatchId(flightImportBatchId: string): Observable<FlightImportRow[]> {
    return this.http.get<FlightImportRow[]>(
      `${this.baseUrl}/GetByFlightImportBatchId/${flightImportBatchId}`,
    );
  }

  add(row: FlightImportRow): Observable<FlightImportRow> {
    return this.http.post<FlightImportRow>(`${this.baseUrl}/Add`, row);
  }

  update(row: FlightImportRow): Observable<FlightImportRow> {
    return this.http.put<FlightImportRow>(`${this.baseUrl}/Update`, row);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
