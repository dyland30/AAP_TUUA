export interface MoneyExchangeOperation {
  id: string | null;
  cashier_machine_session_id: string;
  operation_date: string;
  operation_type: string;
  local_currency_id: number;
  foreign_currency_id: number;
  exchange_rate_id: string;
  applied_exchange_rate: number;
  local_currency_amount: number;
  foreign_currency_amount: number;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
