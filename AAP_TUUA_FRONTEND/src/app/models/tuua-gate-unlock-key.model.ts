export interface TuuaGateUnlockKey {
  id: string | null;
  user_id: string;
  code: string | null;
  type_id: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
