export interface MediaAsset {
  id: string | null;
  airport_id: string | null;
  media_type_id: number;
  name: string;
  storage_path: string | null;
  text_content: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width_px: number | null;
  height_px: number | null;
  duration_seconds: number | null;
  checksum_sha256: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
