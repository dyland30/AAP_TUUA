export interface ResourceOutage {
  id: string | null;
  resource_id: string | null;
  start_date: string | null;
  end_date: string | null;
  reason: string;
  is_planned: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
