export interface FlightImportBatch {
  id: string | null;
  airport_id: string;
  file_type_id: number;
  status_id: number;
  file_name: string | null;
  file_size_bytes: number | null;
  storage_path: string | null;
  airline_id: string | null;
  date_from: string | null;
  date_to: string | null;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  duplicate_rows: number;
  imported_rows: number;
  is_scheduled: boolean;
  validated_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  error_report_path: string | null;
  observation: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
