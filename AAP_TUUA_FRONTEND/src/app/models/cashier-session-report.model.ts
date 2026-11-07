import { PagedResult } from './boardingpass.model';
import { Feature } from './feature.model';

export interface CashierSessionReportFilter {
  date_from: string;
  date_to: string;
  airport_id: string | null;
  terminal_id: string | null;
  page: number;
  page_size: number;
}

// Ventas y tickets emitidos (sin anulados) por tipo de vuelo.
export interface CashierSessionReportTickets {
  cashier_machine_session_id: string | null;
  flight_type_id: number | null;
  sales_count: number;
  tickets_count: number;
}

// Montos de una moneda; difference_amount es null si el turno no tiene cuadre.
export interface CashierSessionReportAmounts {
  cashier_machine_session_id: string | null;
  currency_id: number;
  sales_amount: number;
  income_amount: number;
  expense_amount: number;
  balance_amount: number;
  difference_amount: number | null;
}

export interface CashierSessionReportItem {
  id: string;
  cashier_machine_code: string;
  terminal_id: string | null;
  terminal_name: string | null;
  airport_id: string | null;
  airport_name: string | null;
  airport_iata_code: string | null;
  operator_name: string | null;
  operator_email: string | null;
  start_time: string;
  end_time: string | null;
  status_description: string | null;
  is_closed: boolean;
  closing_has_difference: boolean | null;
  closing_observation: string | null;
  sales_count: number;
  tickets_count: number;
  tickets: CashierSessionReportTickets[];
  amounts: CashierSessionReportAmounts[];
}

export interface CashierSessionReportTotals {
  sessions_count: number;
  sales_count: number;
  tickets_count: number;
  tickets: CashierSessionReportTickets[];
  amounts: CashierSessionReportAmounts[];
}

// Página de turnos, totales de todos los turnos filtrados y catálogos de las columnas dinámicas.
export interface CashierSessionReportResult {
  result: PagedResult<CashierSessionReportItem>;
  totals: CashierSessionReportTotals;
  currencies: Feature[];
  flight_types: Feature[];
}
