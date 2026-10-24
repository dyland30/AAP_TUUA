import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CheckinCounter } from '../models';

@Injectable({ providedIn: 'root' })
export class CheckinCounterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/CheckinCounter`;

  getAll(): Observable<CheckinCounter[]> {
    return this.http.get<CheckinCounter[]>(`${this.baseUrl}/GetAll`);
  }

  getById(resourceId: string): Observable<CheckinCounter | null> {
    return this.http.get<CheckinCounter | null>(`${this.baseUrl}/GetById/${resourceId}`);
  }

  getByTerminalId(terminalId: string): Observable<CheckinCounter[]> {
    return this.http.get<CheckinCounter[]>(`${this.baseUrl}/GetByTerminalId/${terminalId}`);
  }

  add(counter: CheckinCounter): Observable<CheckinCounter> {
    return this.http.post<CheckinCounter>(`${this.baseUrl}/Add`, counter);
  }

  update(counter: CheckinCounter): Observable<CheckinCounter> {
    return this.http.put<CheckinCounter>(`${this.baseUrl}/Update`, counter);
  }

  delete(resourceId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${resourceId}`);
  }
}
