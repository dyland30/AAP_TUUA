export interface Stand {
  resource_id: string | null;
  is_contact: boolean;
  max_aircraft_size_type: number | null;
  max_wingspan_m: number | null;
  has_fixed_gpu: boolean;
  has_pca: boolean;
  has_fuel_hydrant: boolean;
}
