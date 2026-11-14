import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VideoWall } from '../models';

@Injectable({ providedIn: 'root' })
export class VideoWallService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/VideoWall`;

  getAll(): Observable<VideoWall[]> {
    return this.http.get<VideoWall[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<VideoWall | null> {
    return this.http.get<VideoWall | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<VideoWall[]> {
    return this.http.get<VideoWall[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(wall: VideoWall): Observable<VideoWall> {
    return this.http.post<VideoWall>(`${this.baseUrl}/Add`, wall);
  }

  update(wall: VideoWall): Observable<VideoWall> {
    return this.http.put<VideoWall>(`${this.baseUrl}/Update`, wall);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
