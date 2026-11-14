export interface DeviceIncident {
  id: string | null;
  device_id: string;
  incident_type_id: number;
  detected_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  error_count: number;
  is_escalated: boolean;
  escalated_at: string | null;
  system_event_log_id: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
