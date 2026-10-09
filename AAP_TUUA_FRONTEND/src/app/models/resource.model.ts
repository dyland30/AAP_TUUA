export interface Resource {
  id: string | null;
  name: string | null;
  description: string | null;
  parent_description: string | null;
  type: string | null;
  path: string | null;
  method: string | null;
  parent_id: string | null;
  created_at: string | null;
  modified_at: string | null;
  created_by: string | null;
  modified_by: string | null;
  weight: number | null;
  icon: string | null;
  is_active: boolean | null;
}
