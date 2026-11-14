export interface AdCampaign {
  id: string | null;
  airport_id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  daily_start_time: string | null;
  daily_end_time: string | null;
  days_of_week: number[] | null;
  priority_id: number;
  status_id: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
