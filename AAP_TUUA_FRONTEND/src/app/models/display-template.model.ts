export interface DisplayTemplate {
  id: string | null;
  airport_id: string | null;
  code: string;
  name: string;
  description: string | null;
  display_type_id: number;
  orientation_id: number;
  resolution_id: number;
  flight_slots: number | null;
  current_version_id: string | null;
  is_virtual_keypad: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
