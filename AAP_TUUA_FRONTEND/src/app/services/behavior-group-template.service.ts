import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BehaviorGroupTemplate } from '../models';

@Injectable({ providedIn: 'root' })
export class BehaviorGroupTemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/BehaviorGroupTemplate`;

  getAll(): Observable<BehaviorGroupTemplate[]> {
    return this.http.get<BehaviorGroupTemplate[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<BehaviorGroupTemplate | null> {
    return this.http.get<BehaviorGroupTemplate | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByBehaviorGroupId(behaviorGroupId: string): Observable<BehaviorGroupTemplate[]> {
    return this.http.get<BehaviorGroupTemplate[]>(
      `${this.baseUrl}/GetByBehaviorGroupId/${behaviorGroupId}`,
    );
  }

  add(template: BehaviorGroupTemplate): Observable<BehaviorGroupTemplate> {
    return this.http.post<BehaviorGroupTemplate>(`${this.baseUrl}/Add`, template);
  }

  update(template: BehaviorGroupTemplate): Observable<BehaviorGroupTemplate> {
    return this.http.put<BehaviorGroupTemplate>(`${this.baseUrl}/Update`, template);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
