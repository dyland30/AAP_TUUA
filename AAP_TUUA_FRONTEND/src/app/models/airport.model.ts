export interface Airport {
  id: string | null;
  iata_code: string | null;
  oaci_code: string | null;
  name: string | null;
  city: string | null;
  region: string | null;
  country_code: string | null;
  ubigeo: string | null;
  latitude: number | null;
  longitude: number | null;
  elevation_m: number | null;
  elevation_f: number | null;
  timezone: string | null;
  airport_type: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
