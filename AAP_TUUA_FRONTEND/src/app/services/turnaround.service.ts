import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Turnaround } from '../models';

@Injectable({ providedIn: 'root' })
export class TurnaroundService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Turnaround`;

  getAll(): Observable<Turnaround[]> {
    return this.http.get<Turnaround[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Turnaround | null> {
    return this.http.get<Turnaround | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByArrivalFlightId(arrivalFlightId: string): Observable<Turnaround[]> {
    return this.http.get<Turnaround[]>(`${this.baseUrl}/GetByArrivalFlightId/${arrivalFlightId}`);
  }

  getByDepartureFlightId(departureFlightId: string): Observable<Turnaround[]> {
    return this.http.get<Turnaround[]>(
      `${this.baseUrl}/GetByDepartureFlightId/${departureFlightId}`,
    );
  }

  add(turnaround: Turnaround): Observable<Turnaround> {
    return this.http.post<Turnaround>(`${this.baseUrl}/Add`, turnaround);
  }

  update(turnaround: Turnaround): Observable<Turnaround> {
    return this.http.put<Turnaround>(`${this.baseUrl}/Update`, turnaround);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
