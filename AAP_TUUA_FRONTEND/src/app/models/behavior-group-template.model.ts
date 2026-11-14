export interface BehaviorGroupTemplate {
  id: string | null;
  behavior_group_id: string;
  display_template_id: string;
  orientation_id: number | null;
  resolution_id: number | null;
  flight_slots: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
