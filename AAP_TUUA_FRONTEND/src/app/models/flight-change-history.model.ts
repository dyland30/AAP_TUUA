export interface FlightChangeHistory {
  id: string | null;
  flight_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  source_id: number | null;
  integration_message_id: string | null;
  was_rejected_by_lock: boolean;
  changed_at: string;
  changed_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
