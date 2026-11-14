export interface DeviceStatusHistory {
  id: string | null;
  device_id: string;
  status_id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  reason: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
