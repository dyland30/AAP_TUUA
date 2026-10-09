import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, concat, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Feature, Resource, Role, RoleResource, RoleResourcePermissions } from '../models';
import { FeatureService } from '../services/feature.service';
import { ResourceService } from '../services/resource.service';
import { RoleService } from '../services/role.service';
import { PermissionDialog, PermissionDialogData } from './permission-dialog/permission-dialog';

const PERMISSIONS_GROUP_NAME = 'permisos';
const PERMISSIONS_GROUP_FALLBACK_ID = 1;

@Component({
  selector: 'app-assign-resources',
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './assign-resources.html',
  styleUrl: './assign-resources.css',
})
export class AssignResources implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleService);
  private readonly resourceService = inject(ResourceService);
  private readonly featureService = inject(FeatureService);
  private readonly dialog = inject(MatDialog);

  private readonly roleId = this.route.snapshot.paramMap.get('roleId');

  protected readonly role = signal<Role | null>(null);
  protected readonly resources = signal<Resource[]>([]);
  protected readonly permissions = signal<Feature[]>([]);

  protected readonly selectedResourceIds = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly selectedPermissions = signal<ReadonlyMap<string, ReadonlySet<number>>>(
    new Map<string, ReadonlySet<number>>(),
  );

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  private originalResourceIds: Set<string> = new Set<string>();
  private originalPermissions = new Map<string, Set<number>>();

  protected readonly sortedResources = computed(() =>
    [...this.resources()].sort(
      (a, b) => (a.weight ?? 0) - (b.weight ?? 0) || (a.name ?? '').localeCompare(b.name ?? ''),
    ),
  );

  protected readonly selectedCount = computed(() => this.selectedResourceIds().size);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    if (!this.roleId) {
      this.errorMessage.set('No se especificó un rol.');
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    forkJoin({
      role: this.roleService.getById(this.roleId),
      resources: this.resourceService.getAll(),
      groups: this.featureService.getAllFeatureGroups(),
    }).subscribe({
      next: ({ role, resources, groups }) => {
        const group = (groups ?? []).find(
          (item) => (item.name ?? '').trim().toLowerCase() === PERMISSIONS_GROUP_NAME,
        );
        const groupId = group?.id ?? PERMISSIONS_GROUP_FALLBACK_ID;

        this.featureService.getFeaturesByGroup(groupId).subscribe({
          next: (features) => {
            this.role.set(role);
            this.resources.set((resources ?? []).filter((resource) => resource.is_active !== false));
            this.permissions.set((features ?? []).filter((feature) => feature.is_active));
            this.applyInitialState(role);
            this.isLoading.set(false);
          },
          error: (error: HttpErrorResponse) => {
            this.errorMessage.set(this.resolveError(error));
            this.isLoading.set(false);
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.resolveError(error));
        this.isLoading.set(false);
      },
    });
  }

  protected isResourceSelected(resourceId: string | null): boolean {
    return resourceId !== null && this.selectedResourceIds().has(resourceId);
  }

  protected toggleResource(resource: Resource): void {
    const id = resource.id;
    if (!id) {
      return;
    }

    this.clearMessages();
    const next = new Set(this.selectedResourceIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedResourceIds.set(next);
  }

  protected resourcePermissions(resource: Resource): Feature[] {
    const resourceId = resource.id;
    if (!resourceId) {
      return [];
    }
    const selected = this.selectedPermissions().get(resourceId);
    if (!selected || selected.size === 0) {
      return [];
    }
    return this.permissions().filter((permission) => selected.has(permission.id));
  }

  protected openPermissions(resource: Resource): void {
    const id = resource.id;
    if (!id) {
      return;
    }

    if (!this.selectedResourceIds().has(id)) {
      const next = new Set(this.selectedResourceIds());
      next.add(id);
      this.selectedResourceIds.set(next);
    }

    this.clearMessages();

    const selected = this.selectedPermissions().get(id) ?? new Set<number>();
    const data: PermissionDialogData = {
      resourceName: resource.name,
      permissions: this.permissions(),
      selected: [...selected],
    };

    this.dialog
      .open(PermissionDialog, { width: '420px', maxHeight: '80vh', data })
      .afterClosed()
      .subscribe((result: number[] | undefined) => {
        if (!result) {
          return;
        }
        const map = new Map(this.selectedPermissions());
        map.set(id, new Set(result));
        this.selectedPermissions.set(map);
      });
  }

  protected permissionColorClass(permission: Feature): string {
    const description = (permission.description ?? '').trim().toLowerCase();
    const value = (permission.feature_value ?? '').trim().toLowerCase();

    if (description.startsWith('leer') || value === 'r') {
      return 'assign__pill--green';
    }
    if (description.startsWith('modificar') || value === 'm') {
      return 'assign__pill--amber';
    }
    if (description.startsWith('eliminar') || value === 'd') {
      return 'assign__pill--red';
    }
    if (description.startsWith('aprobar') || value === 'a') {
      return 'assign__pill--blue';
    }
    return 'assign__pill--default';
  }

  protected save(): void {
    const role = this.role();
    if (!role?.id || this.isSaving()) {
      return;
    }

    this.clearMessages();

    const roleId = role.id;
    const selected = this.selectedResourceIds();
    const selectedPerms = this.selectedPermissions();

    const removePermissions: Observable<unknown>[] = [];
    const removeResources: Observable<unknown>[] = [];
    const addResources: Observable<unknown>[] = [];
    const addPermissions: Observable<unknown>[] = [];

    const addedResources = [...selected].filter((id) => !this.originalResourceIds.has(id));
    const removedResources = [...this.originalResourceIds].filter((id) => !selected.has(id));

    for (const resourceId of removedResources) {
      for (const permissionId of this.originalPermissions.get(resourceId) ?? []) {
        removePermissions.push(
          this.roleService.removeRoleResourcePermission(
            this.permissionPayload(roleId, resourceId, permissionId),
          ),
        );
      }
      removeResources.push(
        this.roleService.removeRoleResource(this.resourcePayload(roleId, resourceId)),
      );
    }

    for (const resourceId of addedResources) {
      addResources.push(this.roleService.addRoleResource(this.resourcePayload(roleId, resourceId)));
    }

    for (const resourceId of selected) {
      const original = this.originalPermissions.get(resourceId) ?? new Set<number>();
      const current = selectedPerms.get(resourceId) ?? new Set<number>();

      for (const permissionId of original) {
        if (!current.has(permissionId)) {
          removePermissions.push(
            this.roleService.removeRoleResourcePermission(
              this.permissionPayload(roleId, resourceId, permissionId),
            ),
          );
        }
      }

      for (const permissionId of current) {
        if (!original.has(permissionId)) {
          addPermissions.push(
            this.roleService.addRoleResourcePermission(
              this.permissionPayload(roleId, resourceId, permissionId),
            ),
          );
        }
      }
    }

    // Se ejecuta en orden: quitar permisos -> quitar recursos -> agregar recursos -> agregar
    // permisos, para respetar la FK (role_id, resource_id) de role_resource_permission.
    const sequence = [...removePermissions, ...removeResources, ...addResources, ...addPermissions];

    if (sequence.length === 0) {
      this.successMessage.set('No hay cambios por guardar.');
      return;
    }

    this.isSaving.set(true);
    concat(...sequence)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        complete: () => {
          this.successMessage.set('Accesos y permisos actualizados correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected back(): void {
    this.router.navigate(['/roles']);
  }

  private applyInitialState(role: Role): void {
    const resourceIds = new Set<string>();
    const permissions = new Map<string, Set<number>>();

    for (const roleResource of role.resources ?? []) {
      const resourceId = roleResource.resource_id;
      if (!resourceId) {
        continue;
      }

      resourceIds.add(resourceId);
      const permissionIds = new Set<number>();
      for (const permission of roleResource.permissionsList ?? []) {
        if (permission.permission_id !== null && permission.permission_id !== undefined) {
          permissionIds.add(permission.permission_id);
        }
      }
      permissions.set(resourceId, permissionIds);
    }

    this.selectedResourceIds.set(resourceIds);
    this.selectedPermissions.set(permissions);

    this.originalResourceIds = new Set(resourceIds);
    this.originalPermissions = new Map(
      [...permissions].map(([resourceId, ids]) => [resourceId, new Set(ids)]),
    );
  }

  private resourcePayload(roleId: string, resourceId: string): RoleResource {
    return {
      role_id: roleId,
      resource_id: resourceId,
      created_at: null,
      modified_at: null,
      created_by: null,
      modified_by: null,
      permissionsList: null,
      resource: null,
    };
  }

  private permissionPayload(
    roleId: string,
    resourceId: string,
    permissionId: number,
  ): RoleResourcePermissions {
    return {
      role_id: roleId,
      resource_id: resourceId,
      permission_id: permissionId,
      is_active: true,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
      permission_name: null,
      resource_name: null,
      role_name: null,
    };
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
