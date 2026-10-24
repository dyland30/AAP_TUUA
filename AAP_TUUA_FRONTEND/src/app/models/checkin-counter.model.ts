export interface CheckinCounter {
  resource_id: string | null;
  terminal_id: string | null;
  island: string;
  counter_type_id: number | null;
  has_baggage_belt: boolean;
  is_common_use: boolean;
}
