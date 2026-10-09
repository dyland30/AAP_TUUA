export interface Feature {
  id: number;
  description: string | null;
  abbreviation: string | null;
  feature_value: string | null;
  is_active: boolean;
  parent_id: number | null;
  feature_group_id: number;
  created_by: string | null;
  modified_by: string | null;
  created_date: string | null;
  modified_date: string | null;
}
