import { CashierMachine } from './cashier-machine.model';
import { CashierMachineSession } from './cashier-machine-session.model';
import { Feature } from './feature.model';

// Turno abierto del usuario con los saldos esperados para el cuadre de caja.
export interface CashierSessionBalance {
  session: CashierMachineSession;
  cashier_machine: CashierMachine;
  operator_name: string | null;
  currencies: Feature[];
  payment_types: Feature[];
  cash_payment_type_id: number;
  expected_amounts: CashierSessionExpectedAmount[];
  currency_totals: CashierSessionCurrencyTotals[];
  sales_count: number;
  tickets_count: number;
}

export interface CashierSessionExpectedAmount {
  currency_id: number;
  payment_type_id: number;
  expected_amount: number;
}

// Montos con signo: ingresos positivos, egresos negativos (salvo income/expense, que son absolutos).
export interface CashierSessionCurrencyTotals {
  currency_id: number;
  opening_amount: number;
  sales_amount: number;
  exchange_amount: number;
  income_amount: number;
  expense_amount: number;
  balance_amount: number;
}

export interface CashierSessionDeclaredAmount {
  currency_id: number;
  payment_type_id: number;
  declared_amount: number;
}

export interface CashierSessionCloseRequest {
  cashier_machine_session_id: string;
  observation: string | null;
  declared_amounts: CashierSessionDeclaredAmount[];
}

export interface CashierSessionClosingDetail {
  id: string | null;
  cashier_machine_session_closing_id: string | null;
  currency_id: number;
  payment_type_id: number;
  expected_amount: number;
  declared_amount: number;
  difference_amount: number;
}

export interface CashierSessionClosing {
  id: string | null;
  cashier_machine_session_id: string;
  closing_date: string;
  has_difference: boolean;
  observation: string | null;
  created_at: string | null;
  created_by: string | null;
  details: CashierSessionClosingDetail[];
}
