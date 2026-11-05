import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TuuaSalesOperation } from '../models';

@Injectable({ providedIn: 'root' })
export class TuuaSalesOperationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/TuuaSalesOperation`;

  getAll(): Observable<TuuaSalesOperation[]> {
    return this.http.get<TuuaSalesOperation[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<TuuaSalesOperation | null> {
    return this.http.get<TuuaSalesOperation | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByCashierMachineSessionId(cashierMachineSessionId: string): Observable<TuuaSalesOperation[]> {
    return this.http.get<TuuaSalesOperation[]>(
      `${this.baseUrl}/GetByCashierMachineSessionId/${cashierMachineSessionId}`,
    );
  }

  add(salesOperation: TuuaSalesOperation): Observable<TuuaSalesOperation> {
    return this.http.post<TuuaSalesOperation>(`${this.baseUrl}/Add`, salesOperation);
  }

  update(salesOperation: TuuaSalesOperation): Observable<TuuaSalesOperation> {
    return this.http.put<TuuaSalesOperation>(`${this.baseUrl}/Update`, salesOperation);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
