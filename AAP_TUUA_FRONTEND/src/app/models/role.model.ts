import { RoleResource } from './role-resource.model';

export interface Role {
  id: string | null;
  name: string | null;
  created_at: string | null;
  modified_at: string | null;
  created_by: string | null;
  modified_by: string | null;
  is_active: boolean | null;
  resources: RoleResource[] | null;
}
