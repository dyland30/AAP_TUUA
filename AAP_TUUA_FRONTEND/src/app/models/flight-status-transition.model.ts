export interface FlightStatusTransition {
  id: string | null;
  from_status_id: number;
  to_status_id: number;
  applies_to_departure: boolean;
  applies_to_arrival: boolean;
  allowed_for_airline: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
