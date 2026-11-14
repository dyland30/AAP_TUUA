import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DisplayTemplateField } from '../models';

@Injectable({ providedIn: 'root' })
export class DisplayTemplateFieldService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/DisplayTemplateField`;

  getAll(): Observable<DisplayTemplateField[]> {
    return this.http.get<DisplayTemplateField[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<DisplayTemplateField | null> {
    return this.http.get<DisplayTemplateField | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByDisplayTemplateVersionId(
    displayTemplateVersionId: string,
  ): Observable<DisplayTemplateField[]> {
    return this.http.get<DisplayTemplateField[]>(
      `${this.baseUrl}/GetByDisplayTemplateVersionId/${displayTemplateVersionId}`,
    );
  }

  add(field: DisplayTemplateField): Observable<DisplayTemplateField> {
    return this.http.post<DisplayTemplateField>(`${this.baseUrl}/Add`, field);
  }

  update(field: DisplayTemplateField): Observable<DisplayTemplateField> {
    return this.http.put<DisplayTemplateField>(`${this.baseUrl}/Update`, field);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
