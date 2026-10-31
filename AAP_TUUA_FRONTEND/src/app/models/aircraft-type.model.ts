export interface AircraftType {
  id: string | null;
  icao_code: string;
  iata_code: string | null;
  manufacturer_id: number | null;
  model: string;
  size_code_id: number | null;
  wingspan_m: number | null;
  length_m: number | null;
  max_seats: number | null;
  is_widebody: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
