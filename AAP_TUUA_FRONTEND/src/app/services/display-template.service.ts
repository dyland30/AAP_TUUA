import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DisplayTemplate } from '../models';

@Injectable({ providedIn: 'root' })
export class DisplayTemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/DisplayTemplate`;

  getAll(): Observable<DisplayTemplate[]> {
    return this.http.get<DisplayTemplate[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<DisplayTemplate | null> {
    return this.http.get<DisplayTemplate | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<DisplayTemplate[]> {
    return this.http.get<DisplayTemplate[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(template: DisplayTemplate): Observable<DisplayTemplate> {
    return this.http.post<DisplayTemplate>(`${this.baseUrl}/Add`, template);
  }

  update(template: DisplayTemplate): Observable<DisplayTemplate> {
    return this.http.put<DisplayTemplate>(`${this.baseUrl}/Update`, template);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
