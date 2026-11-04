import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TuuaPayload, TuuaResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class TuuaAccessService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/TuuaAccess`;

  /**
   * Procesa un acceso TUUA. El backend responde HTTP 200 incluso ante errores de negocio;
   * el resultado se debe leer desde `response` / `color` / `message`.
   */
  processTuuaAccess(payload: TuuaPayload): Observable<TuuaResponse> {
    return this.http.post<TuuaResponse>(`${this.baseUrl}/ProcessTuuaAccess`, payload);
  }
}
