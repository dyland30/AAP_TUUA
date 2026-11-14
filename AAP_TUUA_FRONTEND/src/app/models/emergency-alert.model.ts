export interface EmergencyAlert {
  id: string | null;
  airport_id: string;
  alert_type_id: number;
  origin_id: number;
  coverage_id: number;
  status_id: number;
  integration_message_id: string | null;
  custom_message_es: string | null;
  custom_message_en: string | null;
  requested_at: string;
  requested_by: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  started_at: string | null;
  ended_at: string | null;
  ended_by: string | null;
  deploy_duration_ms: number | null;
  restore_duration_ms: number | null;
  pa_triggered: boolean;
  observation: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}
