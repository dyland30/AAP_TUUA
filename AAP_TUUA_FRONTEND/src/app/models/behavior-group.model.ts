export interface BehaviorGroup {
  id: string | null;
  airport_id: string | null;
  code: string;
  name: string;
  description: string | null;
  standard_number: number | null;
  is_standard: boolean;
  display_type_id: number | null;
  content_type_id: number;
  flight_direction_id: number | null;
  flight_type_id: number | null;
  priority: number;
  is_emergency: boolean;
  page_duration_seconds: number | null;
  rows_per_page: number | null;
  alternate_interval_seconds: number | null;
  max_flights: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
