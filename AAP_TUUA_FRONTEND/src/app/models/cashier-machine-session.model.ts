export interface CashierMachineSession {
  id: string | null;
  cashier_machine_code: string;
  local_user_id: string;
  start_time: string;
  end_time: string | null;
  status_id: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
