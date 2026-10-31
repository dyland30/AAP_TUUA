import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AircraftType } from '../models';

@Injectable({ providedIn: 'root' })
export class AircraftTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AircraftType`;

  getAll(): Observable<AircraftType[]> {
    return this.http.get<AircraftType[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<AircraftType | null> {
    return this.http.get<AircraftType | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByManufacturerId(manufacturerId: number): Observable<AircraftType[]> {
    return this.http.get<AircraftType[]>(`${this.baseUrl}/GetByManufacturerId/${manufacturerId}`);
  }

  getBySizeCodeId(sizeCodeId: number): Observable<AircraftType[]> {
    return this.http.get<AircraftType[]>(`${this.baseUrl}/GetBySizeCodeId/${sizeCodeId}`);
  }

  add(aircraftType: AircraftType): Observable<AircraftType> {
    return this.http.post<AircraftType>(`${this.baseUrl}/Add`, aircraftType);
  }

  update(aircraftType: AircraftType): Observable<AircraftType> {
    return this.http.put<AircraftType>(`${this.baseUrl}/Update`, aircraftType);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
