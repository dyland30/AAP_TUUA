export interface NotificationRecipient {
  id: string | null;
  airport_id: string | null;
  event_type_id: number;
  channel_id: number;
  local_user_id: string | null;
  recipient_address: string;
  min_level_id: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
