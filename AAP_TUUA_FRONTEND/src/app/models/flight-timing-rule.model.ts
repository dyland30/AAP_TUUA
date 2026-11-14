export interface FlightTimingRule {
  id: string | null;
  airport_id: string;
  terminal_id: string | null;
  airport_sector_id: string | null;
  event_type_id: number;
  reference_time_id: number;
  flight_direction_id: number | null;
  flight_type_id: number | null;
  airline_id: string | null;
  destination_airport_id: string | null;
  resource_type_id: number | null;
  offset_minutes: number;
  priority: number;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
