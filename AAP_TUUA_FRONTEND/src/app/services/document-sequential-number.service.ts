import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DocumentSequentialNumber } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentSequentialNumberService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/DocumentSequentialNumber`;

  getByGroupId(documentSerialGroupId: string): Observable<DocumentSequentialNumber[]> {
    return this.http.get<DocumentSequentialNumber[]>(`${this.baseUrl}/GetByGroupId/${documentSerialGroupId}`);
  }

  getById(id: string): Observable<DocumentSequentialNumber | null> {
    return this.http.get<DocumentSequentialNumber | null>(`${this.baseUrl}/GetById/${id}`);
  }

  add(number: DocumentSequentialNumber): Observable<DocumentSequentialNumber> {
    return this.http.post<DocumentSequentialNumber>(`${this.baseUrl}/Add`, number);
  }

  update(number: DocumentSequentialNumber): Observable<DocumentSequentialNumber> {
    return this.http.put<DocumentSequentialNumber>(`${this.baseUrl}/Update`, number);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
