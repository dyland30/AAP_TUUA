import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BehaviorGroup } from '../models';

@Injectable({ providedIn: 'root' })
export class BehaviorGroupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/BehaviorGroup`;

  getAll(): Observable<BehaviorGroup[]> {
    return this.http.get<BehaviorGroup[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<BehaviorGroup | null> {
    return this.http.get<BehaviorGroup | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<BehaviorGroup[]> {
    return this.http.get<BehaviorGroup[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(group: BehaviorGroup): Observable<BehaviorGroup> {
    return this.http.post<BehaviorGroup>(`${this.baseUrl}/Add`, group);
  }

  update(group: BehaviorGroup): Observable<BehaviorGroup> {
    return this.http.put<BehaviorGroup>(`${this.baseUrl}/Update`, group);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
