export interface LocalUserAirport {
  local_user_id: string;
  airport_id: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
