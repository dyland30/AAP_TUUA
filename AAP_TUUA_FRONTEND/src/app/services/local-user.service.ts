import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocalUser, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class LocalUserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/LocalUser`;

  getAll(): Observable<LocalUser[]> {
    return this.http.get<LocalUser[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<LocalUser> {
    return this.http.get<LocalUser>(`${this.baseUrl}/GetById/${id}`);
  }

  add(localUser: LocalUser): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Add`, localUser);
  }

  update(localUser: LocalUser): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Update`, localUser);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }

  addUserRole(userRole: UserRole): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/AddUserRole`, userRole);
  }

  getUsersByRoleId(roleId: string): Observable<LocalUser[]> {
    return this.http.get<LocalUser[]>(`${this.baseUrl}/GetUsersByRoleId/${roleId}`);
  }

  getUsersByPermissionAndResource(
    permissionName: string,
    resourcePath: string,
  ): Observable<LocalUser[]> {
    return this.http.get<LocalUser[]>(
      `${this.baseUrl}/GetUsersByPermissionAndResource/${permissionName}/${resourcePath}`,
    );
  }
}
