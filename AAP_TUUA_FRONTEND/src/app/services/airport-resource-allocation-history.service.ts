import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AirportResourceAllocationHistory } from '../models';

@Injectable({ providedIn: 'root' })
export class AirportResourceAllocationHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AirportResourceAllocationHistory`;

  getAll(): Observable<AirportResourceAllocationHistory[]> {
    return this.http.get<AirportResourceAllocationHistory[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<AirportResourceAllocationHistory | null> {
    return this.http.get<AirportResourceAllocationHistory | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportResourceAllocationId(
    airportResourceAllocationId: string,
  ): Observable<AirportResourceAllocationHistory[]> {
    return this.http.get<AirportResourceAllocationHistory[]>(
      `${this.baseUrl}/GetByAirportResourceAllocationId/${airportResourceAllocationId}`,
    );
  }

  add(history: AirportResourceAllocationHistory): Observable<AirportResourceAllocationHistory> {
    return this.http.post<AirportResourceAllocationHistory>(`${this.baseUrl}/Add`, history);
  }
}
