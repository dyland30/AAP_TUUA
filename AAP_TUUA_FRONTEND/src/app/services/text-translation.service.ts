import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TextTranslation } from '../models';

@Injectable({ providedIn: 'root' })
export class TextTranslationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/TextTranslation`;

  getAll(): Observable<TextTranslation[]> {
    return this.http.get<TextTranslation[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<TextTranslation | null> {
    return this.http.get<TextTranslation | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<TextTranslation[]> {
    return this.http.get<TextTranslation[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(translation: TextTranslation): Observable<TextTranslation> {
    return this.http.post<TextTranslation>(`${this.baseUrl}/Add`, translation);
  }

  update(translation: TextTranslation): Observable<TextTranslation> {
    return this.http.put<TextTranslation>(`${this.baseUrl}/Update`, translation);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
