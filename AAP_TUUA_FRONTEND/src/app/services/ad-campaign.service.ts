import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdCampaign } from '../models';

@Injectable({ providedIn: 'root' })
export class AdCampaignService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AdCampaign`;

  getAll(): Observable<AdCampaign[]> {
    return this.http.get<AdCampaign[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<AdCampaign | null> {
    return this.http.get<AdCampaign | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<AdCampaign[]> {
    return this.http.get<AdCampaign[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(campaign: AdCampaign): Observable<AdCampaign> {
    return this.http.post<AdCampaign>(`${this.baseUrl}/Add`, campaign);
  }

  update(campaign: AdCampaign): Observable<AdCampaign> {
    return this.http.put<AdCampaign>(`${this.baseUrl}/Update`, campaign);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
