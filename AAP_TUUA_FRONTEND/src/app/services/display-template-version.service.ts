import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DisplayTemplateVersion } from '../models';

@Injectable({ providedIn: 'root' })
export class DisplayTemplateVersionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/DisplayTemplateVersion`;

  getAll(): Observable<DisplayTemplateVersion[]> {
    return this.http.get<DisplayTemplateVersion[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<DisplayTemplateVersion | null> {
    return this.http.get<DisplayTemplateVersion | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByDisplayTemplateId(displayTemplateId: string): Observable<DisplayTemplateVersion[]> {
    return this.http.get<DisplayTemplateVersion[]>(
      `${this.baseUrl}/GetByDisplayTemplateId/${displayTemplateId}`,
    );
  }

  add(version: DisplayTemplateVersion): Observable<DisplayTemplateVersion> {
    return this.http.post<DisplayTemplateVersion>(`${this.baseUrl}/Add`, version);
  }

  update(version: DisplayTemplateVersion): Observable<DisplayTemplateVersion> {
    return this.http.put<DisplayTemplateVersion>(`${this.baseUrl}/Update`, version);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
