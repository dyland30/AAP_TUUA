export interface OperationalAlert {
  id: string | null;
  airport_id: string;
  flight_id: string;
  alert_type_id: number;
  threshold_value: string | null;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
  notified_to: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  propagated_at: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
