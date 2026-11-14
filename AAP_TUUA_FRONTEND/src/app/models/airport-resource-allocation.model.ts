export interface AirportResourceAllocation {
  id: string | null;
  airport_resource_id: string | null;
  flight_id: string | null;
  turnaround_id: string | null;
  airline_id: string | null;
  star_time: string;
  end_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  display_order: number | null;
  is_auto_calculated: boolean;
  display_airline_id: string | null;
  status_id: number | null;
  is_shared: boolean;
  notes: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
