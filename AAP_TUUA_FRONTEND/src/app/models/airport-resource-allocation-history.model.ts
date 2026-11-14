export interface AirportResourceAllocationHistory {
  id: string | null;
  airport_resource_allocation_id: string;
  airport_resource_id: string;
  flight_id: string | null;
  airline_id: string | null;
  action_id: number;
  previous_resource_id: string | null;
  action_at: string;
  action_by: string | null;
  source_id: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
