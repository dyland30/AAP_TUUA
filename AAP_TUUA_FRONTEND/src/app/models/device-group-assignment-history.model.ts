export interface DeviceGroupAssignmentHistory {
  id: string | null;
  device_id: string;
  previous_behavior_group_id: string | null;
  behavior_group_id: string;
  assigned_at: string;
  assigned_by: string | null;
  applied_at: string | null;
  reason: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
