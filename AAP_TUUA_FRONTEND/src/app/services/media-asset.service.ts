import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MediaAsset } from '../models';

@Injectable({ providedIn: 'root' })
export class MediaAssetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/MediaAsset`;

  getAll(): Observable<MediaAsset[]> {
    return this.http.get<MediaAsset[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<MediaAsset | null> {
    return this.http.get<MediaAsset | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<MediaAsset[]> {
    return this.http.get<MediaAsset[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(asset: MediaAsset): Observable<MediaAsset> {
    return this.http.post<MediaAsset>(`${this.baseUrl}/Add`, asset);
  }

  update(asset: MediaAsset): Observable<MediaAsset> {
    return this.http.put<MediaAsset>(`${this.baseUrl}/Update`, asset);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
