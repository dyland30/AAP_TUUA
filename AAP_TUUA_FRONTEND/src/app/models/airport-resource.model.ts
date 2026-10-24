export interface AirportResource {
  id: string | null;
  resource_type_id: number | null;
  terminal_id: string | null;
  flight_type_id: number | null;
  status_id: number | null;
  code: string;
  name: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
