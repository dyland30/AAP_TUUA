export interface SystemEventLog {
  id: number;
  airport_id: string | null;
  level_id: number;
  component_id: number;
  event_type_id: number | null;
  message: string;
  details: string | null;
  device_id: string | null;
  integration_channel_id: string | null;
  emergency_alert_id: string | null;
  correlation_id: string | null;
  host_name: string | null;
  occurred_at: string;
  is_notified: boolean;
  created_at: string | null;
  created_by: string | null;
}
