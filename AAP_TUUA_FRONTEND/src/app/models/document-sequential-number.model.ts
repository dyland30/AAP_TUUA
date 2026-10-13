export interface DocumentSequentialNumber {
  id: string | null;
  document_serial_group_id: string | null;
  cashier_code: string | null;
  serial_number: number | null;
  max_sequential_number: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
