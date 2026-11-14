export interface TextTranslation {
  id: string | null;
  airport_id: string | null;
  text_key: string;
  language_id: number;
  text_value: string;
  context: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
