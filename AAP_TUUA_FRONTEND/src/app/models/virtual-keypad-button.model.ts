export interface VirtualKeypadButton {
  id: string | null;
  airport_id: string | null;
  airline_id: string | null;
  target_status_id: number;
  label_es: string;
  label_en: string | null;
  color: string | null;
  sort_order: number;
  requires_confirmation: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
