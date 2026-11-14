export interface FeatureTranslation {
  id: string | null;
  feature_id: number;
  language_id: number;
  short_text: string;
  long_text: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
