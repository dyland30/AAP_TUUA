import { Resource } from './resource.model';
import { RoleResourcePermissions } from './role-resource-permissions.model';

export interface RoleResource {
  role_id: string | null;
  resource_id: string | null;
  created_at: string | null;
  modified_at: string | null;
  created_by: string | null;
  modified_by: string | null;
  permissionsList: RoleResourcePermissions[] | null;
  resource: Resource | null;
}
