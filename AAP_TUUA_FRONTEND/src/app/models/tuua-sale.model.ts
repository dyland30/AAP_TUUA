import { Airport } from './airport.model';
import { CashierMachine } from './cashier-machine.model';
import { CashierMachineSession } from './cashier-machine-session.model';
import { ExchangeRate } from './exchange-rate.model';
import { Feature } from './feature.model';
import { Location } from './location.model';
import { Terminal } from './terminal.model';
import { TuuaPrice } from './tuua-price.model';
import { TuuaSalesOperation } from './tuua-sales-operation.model';

// Turno abierto del usuario y catálogos del punto de venta de tickets TUUA.
export interface TuuaSaleContext {
  session: CashierMachineSession;
  cashier_machine: CashierMachine;
  terminal: Terminal | null;
  location: Location | null;
  airport: Airport | null;
  igv_rate: number;
  flight_days: number;
  national_currency_id: number;
  document_types: Feature[];
  sale_types: Feature[];
  payment_types: Feature[];
  currencies: Feature[];
  flight_types: Feature[];
}

// Precio vigente y último tipo de cambio activo para la moneda del precio.
export interface TuuaSalePricing {
  tuua_price: TuuaPrice;
  exchange_rate: ExchangeRate;
}

// Datos capturados en el punto de venta; los importes se recalculan en el backend.
export interface TuuaTicketSaleRequest {
  cashier_machine_session_id: string;
  document_type_id: number;
  sale_type_id: number;
  flight_type_id: number;
  flight_id: string;
  titular_passenger_name: string;
  passenger_email: string | null;
  ticket_quantity: number;
  payment_type_id: number;
  cash_payment_currency_id: number | null;
  cash_amount_payed: number | null;
  cash_change_currency_id: number | null;
}

export interface TuuaSalesOperationSearchFilter {
  date_from: string;
  date_to: string;
  airport_id: string | null;
  terminal_id: string | null;
  status_id: number | null;
}

// Operación de venta con la caja, terminal y aeropuerto donde se emitió, y sus tickets.
export interface TuuaSalesOperationSearchItem extends TuuaSalesOperation {
  cashier_machine_code: string | null;
  terminal_id: string | null;
  terminal_name: string | null;
  airport_id: string | null;
  airport_name: string | null;
  airport_iata_code: string | null;
}
