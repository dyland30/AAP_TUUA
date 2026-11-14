export interface FlightStatusHistory {
  id: string | null;
  flight_id: string;
  previous_status_id: number | null;
  new_status_id: number;
  source_id: number | null;
  integration_message_id: string | null;
  changed_at: string;
  changed_by: string | null;
  estimated_time: string | null;
  actual_time: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
