import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdCampaignBehaviorGroup } from '../models';

@Injectable({ providedIn: 'root' })
export class AdCampaignBehaviorGroupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AdCampaignBehaviorGroup`;

  getAll(): Observable<AdCampaignBehaviorGroup[]> {
    return this.http.get<AdCampaignBehaviorGroup[]>(`${this.baseUrl}/GetAll`);
  }

  getById(
    adCampaignId: string,
    behaviorGroupId: string,
  ): Observable<AdCampaignBehaviorGroup | null> {
    return this.http.get<AdCampaignBehaviorGroup | null>(
      `${this.baseUrl}/GetById/${adCampaignId}/${behaviorGroupId}`,
    );
  }

  getByAdCampaignId(adCampaignId: string): Observable<AdCampaignBehaviorGroup[]> {
    return this.http.get<AdCampaignBehaviorGroup[]>(
      `${this.baseUrl}/GetByAdCampaignId/${adCampaignId}`,
    );
  }

  add(assignment: AdCampaignBehaviorGroup): Observable<AdCampaignBehaviorGroup> {
    return this.http.post<AdCampaignBehaviorGroup>(`${this.baseUrl}/Add`, assignment);
  }

  update(assignment: AdCampaignBehaviorGroup): Observable<AdCampaignBehaviorGroup> {
    return this.http.put<AdCampaignBehaviorGroup>(`${this.baseUrl}/Update`, assignment);
  }

  delete(adCampaignId: string, behaviorGroupId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${adCampaignId}/${behaviorGroupId}`);
  }
}
