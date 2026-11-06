export interface BoardingpassSearchItem {
  id: number;
  serial: string;
  sequential_number: number;
  tuua_gate_code: string;
  flight_type_id: number;
  airline_id: string;
  price: number;
  currency_id: number;
  status_id: number;
  flight_number: string;
  flight_date: string;
  passenger_name: string;
  seat_number: string | null;
  pnr: string | null;
  checkin_sequence_number: number | null;
  origin_airport_code: string;
  destination_airport_code: string;
  passenger_status: string;
  ose_status_id: number | null;
  created_at: string | null;
  terminal_id: string | null;
  terminal_name: string | null;
  airport_id: string | null;
  airport_name: string | null;
  airport_iata_code: string | null;
}

// Fechas como yyyy-MM-dd y horas como HH:mm; la paginación (page desde 1) se resuelve en base de datos.
export interface BoardingpassSearchFilter {
  date_from: string;
  date_to: string;
  time_from: string | null;
  time_to: string | null;
  airport_id: string | null;
  terminal_id: string | null;
  flight_type_id: number | null;
  status_id: number | null;
  page: number;
  page_size: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
