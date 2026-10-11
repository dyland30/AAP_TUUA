import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Resource } from '../models';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Resource`;

  getAll(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.baseUrl}/GetAll`);
  }

  getMenu(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.baseUrl}/GetMenu`);
  }

  getById(id: string): Observable<Resource> {
    return this.http.get<Resource>(`${this.baseUrl}/GetById/${id}`);
  }

  add(resource: Resource): Observable<Resource> {
    return this.http.post<Resource>(`${this.baseUrl}/Add`, resource);
  }

  update(resource: Resource): Observable<Resource> {
    return this.http.put<Resource>(`${this.baseUrl}/Update`, resource);
  }
}
