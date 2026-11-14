export interface AdCampaignItem {
  id: string | null;
  ad_campaign_id: string;
  media_asset_id: string;
  sort_order: number;
  duration_seconds: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
