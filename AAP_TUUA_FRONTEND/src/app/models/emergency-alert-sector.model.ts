export interface EmergencyAlertSector {
  id: string | null;
  emergency_alert_id: string;
  airport_sector_id: string;
  evacuation_route_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
