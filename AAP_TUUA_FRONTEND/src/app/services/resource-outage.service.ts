import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResourceOutage } from '../models';

@Injectable({ providedIn: 'root' })
export class ResourceOutageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ResourceOutage`;

  getAll(): Observable<ResourceOutage[]> {
    return this.http.get<ResourceOutage[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<ResourceOutage | null> {
    return this.http.get<ResourceOutage | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByResourceId(resourceId: string): Observable<ResourceOutage[]> {
    return this.http.get<ResourceOutage[]>(`${this.baseUrl}/GetByResourceId/${resourceId}`);
  }

  getActiveByResourceId(resourceId: string, date: string): Observable<ResourceOutage[]> {
    const params = new HttpParams().set('resourceId', resourceId).set('date', date);
    return this.http.get<ResourceOutage[]>(`${this.baseUrl}/GetActiveByResourceId`, { params });
  }

  add(outage: ResourceOutage): Observable<ResourceOutage> {
    return this.http.post<ResourceOutage>(`${this.baseUrl}/Add`, outage);
  }

  update(outage: ResourceOutage): Observable<ResourceOutage> {
    return this.http.put<ResourceOutage>(`${this.baseUrl}/Update`, outage);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
