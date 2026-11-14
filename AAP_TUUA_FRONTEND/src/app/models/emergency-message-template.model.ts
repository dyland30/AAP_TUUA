export interface EmergencyMessageTemplate {
  id: string | null;
  airport_id: string | null;
  alert_type_id: number;
  language_id: number;
  title: string;
  subtitle: string | null;
  instructions: string | null;
  ticker_text: string | null;
  icon_media_asset_id: string | null;
  display_template_id: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
