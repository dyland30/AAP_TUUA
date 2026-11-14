export interface DisplayTemplateWidget {
  id: string | null;
  display_template_version_id: string;
  widget_type_id: number;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  z_index: number;
  config: string | null;
  is_visible: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
