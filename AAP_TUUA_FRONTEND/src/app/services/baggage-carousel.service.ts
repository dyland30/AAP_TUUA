import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaggageCarousel } from '../models';

@Injectable({ providedIn: 'root' })
export class BaggageCarouselService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/BaggageCarousel`;

  getAll(): Observable<BaggageCarousel[]> {
    return this.http.get<BaggageCarousel[]>(`${this.baseUrl}/GetAll`);
  }

  getById(resourceId: string): Observable<BaggageCarousel | null> {
    return this.http.get<BaggageCarousel | null>(`${this.baseUrl}/GetById/${resourceId}`);
  }

  getByTerminalId(terminalId: string): Observable<BaggageCarousel[]> {
    return this.http.get<BaggageCarousel[]>(`${this.baseUrl}/GetByTerminalId/${terminalId}`);
  }

  add(carousel: BaggageCarousel): Observable<BaggageCarousel> {
    return this.http.post<BaggageCarousel>(`${this.baseUrl}/Add`, carousel);
  }

  update(carousel: BaggageCarousel): Observable<BaggageCarousel> {
    return this.http.put<BaggageCarousel>(`${this.baseUrl}/Update`, carousel);
  }

  delete(resourceId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${resourceId}`);
  }
}
