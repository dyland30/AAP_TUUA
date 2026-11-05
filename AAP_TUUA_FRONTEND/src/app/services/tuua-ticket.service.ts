import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TuuaTicket } from '../models';

@Injectable({ providedIn: 'root' })
export class TuuaTicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/TuuaTicket`;

  getById(id: string): Observable<TuuaTicket | null> {
    return this.http.get<TuuaTicket | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getBySalesOperationId(tuuaSalesOperationId: string): Observable<TuuaTicket[]> {
    return this.http.get<TuuaTicket[]>(`${this.baseUrl}/GetBySalesOperationId/${tuuaSalesOperationId}`);
  }

  getByDocumentSequentialNumbersId(documentSequentialNumbersId: string): Observable<TuuaTicket[]> {
    return this.http.get<TuuaTicket[]>(
      `${this.baseUrl}/GetByDocumentSequentialNumbersId/${documentSequentialNumbersId}`,
    );
  }

  getBySerialAndSequentialNumber(
    serial: string,
    sequentialNumber: number,
  ): Observable<TuuaTicket | null> {
    const params = new HttpParams()
      .set('serial', serial)
      .set('sequentialNumber', sequentialNumber);
    return this.http.get<TuuaTicket | null>(`${this.baseUrl}/GetBySerialAndSequentialNumber`, {
      params,
    });
  }

  add(ticket: TuuaTicket): Observable<TuuaTicket> {
    return this.http.post<TuuaTicket>(`${this.baseUrl}/Add`, ticket);
  }

  update(ticket: TuuaTicket): Observable<TuuaTicket> {
    return this.http.put<TuuaTicket>(`${this.baseUrl}/Update`, ticket);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
