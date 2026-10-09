import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, RoleResource, RoleResourcePermissions } from '../models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Role`;

  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/GetById/${id}`);
  }

  add(role: Role): Observable<Role> {
    return this.http.post<Role>(`${this.baseUrl}/Add`, role);
  }

  update(role: Role): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Update`, role);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }

  addRoleResource(roleResource: RoleResource): Observable<RoleResource> {
    return this.http.post<RoleResource>(`${this.baseUrl}/AddRoleResource`, roleResource);
  }

  removeRoleResource(roleResource: RoleResource): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/RemoveRoleResource`, { body: roleResource });
  }

  addRoleResourcePermission(
    roleResourcePermission: RoleResourcePermissions,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/AddRoleResourcePermission`,
      roleResourcePermission,
    );
  }

  removeRoleResourcePermission(
    roleResourcePermission: RoleResourcePermissions,
  ): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/RemoveRoleResourcePermission`, {
      body: roleResourcePermission,
    });
  }

  getPermissionsByRoleIdAndResourceId(
    roleId: string,
    resourceId: string,
  ): Observable<RoleResourcePermissions[]> {
    return this.http.get<RoleResourcePermissions[]>(
      `${this.baseUrl}/GetPermissionsByRoleIdAndResourceId/${roleId}/${resourceId}`,
    );
  }

  getRoleResourcePermissionByIds(
    roleId: string,
    resourceId: string,
    permissionId: number,
  ): Observable<RoleResourcePermissions> {
    return this.http.get<RoleResourcePermissions>(
      `${this.baseUrl}/GetRoleResourcePermissionByIds/${roleId}/${resourceId}/${permissionId}`,
    );
  }
}
