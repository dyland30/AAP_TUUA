export interface AuditLog {
  id: number;
  airport_id: string | null;
  local_user_id: string | null;
  username: string | null;
  action_id: number;
  entity_name: string | null;
  entity_id: string | null;
  description: string | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  user_agent: string | null;
  occurred_at: string;
  created_at: string | null;
  created_by: string | null;
}
