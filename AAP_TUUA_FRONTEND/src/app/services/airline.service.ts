import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Airline } from '../models';

@Injectable({ providedIn: 'root' })
export class AirlineService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Airline`;

  getAll(): Observable<Airline[]> {
    return this.http.get<Airline[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Airline> {
    return this.http.get<Airline>(`${this.baseUrl}/GetById/${id}`);
  }

  add(airline: Airline): Observable<Airline> {
    return this.http.post<Airline>(`${this.baseUrl}/Add`, airline);
  }

  update(airline: Airline): Observable<Airline> {
    return this.http.put<Airline>(`${this.baseUrl}/Update`, airline);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
