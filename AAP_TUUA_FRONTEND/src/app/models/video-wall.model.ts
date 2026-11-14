export interface VideoWall {
  id: string | null;
  airport_id: string;
  terminal_id: string | null;
  airport_sector_id: string | null;
  code: string;
  name: string;
  grid_rows: number;
  grid_columns: number;
  behavior_group_id: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
