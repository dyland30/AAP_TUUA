import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Company } from '../models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Company`;

  getAll(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Company | null> {
    return this.http.get<Company | null>(`${this.baseUrl}/GetById/${id}`);
  }

  add(company: Company): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/Add`, company);
  }

  update(company: Company): Observable<Company> {
    return this.http.put<Company>(`${this.baseUrl}/Update`, company);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
