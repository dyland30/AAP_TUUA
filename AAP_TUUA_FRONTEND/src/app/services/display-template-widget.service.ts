import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DisplayTemplateWidget } from '../models';

@Injectable({ providedIn: 'root' })
export class DisplayTemplateWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/DisplayTemplateWidget`;

  getAll(): Observable<DisplayTemplateWidget[]> {
    return this.http.get<DisplayTemplateWidget[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<DisplayTemplateWidget | null> {
    return this.http.get<DisplayTemplateWidget | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByDisplayTemplateVersionId(
    displayTemplateVersionId: string,
  ): Observable<DisplayTemplateWidget[]> {
    return this.http.get<DisplayTemplateWidget[]>(
      `${this.baseUrl}/GetByDisplayTemplateVersionId/${displayTemplateVersionId}`,
    );
  }

  add(widget: DisplayTemplateWidget): Observable<DisplayTemplateWidget> {
    return this.http.post<DisplayTemplateWidget>(`${this.baseUrl}/Add`, widget);
  }

  update(widget: DisplayTemplateWidget): Observable<DisplayTemplateWidget> {
    return this.http.put<DisplayTemplateWidget>(`${this.baseUrl}/Update`, widget);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
