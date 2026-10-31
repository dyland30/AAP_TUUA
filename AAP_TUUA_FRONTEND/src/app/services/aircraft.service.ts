import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Aircraft } from '../models';

@Injectable({ providedIn: 'root' })
export class AircraftService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Aircraft`;

  getAll(): Observable<Aircraft[]> {
    return this.http.get<Aircraft[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Aircraft | null> {
    return this.http.get<Aircraft | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByOperatorId(operatorId: string): Observable<Aircraft[]> {
    return this.http.get<Aircraft[]>(`${this.baseUrl}/GetByOperatorId/${operatorId}`);
  }

  getByAircraftTypeId(aircraftTypeId: string): Observable<Aircraft[]> {
    return this.http.get<Aircraft[]>(`${this.baseUrl}/GetByAircraftTypeId/${aircraftTypeId}`);
  }

  add(aircraft: Aircraft): Observable<Aircraft> {
    return this.http.post<Aircraft>(`${this.baseUrl}/Add`, aircraft);
  }

  update(aircraft: Aircraft): Observable<Aircraft> {
    return this.http.put<Aircraft>(`${this.baseUrl}/Update`, aircraft);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
