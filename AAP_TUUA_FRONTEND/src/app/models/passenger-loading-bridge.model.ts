export interface PassengerLoadingBridge {
  resource_id: string | null;
  boarding_gate_id: string | null;
  stand_id: string | null;
  bridge_type_id: number | null;
  door_position: string | null;
  max_aircraft_size_id: number | null;
  min_sill_height_m: number | null;
  max_sill_height_m: number | null;
  has_pca: boolean;
  has_gpu_400hz: boolean;
  manufacturer: string | null;
  serial_number: string | null;
}
