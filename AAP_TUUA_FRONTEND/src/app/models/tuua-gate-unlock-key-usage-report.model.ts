import { TuuaGateUnlockKeyUsageHistory } from './tuua-gate-unlock-key-usage-history.model';

export interface TuuaGateUnlockKeyUsageFilter {
  date_from: string;
  date_to: string;
  airport_id: string | null;
  terminal_id: string | null;
  tuua_gate_code: string | null;
  user_id: string | null;
  page: number;
  page_size: number;
}

export interface TuuaGateUnlockKeyUsageReportItem extends TuuaGateUnlockKeyUsageHistory {
  tuua_gate_description: string | null;
  terminal_id: string | null;
  terminal_name: string | null;
  airport_id: string | null;
  airport_name: string | null;
  airport_iata_code: string | null;
  key_code: string | null;
  key_type_description: string | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
}
