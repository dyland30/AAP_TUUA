export interface DisplayTemplateVersion {
  id: string | null;
  display_template_id: string;
  version_number: number;
  layout: string | null;
  styles: string | null;
  background_media_asset_id: string | null;
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  change_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
