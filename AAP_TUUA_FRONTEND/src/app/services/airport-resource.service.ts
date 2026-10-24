import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AirportResource } from '../models';

@Injectable({ providedIn: 'root' })
export class AirportResourceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AirportResource`;

  getAll(): Observable<AirportResource[]> {
    return this.http.get<AirportResource[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<AirportResource | null> {
    return this.http.get<AirportResource | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByCode(code: string): Observable<AirportResource | null> {
    return this.http.get<AirportResource | null>(
      `${this.baseUrl}/GetByCode/${encodeURIComponent(code)}`,
    );
  }

  getByTerminalId(terminalId: string): Observable<AirportResource[]> {
    return this.http.get<AirportResource[]>(`${this.baseUrl}/GetByTerminalId/${terminalId}`);
  }

  getByResourceTypeId(resourceTypeId: number): Observable<AirportResource[]> {
    return this.http.get<AirportResource[]>(
      `${this.baseUrl}/GetByResourceTypeId/${resourceTypeId}`,
    );
  }

  add(resource: AirportResource): Observable<AirportResource> {
    return this.http.post<AirportResource>(`${this.baseUrl}/Add`, resource);
  }

  update(resource: AirportResource): Observable<AirportResource> {
    return this.http.put<AirportResource>(`${this.baseUrl}/Update`, resource);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
