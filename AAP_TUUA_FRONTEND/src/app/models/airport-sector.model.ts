export interface AirportSector {
  id: string | null;
  airport_id: string;
  terminal_id: string | null;
  parent_id: string | null;
  code: string;
  name: string;
  level: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
