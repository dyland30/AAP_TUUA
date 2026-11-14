export interface EmergencyAlertDevice {
  id: string | null;
  emergency_alert_id: string;
  device_id: string;
  previous_behavior_group_id: string | null;
  evacuation_route_id: string | null;
  status_id: number;
  sent_at: string | null;
  displayed_at: string | null;
  restored_at: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
