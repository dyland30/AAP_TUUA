import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TuuaGateUnlockKey } from '../models';

@Injectable({ providedIn: 'root' })
export class TuuaGateUnlockKeyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/TuuaGateUnlockKey`;

  getAll(): Observable<TuuaGateUnlockKey[]> {
    return this.http.get<TuuaGateUnlockKey[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<TuuaGateUnlockKey | null> {
    return this.http.get<TuuaGateUnlockKey | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByUserId(userId: string): Observable<TuuaGateUnlockKey[]> {
    return this.http.get<TuuaGateUnlockKey[]>(`${this.baseUrl}/GetByUserId/${userId}`);
  }

  // PDF de la llave con su código en QR.
  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/Pdf/${id}`, { responseType: 'blob' });
  }

  add(key: TuuaGateUnlockKey): Observable<TuuaGateUnlockKey> {
    return this.http.post<TuuaGateUnlockKey>(`${this.baseUrl}/Add`, key);
  }

  update(key: TuuaGateUnlockKey): Observable<TuuaGateUnlockKey> {
    return this.http.put<TuuaGateUnlockKey>(`${this.baseUrl}/Update`, key);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
