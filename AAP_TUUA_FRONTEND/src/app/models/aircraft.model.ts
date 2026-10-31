export interface Aircraft {
  id: string | null;
  registration: string;
  aircraft_type_id: string | null;
  operator_id: string | null;
  seat_count: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
