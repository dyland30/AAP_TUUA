export interface CashFlow {
  id: string | null;
  cashier_machine_session_id: string;
  tuua_sales_operation_id: string | null;
  money_exchange_operation_id: string | null;
  direction: string;
  operator: number;
  payment_type_id: number;
  currency_id: number;
  amount: number;
  reference_code: string | null;
  observation: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
