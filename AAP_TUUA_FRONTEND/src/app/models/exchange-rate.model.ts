export interface ExchangeRate {
  id: string | null;
  day: string;
  base_currency_id: number;
  target_currency_id: number;
  purchase_exchange_rate: number;
  sales_exchange_rate: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
