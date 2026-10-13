import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DocumentSerialGroup } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentSerialGroupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/DocumentSerialGroup`;

  getAll(): Observable<DocumentSerialGroup[]> {
    return this.http.get<DocumentSerialGroup[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<DocumentSerialGroup | null> {
    return this.http.get<DocumentSerialGroup | null>(`${this.baseUrl}/GetById/${id}`);
  }

  add(group: DocumentSerialGroup): Observable<DocumentSerialGroup> {
    return this.http.post<DocumentSerialGroup>(`${this.baseUrl}/Add`, group);
  }

  update(group: DocumentSerialGroup): Observable<DocumentSerialGroup> {
    return this.http.put<DocumentSerialGroup>(`${this.baseUrl}/Update`, group);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
