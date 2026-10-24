export interface TuuaPrice {
  id: string | null;
  flight_type_id: number | null;
  location_id: string | null;
  terminal_id: string | null;
  currency_id: number | null;
  price: number;
  date_start: string;
  date_end: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
