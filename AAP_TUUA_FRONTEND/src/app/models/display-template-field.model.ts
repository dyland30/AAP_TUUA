export interface DisplayTemplateField {
  id: string | null;
  display_template_version_id: string;
  field_id: number;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  z_index: number;
  font_size: number | null;
  text_align: string | null;
  format_mask: string | null;
  is_bilingual: boolean;
  is_visible: boolean;
  sort_order: number;
  properties: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
