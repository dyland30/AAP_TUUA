import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FeatureTranslation } from '../models';

@Injectable({ providedIn: 'root' })
export class FeatureTranslationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/FeatureTranslation`;

  getAll(): Observable<FeatureTranslation[]> {
    return this.http.get<FeatureTranslation[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<FeatureTranslation | null> {
    return this.http.get<FeatureTranslation | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByFeatureId(featureId: number): Observable<FeatureTranslation[]> {
    return this.http.get<FeatureTranslation[]>(`${this.baseUrl}/GetByFeatureId/${featureId}`);
  }

  add(translation: FeatureTranslation): Observable<FeatureTranslation> {
    return this.http.post<FeatureTranslation>(`${this.baseUrl}/Add`, translation);
  }

  update(translation: FeatureTranslation): Observable<FeatureTranslation> {
    return this.http.put<FeatureTranslation>(`${this.baseUrl}/Update`, translation);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
