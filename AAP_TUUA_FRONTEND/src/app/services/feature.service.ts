import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Feature, FeatureGroup } from '../models';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Feature`;

  getAllFeatureGroups(): Observable<FeatureGroup[]> {
    return this.http.get<FeatureGroup[]>(`${this.baseUrl}/GetAllFeatureGroups`);
  }

  getFeaturesByGroup(groupId: number): Observable<Feature[]> {
    return this.http.get<Feature[]>(`${this.baseUrl}/GetFeaturesByGroup/${groupId}`);
  }

  addFeatureGroup(featureGroup: FeatureGroup): Observable<FeatureGroup> {
    return this.http.post<FeatureGroup>(`${this.baseUrl}/AddFeatureGroup`, featureGroup);
  }

  updateFeatureGroup(featureGroup: FeatureGroup): Observable<FeatureGroup> {
    return this.http.put<FeatureGroup>(`${this.baseUrl}/UpdateFeatureGroup`, featureGroup);
  }

  addFeature(feature: Feature): Observable<Feature> {
    return this.http.post<Feature>(`${this.baseUrl}/AddFeature`, feature);
  }

  updateFeature(feature: Feature): Observable<Feature> {
    return this.http.put<Feature>(`${this.baseUrl}/UpdateFeature`, feature);
  }
}
