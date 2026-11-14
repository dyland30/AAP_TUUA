import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdCampaignItem } from '../models';

@Injectable({ providedIn: 'root' })
export class AdCampaignItemService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AdCampaignItem`;

  getAll(): Observable<AdCampaignItem[]> {
    return this.http.get<AdCampaignItem[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<AdCampaignItem | null> {
    return this.http.get<AdCampaignItem | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAdCampaignId(adCampaignId: string): Observable<AdCampaignItem[]> {
    return this.http.get<AdCampaignItem[]>(`${this.baseUrl}/GetByAdCampaignId/${adCampaignId}`);
  }

  add(item: AdCampaignItem): Observable<AdCampaignItem> {
    return this.http.post<AdCampaignItem>(`${this.baseUrl}/Add`, item);
  }

  update(item: AdCampaignItem): Observable<AdCampaignItem> {
    return this.http.put<AdCampaignItem>(`${this.baseUrl}/Update`, item);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
