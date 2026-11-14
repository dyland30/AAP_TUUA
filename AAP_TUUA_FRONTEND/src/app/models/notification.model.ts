export interface Notification {
  id: string | null;
  system_event_log_id: number | null;
  notification_recipient_id: string | null;
  channel_id: number;
  recipient_address: string;
  subject: string | null;
  body: string | null;
  status_id: number;
  attempts: number;
  sent_at: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
