import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PassengerLoadingBridge } from '../models';

@Injectable({ providedIn: 'root' })
export class PassengerLoadingBridgeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/PassengerLoadingBridge`;

  getAll(): Observable<PassengerLoadingBridge[]> {
    return this.http.get<PassengerLoadingBridge[]>(`${this.baseUrl}/GetAll`);
  }

  getById(resourceId: string): Observable<PassengerLoadingBridge | null> {
    return this.http.get<PassengerLoadingBridge | null>(`${this.baseUrl}/GetById/${resourceId}`);
  }

  getByBoardingGateId(boardingGateId: string): Observable<PassengerLoadingBridge[]> {
    return this.http.get<PassengerLoadingBridge[]>(
      `${this.baseUrl}/GetByBoardingGateId/${boardingGateId}`,
    );
  }

  getByStandId(standId: string): Observable<PassengerLoadingBridge[]> {
    return this.http.get<PassengerLoadingBridge[]>(`${this.baseUrl}/GetByStandId/${standId}`);
  }

  add(bridge: PassengerLoadingBridge): Observable<PassengerLoadingBridge> {
    return this.http.post<PassengerLoadingBridge>(`${this.baseUrl}/Add`, bridge);
  }

  update(bridge: PassengerLoadingBridge): Observable<PassengerLoadingBridge> {
    return this.http.put<PassengerLoadingBridge>(`${this.baseUrl}/Update`, bridge);
  }

  delete(resourceId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${resourceId}`);
  }
}
