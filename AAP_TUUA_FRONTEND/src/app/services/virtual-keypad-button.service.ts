import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VirtualKeypadButton } from '../models';

@Injectable({ providedIn: 'root' })
export class VirtualKeypadButtonService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/VirtualKeypadButton`;

  getAll(): Observable<VirtualKeypadButton[]> {
    return this.http.get<VirtualKeypadButton[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<VirtualKeypadButton | null> {
    return this.http.get<VirtualKeypadButton | null>(`${this.baseUrl}/GetById/${id}`);
  }

  getByAirportId(airportId: string): Observable<VirtualKeypadButton[]> {
    return this.http.get<VirtualKeypadButton[]>(`${this.baseUrl}/GetByAirportId/${airportId}`);
  }

  add(button: VirtualKeypadButton): Observable<VirtualKeypadButton> {
    return this.http.post<VirtualKeypadButton>(`${this.baseUrl}/Add`, button);
  }

  update(button: VirtualKeypadButton): Observable<VirtualKeypadButton> {
    return this.http.put<VirtualKeypadButton>(`${this.baseUrl}/Update`, button);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
