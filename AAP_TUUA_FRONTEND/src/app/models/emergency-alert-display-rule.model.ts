export interface EmergencyAlertDisplayRule {
  id: string | null;
  alert_type_id: number;
  display_type_id: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
