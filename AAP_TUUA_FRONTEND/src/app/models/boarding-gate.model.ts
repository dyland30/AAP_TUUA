export interface BoardingGate {
  resource_id: string | null;
  boarding_type_id: number | null;
  default_stand_id: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
