import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FlightImportBatch } from '../models';

@Injectable({ providedIn: 'root' })
export class FlightImportBatchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/FlightImportBatch`;

  getAll(): Observable<FlightImportBatch[]> {
    return this.http.get<FlightImportBatch[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<FlightImportBatch | null> {
    return this.http.get<FlightImportBatch | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<FlightImportBatch[]> {
    return this.http.get<FlightImportBatch[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(batch: FlightImportBatch): Observable<FlightImportBatch> {
    return this.http.post<FlightImportBatch>(`${this.baseUrl}/Add`, batch);
  }

  update(batch: FlightImportBatch): Observable<FlightImportBatch> {
    return this.http.put<FlightImportBatch>(`${this.baseUrl}/Update`, batch);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
