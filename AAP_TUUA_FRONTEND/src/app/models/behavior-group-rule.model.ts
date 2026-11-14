export interface BehaviorGroupRule {
  id: string | null;
  behavior_group_id: string;
  rule_type_id: number;
  field_id: number | null;
  operator_id: number | null;
  rule_value: string | null;
  status_filter_ids: number[] | null;
  show_from_offset_min: number | null;
  show_until_offset_min: number | null;
  duration_seconds: number | null;
  priority: number;
  sort_order: number;
  airport_sector_id: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
