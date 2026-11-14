import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AirportSector } from '../models';

@Injectable({ providedIn: 'root' })
export class AirportSectorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AirportSector`;

  getAll(): Observable<AirportSector[]> {
    return this.http.get<AirportSector[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<AirportSector | null> {
    return this.http.get<AirportSector | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<AirportSector[]> {
    return this.http.get<AirportSector[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(sector: AirportSector): Observable<AirportSector> {
    return this.http.post<AirportSector>(`${this.baseUrl}/Add`, sector);
  }

  update(sector: AirportSector): Observable<AirportSector> {
    return this.http.put<AirportSector>(`${this.baseUrl}/Update`, sector);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
