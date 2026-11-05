export interface TuuaTicket {
  id: string | null;
  tuua_sales_operation_id: string | null;
  document_sequential_numbers_id: string;
  tuua_gate_code: string | null;
  serial: string;
  sequential_number: number;
  hash_ticket: string;
  status_id: number;
  price: number;
  subtotal: number;
  total: number;
  igv_tax_amount: number;
  utilization_date: string | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
