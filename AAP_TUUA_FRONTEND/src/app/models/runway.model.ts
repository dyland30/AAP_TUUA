export interface Runway {
  id: string | null;
  airport_id: string | null;
  designator: string;
  length_m: number | null;
  width_m: number | null;
  surface: string | null;
  status_id: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
