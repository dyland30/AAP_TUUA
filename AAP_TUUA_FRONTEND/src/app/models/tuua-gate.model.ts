export interface TuuaGate {
  code: string | null;
  ipaddr: string | null;
  description: string | null;
  terminal_id: string | null;
  flight_type_id: number | null;
  tuua_gate_type_id: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
