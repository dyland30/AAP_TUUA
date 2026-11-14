export interface EvacuationRoute {
  id: string | null;
  airport_sector_id: string;
  code: string;
  name_es: string;
  name_en: string | null;
  direction_icon: string | null;
  exit_name: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
