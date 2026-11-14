import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BehaviorGroupRule } from '../models';

@Injectable({ providedIn: 'root' })
export class BehaviorGroupRuleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/BehaviorGroupRule`;

  getAll(): Observable<BehaviorGroupRule[]> {
    return this.http.get<BehaviorGroupRule[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<BehaviorGroupRule | null> {
    return this.http.get<BehaviorGroupRule | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByBehaviorGroupId(behaviorGroupId: string): Observable<BehaviorGroupRule[]> {
    return this.http.get<BehaviorGroupRule[]>(
      `${this.baseUrl}/GetByBehaviorGroupId/${behaviorGroupId}`,
    );
  }

  add(rule: BehaviorGroupRule): Observable<BehaviorGroupRule> {
    return this.http.post<BehaviorGroupRule>(`${this.baseUrl}/Add`, rule);
  }

  update(rule: BehaviorGroupRule): Observable<BehaviorGroupRule> {
    return this.http.put<BehaviorGroupRule>(`${this.baseUrl}/Update`, rule);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
