export interface DocumentSerialGroup {
  id: string | null;
  document_type_id: number | null;
  seae_type_id: number | null;
  sale_type_id: number | null;
  location_id: string | null;
  terminal_id: string | null;
  serial_prefix: string | null;
  serial_start: number | null;
  serial_end: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
