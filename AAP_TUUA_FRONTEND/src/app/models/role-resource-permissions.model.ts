export interface RoleResourcePermissions {
  role_id: string | null;
  resource_id: string | null;
  permission_id: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
  permission_name: string | null;
  resource_name: string | null;
  role_name: string | null;
}
