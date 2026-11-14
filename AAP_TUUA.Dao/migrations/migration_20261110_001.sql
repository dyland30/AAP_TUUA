
CREATE TABLE IF NOT EXISTS "public"."flight_status_transition" (
                                                                   "id" uuid DEFAULT uuidv7() NOT NULL,
    "from_status_id" integer NOT NULL,
    "to_status_id" integer NOT NULL,
    "applies_to_departure" boolean DEFAULT true NOT NULL,
    "applies_to_arrival" boolean DEFAULT true NOT NULL,
    "allowed_for_airline" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "flight_status_transition_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_flight_status_transition" UNIQUE (from_status_id, to_status_id),
    CONSTRAINT "ck_flight_status_transition_diff" CHECK (from_status_id <> to_status_id)
    );
        COMMENT ON TABLE "public"."flight_status_transition" IS 'Cambios de estado permitidos (SCH→SCT→…→GCL/OFB). Indica cuáles puede hacer la aerolínea desde la botonera.';



CREATE TABLE IF NOT EXISTS "public"."flight_status_history" (
                                                                "id" uuid DEFAULT uuidv7() NOT NULL,
    "flight_id" uuid NOT NULL,
    "previous_status_id" integer,
    "new_status_id" integer NOT NULL,
    "source_id" integer,
    "integration_message_id" uuid,
    "changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                               "changed_by" character varying(50),
    "estimated_time" timestamp with time zone,
    "actual_time" timestamp with time zone,
                               "notes" character varying(500),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "flight_status_history_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."flight_status_history" IS 'Historial de cambios de estado de cada vuelo con usuario/origen y timestamp (GV-004). Se alimenta por trigger.';


CREATE TABLE IF NOT EXISTS "public"."flight_change_history" (
                                                                "id" uuid DEFAULT uuidv7() NOT NULL,
    "flight_id" uuid NOT NULL,
    "field_name" character varying(100) NOT NULL,
    "old_value" text,
    "new_value" text,
    "source_id" integer,
    "integration_message_id" uuid,
    "was_rejected_by_lock" boolean DEFAULT false NOT NULL,
    "changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                               "changed_by" character varying(50),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "flight_change_history_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."flight_change_history" IS 'Trazabilidad de cambios a nivel de campo del vuelo (UC-01, UC-06). was_rejected_by_lock registra actualizaciones AODB descartadas por bloqueo.';

CREATE TABLE IF NOT EXISTS "public"."flight_timing_rule" (
                                                             "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid NOT NULL,
    "terminal_id" uuid,
    "airport_sector_id" uuid,
    "event_type_id" integer NOT NULL,
    "reference_time_id" integer NOT NULL,
    "flight_direction_id" integer,
    "flight_type_id" integer,
    "airline_id" uuid,
    "destination_airport_id" uuid,
    "resource_type_id" integer,
    "offset_minutes" integer NOT NULL,
    "priority" smallint DEFAULT 100 NOT NULL,
    "description" character varying(200),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "flight_timing_rule_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."flight_timing_rule" IS 'Reglas de tiempos de apertura/cierre de mostradores y puertas, Call to Gate y ventanas de aparición por tipo de vuelo, destino y sector (AR-002, GB-004, FV-001, UC-26). offset_minutes negativo = antes de la hora de referencia. La regla más específica / menor priority gana.';



CREATE TABLE IF NOT EXISTS "public"."airport_resource_allocation_history" (
                                                                              "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_resource_allocation_id" uuid NOT NULL,
    "airport_resource_id" uuid NOT NULL,
    "flight_id" uuid,
    "airline_id" uuid,
    "action_id" integer NOT NULL,
    "previous_resource_id" uuid,
    "action_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                              "action_by" character varying(50),
    "source_id" integer,
    "notes" character varying(500),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "airport_resource_allocation_history_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."airport_resource_allocation_history" IS 'Flujo de asignación de recursos: asignación, apertura, logo activo, cierre y reasignación (AR-005, GV-005).';



CREATE TABLE IF NOT EXISTS "public"."flight_import_batch" (
                                                              "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid NOT NULL,
    "file_type_id" integer NOT NULL,
    "status_id" integer NOT NULL,
    "file_name" character varying(255),
    "file_size_bytes" bigint,
    "storage_path" character varying(500),
    "airline_id" uuid,
    "date_from" date,
    "date_to" date,
    "total_rows" integer DEFAULT 0 NOT NULL,
    "valid_rows" integer DEFAULT 0 NOT NULL,
    "error_rows" integer DEFAULT 0 NOT NULL,
    "duplicate_rows" integer DEFAULT 0 NOT NULL,
    "imported_rows" integer DEFAULT 0 NOT NULL,
    "is_scheduled" boolean DEFAULT false NOT NULL,
    "validated_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone,
                                 "confirmed_by" character varying(50),
    "error_report_path" character varying(500),
    "observation" character varying(500),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "flight_import_batch_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."flight_import_batch" IS 'Lote de importación de itinerario CSV/DGAC/OACI o schedule OAG con validación previa obligatoria (GV-009, IE-004, UC-05, UC-08).';

CREATE TABLE IF NOT EXISTS "public"."flight_import_row" (
                                                            "id" uuid DEFAULT uuidv7() NOT NULL,
    "flight_import_batch_id" uuid NOT NULL,
    "row_number" integer NOT NULL,
    "status_id" integer NOT NULL,
    "reconciliation_action_id" integer,
    "is_selected" boolean DEFAULT true NOT NULL,
    "airline_code" character varying(5),
    "airline_id" uuid,
    "flight_number" character varying(10),
    "flight_direction_code" character varying(5),
    "origin_airport_code" character varying(5),
    "destination_airport_code" character varying(5),
    "flight_date" date,
    "scheduled_time_utc" time without time zone,
    "scheduled_time_local" time without time zone,
    "service_type_code" character varying(5),
    "aircraft_type_code" character varying(4),
    "days_of_week" character varying(7),
    "valid_from" date,
    "valid_to" date,
    "raw_data" jsonb,
    "error_detail" character varying(1000),
    "existing_flight_id" uuid,
    "flight_id" uuid,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "flight_import_row_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_flight_import_row" UNIQUE (flight_import_batch_id, row_number)
    );
        COMMENT ON TABLE "public"."flight_import_row" IS 'Previsualización fila a fila: válido/error/duplicado y acción de reconciliación sugerida (UC-05, UC-08).';



-- --------------------------------------------------------------------------------------
-- 3.2 SECTORES, RUTAS DE EVACUACIÓN (AL-001, AL-003) – multitenancy por aeropuerto
-- --------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."airport_sector" (
                                                         "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid NOT NULL,
    "terminal_id" uuid,
    "parent_id" uuid,
    "code" character varying(20) NOT NULL,
    "name" character varying(100) NOT NULL,
    "level" character varying(20),
    "description" character varying(500),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "airport_sector_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_airport_sector_code" UNIQUE (airport_id, code)
    );
        COMMENT ON TABLE "public"."airport_sector" IS 'Sectores / zonas del terminal (prefiltros, migración, conexiones, salas, zona B...). Base para alertas por sector, reglas y wayfinding.';

CREATE TABLE IF NOT EXISTS "public"."evacuation_route" (
                                                           "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_sector_id" uuid NOT NULL,
    "code" character varying(20) NOT NULL,
    "name_es" character varying(200) NOT NULL,
    "name_en" character varying(200),
    "direction_icon" character varying(50),
    "exit_name" character varying(100),
    "is_default" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "evacuation_route_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_evacuation_route_code" UNIQUE (airport_sector_id, code)
    );
        COMMENT ON TABLE "public"."evacuation_route" IS 'Rutas / direcciones de evacuación por sector (AL-003). Ej.: Salida Norte 3.';



-- --------------------------------------------------------------------------------------
-- 3.4 GRUPOS DE COMPORTAMIENTO Y PLANTILLAS (GB, PL)
-- --------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."behavior_group" (
                                                         "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid,
    "code" character varying(30) NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" character varying(500),
    "standard_number" smallint,
    "is_standard" boolean DEFAULT false NOT NULL,
    "display_type_id" integer,
    "content_type_id" integer NOT NULL,
    "flight_direction_id" integer,
    "flight_type_id" integer,
    "priority" smallint DEFAULT 100 NOT NULL,
    "is_emergency" boolean DEFAULT false NOT NULL,
    "page_duration_seconds" smallint,
    "rows_per_page" smallint,
    "alternate_interval_seconds" smallint,
    "max_flights" smallint,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "behavior_group_pkey" PRIMARY KEY (id),
    CONSTRAINT "ck_behavior_group_standard_number" CHECK (standard_number IS NULL OR standard_number BETWEEN 1 AND 12)
    );
        COMMENT ON TABLE "public"."behavior_group" IS 'Grupos de comportamiento (12 estándar de fábrica con airport_id NULL + personalizados por aeropuerto). Menor priority = mayor prioridad; Emergencia = 0 (GB-001, GB-005, UC-17).';

CREATE TABLE IF NOT EXISTS "public"."behavior_group_rule" (
                                                              "id" uuid DEFAULT uuidv7() NOT NULL,
    "behavior_group_id" uuid NOT NULL,
    "rule_type_id" integer NOT NULL,
    "field_id" integer,
    "operator_id" integer,
    "rule_value" character varying(1000),
    "status_filter_ids" integer[],
    "show_from_offset_min" integer,
    "show_until_offset_min" integer,
    "duration_seconds" smallint,
    "priority" smallint DEFAULT 100 NOT NULL,
    "sort_order" smallint DEFAULT 0 NOT NULL,
    "airport_sector_id" uuid,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "behavior_group_rule_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."behavior_group_rule" IS 'Reglas condicionales del grupo: campos, momento del ciclo de vuelo, duración y prioridad (GB-003, GB-004).';

CREATE TABLE IF NOT EXISTS "public"."display_template" (
                                                           "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid,
    "code" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" character varying(500),
    "display_type_id" integer NOT NULL,
    "orientation_id" integer NOT NULL,
    "resolution_id" integer NOT NULL,
    "flight_slots" smallint,
    "current_version_id" uuid,
    "is_virtual_keypad" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "display_template_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_display_template_code" UNIQUE (airport_id, code)
    );
        COMMENT ON TABLE "public"."display_template" IS 'Plantillas visuales por tipo de pantalla, orientación y resolución. flight_slots diferencia BIDS 1/2/3 vuelos (PL-001, FV-006, PL-008).';

CREATE TABLE IF NOT EXISTS "public"."display_template_version" (
                                                                   "id" uuid DEFAULT uuidv7() NOT NULL,
    "display_template_id" uuid NOT NULL,
    "version_number" integer NOT NULL,
    "layout" jsonb,
    "styles" jsonb,
    "background_media_asset_id" uuid,
    "is_published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
                                 "published_by" character varying(50),
    "change_notes" character varying(500),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "display_template_version_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_display_template_version" UNIQUE (display_template_id, version_number)
    );
        COMMENT ON TABLE "public"."display_template_version" IS 'Versionado de plantillas al guardar (UC-19).';

CREATE TABLE IF NOT EXISTS "public"."display_template_field" (
                                                                 "id" uuid DEFAULT uuidv7() NOT NULL,
    "display_template_version_id" uuid NOT NULL,
    "field_id" integer NOT NULL,
    "pos_x" numeric(7,2) NOT NULL,
    "pos_y" numeric(7,2) NOT NULL,
    "width" numeric(7,2) NOT NULL,
    "height" numeric(7,2) NOT NULL,
    "z_index" smallint DEFAULT 0 NOT NULL,
    "font_size" smallint,
    "text_align" character varying(10),
    "format_mask" character varying(50),
    "is_bilingual" boolean DEFAULT true NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "sort_order" smallint DEFAULT 0 NOT NULL,
    "properties" jsonb,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "display_template_field_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."display_template_field" IS 'Posición y tamaño de cada campo en la plantilla (PL-001, PL-002). Incluye zonas multimedia (PL-004).';

CREATE TABLE IF NOT EXISTS "public"."display_template_widget" (
                                                                  "id" uuid DEFAULT uuidv7() NOT NULL,
    "display_template_version_id" uuid NOT NULL,
    "widget_type_id" integer NOT NULL,
    "pos_x" numeric(7,2) NOT NULL,
    "pos_y" numeric(7,2) NOT NULL,
    "width" numeric(7,2) NOT NULL,
    "height" numeric(7,2) NOT NULL,
    "z_index" smallint DEFAULT 0 NOT NULL,
    "config" jsonb,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "display_template_widget_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."display_template_widget" IS 'Widgets dinámicos: reloj, clima, contador a cierre de puerta, mensajes (PL-005).';

CREATE TABLE IF NOT EXISTS "public"."behavior_group_template" (
                                                                  "id" uuid DEFAULT uuidv7() NOT NULL,
    "behavior_group_id" uuid NOT NULL,
    "display_template_id" uuid NOT NULL,
    "orientation_id" integer,
    "resolution_id" integer,
    "flight_slots" smallint,
    "is_default" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "behavior_group_template_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."behavior_group_template" IS 'Plantilla a usar por grupo según orientación/resolución y número de vuelos (BIDS 1-3) (UC-17, UC-28).';

CREATE TABLE IF NOT EXISTS "public"."feature_translation" (
                                                              "id" uuid DEFAULT uuidv7() NOT NULL,
    "feature_id" integer NOT NULL,
    "language_id" integer NOT NULL,
    "short_text" character varying(100) NOT NULL,
    "long_text" character varying(500),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "feature_translation_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_feature_translation" UNIQUE (feature_id, language_id)
    );
        COMMENT ON TABLE "public"."feature_translation" IS 'Traducción de catálogos (estados de vuelo, tipos de alerta...) para presentación bilingüe (PL-003).';

CREATE TABLE IF NOT EXISTS "public"."text_translation" (
                                                           "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid,
    "text_key" character varying(100) NOT NULL,
    "language_id" integer NOT NULL,
    "text_value" character varying(2000) NOT NULL,
    "context" character varying(100),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "text_translation_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."text_translation" IS 'Textos fijos de pantallas y consola traducibles por idioma (PL-003). Ej.: header.departures = SALIDAS / DEPARTURES.';


-- --------------------------------------------------------------------------------------
-- 3.5 DISPOSITIVOS Y PERIFÉRICOS (DP, DM)
-- --------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."video_wall" (
                                                     "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid NOT NULL,
    "terminal_id" uuid,
    "airport_sector_id" uuid,
    "code" character varying(30) NOT NULL,
    "name" character varying(100) NOT NULL,
    "grid_rows" smallint NOT NULL,
    "grid_columns" smallint NOT NULL,
    "behavior_group_id" uuid,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "video_wall_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_video_wall_code" UNIQUE (airport_id, code),
    CONSTRAINT "ck_video_wall_grid" CHECK (grid_rows > 0 AND grid_columns > 0)
    );
        COMMENT ON TABLE "public"."video_wall" IS 'Circuitos de video wall; el máximo de monitores se valida con el parámetro MAX_MONITORS_VIDEO_WALL (DP-004).';

CREATE TABLE IF NOT EXISTS "public"."device" (
                                                 "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid NOT NULL,
    "terminal_id" uuid,
    "airport_sector_id" uuid,
    "airport_resource_id" uuid,
    "code" character varying(50) NOT NULL,
    "name" character varying(100),
    "location_description" character varying(200),
    "ip_address" character varying(50),
    "mac_address" character varying(17),
    "hostname" character varying(100),
    "display_type_id" integer NOT NULL,
    "orientation_id" integer NOT NULL,
    "resolution_id" integer NOT NULL,
    "behavior_group_id" uuid,
    "video_wall_id" uuid,
    "video_wall_position" smallint,
    "status_id" integer NOT NULL,
    "is_offline_mode" boolean DEFAULT false NOT NULL,
    "last_heartbeat_at" timestamp with time zone,
    "last_status_change_at" timestamp with time zone,
    "last_ntp_sync_at" timestamp with time zone,
                                     "clock_offset_ms" integer,
                                     "consecutive_errors" integer DEFAULT 0 NOT NULL,
                                     "software_version" character varying(50),
    "config_version" character varying(50),
    "os_version" character varying(100),
    "serial_number" character varying(100),
    "manufacturer" character varying(100),
    "model" character varying(100),
    "ssh_port" integer,
    "vnc_port" integer,
    "remote_credential_ref" character varying(200),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "device_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_device_code" UNIQUE (code),
    CONSTRAINT "ck_device_video_wall_position" CHECK (video_wall_id IS NULL OR video_wall_position IS NOT NULL)
    );
        COMMENT ON TABLE "public"."device" IS 'Mini PC + pantalla de campo. behavior_group_id = único grupo activo de la pantalla (DP-001..DP-005, DM-001, GB-002, UC-13, UC-18).';

CREATE TABLE IF NOT EXISTS "public"."device_group_assignment_history" (
                                                                          "id" uuid DEFAULT uuidv7() NOT NULL,
    "device_id" uuid NOT NULL,
    "previous_behavior_group_id" uuid,
    "behavior_group_id" uuid NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                "assigned_by" character varying(50),
    "applied_at" timestamp with time zone,
                                "reason" character varying(500),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "device_group_assignment_history_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."device_group_assignment_history" IS 'Historial de reasignaciones de pantalla a grupos (GB-002, UC-18). Se alimenta por trigger.';

CREATE TABLE IF NOT EXISTS "public"."device_status_history" (
                                                                "id" uuid DEFAULT uuidv7() NOT NULL,
    "device_id" uuid NOT NULL,
    "status_id" integer NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "ended_at" timestamp with time zone,
                             "duration_seconds" integer,
                             "reason" character varying(500),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "device_status_history_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."device_status_history" IS 'Periodos de estado por dispositivo para uptime e historial (DM-005, MO-003). Solo cambios, no cada heartbeat.';

CREATE TABLE IF NOT EXISTS "public"."device_incident" (
                                                          "id" uuid DEFAULT uuidv7() NOT NULL,
    "device_id" uuid NOT NULL,
    "incident_type_id" integer NOT NULL,
    "detected_at" timestamp with time zone NOT NULL,
    "acknowledged_at" timestamp with time zone,
                                    "acknowledged_by" character varying(50),
    "resolved_at" timestamp with time zone,
                                    "resolved_by" character varying(50),
    "error_count" integer DEFAULT 1 NOT NULL,
    "is_escalated" boolean DEFAULT false NOT NULL,
    "escalated_at" timestamp with time zone,
                                    "system_event_log_id" bigint,
                                    "notes" character varying(1000),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "device_incident_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."device_incident" IS 'Incidentes de dispositivo con tiempos de detección, atención y resolución (DM-004, DM-005, MO-003).';

-- --------------------------------------------------------------------------------------
-- 3.6 CONTENIDO MULTIMEDIA, CAMPAÑAS Y WAYFINDING (PL-004, PL-006, PL-007, FV-002, FV-003)
-- --------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."media_asset" (
                                                      "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid,
    "media_type_id" integer NOT NULL,
    "name" character varying(200) NOT NULL,
    "storage_path" character varying(500),
    "text_content" character varying(2000),
    "mime_type" character varying(100),
    "file_size_bytes" bigint,
    "width_px" integer,
    "height_px" integer,
    "duration_seconds" integer,
    "checksum_sha256" character varying(64),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "media_asset_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."media_asset" IS 'Archivos en File Storage (Blob/MinIO): videos, imágenes, SVG, logos y mensajes de texto (PL-004).';

CREATE TABLE IF NOT EXISTS "public"."ad_campaign" (
                                                      "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid NOT NULL,
    "company_id" uuid,
    "name" character varying(200) NOT NULL,
    "description" character varying(500),
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "daily_start_time" time without time zone,
    "daily_end_time" time without time zone,
    "days_of_week" smallint[],
    "priority_id" integer NOT NULL,
    "status_id" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "ad_campaign_pkey" PRIMARY KEY (id),
    CONSTRAINT "ck_ad_campaign_dates" CHECK (end_date >= start_date)
    );
        COMMENT ON TABLE "public"."ad_campaign" IS 'Campañas publicitarias con vigencia, horario y prioridad (PL-006, UC-20). El contenido operacional siempre prevalece.';

CREATE TABLE IF NOT EXISTS "public"."ad_campaign_item" (
                                                           "id" uuid DEFAULT uuidv7() NOT NULL,
    "ad_campaign_id" uuid NOT NULL,
    "media_asset_id" uuid NOT NULL,
    "sort_order" smallint DEFAULT 0 NOT NULL,
    "duration_seconds" smallint,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "ad_campaign_item_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."ad_campaign_item" IS 'Piezas multimedia que componen la campaña (PL-004).';

CREATE TABLE IF NOT EXISTS "public"."ad_campaign_behavior_group" (
                                                                     "ad_campaign_id" uuid NOT NULL,
                                                                     "behavior_group_id" uuid NOT NULL,
                                                                     "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                     "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                                     "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "ad_campaign_behavior_group_pkey" PRIMARY KEY (ad_campaign_id, behavior_group_id)
    );
        COMMENT ON TABLE "public"."ad_campaign_behavior_group" IS 'Asignación de campañas a grupos de pantallas (PL-006).';



-- --------------------------------------------------------------------------------------
-- 3.7 OPERACIÓN DE AEROLÍNEA – BOTONERA VIRTUAL / STAFF PAGES (PL-008, FV-004, FV-005)
-- --------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."virtual_keypad_button" (
                                                                "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid,
    "airline_id" uuid,
    "target_status_id" integer NOT NULL,
    "label_es" character varying(50) NOT NULL,
    "label_en" character varying(50),
    "color" character varying(9),
    "sort_order" smallint DEFAULT 0 NOT NULL,
    "requires_confirmation" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "virtual_keypad_button_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."virtual_keypad_button" IS 'Configuración de la botonera virtual. airport_id/airline_id NULL = configuración global (PL-008, UC-22).';

CREATE TABLE IF NOT EXISTS "public"."local_user_airline" (
                                                             "local_user_id" uuid NOT NULL,
                                                             "airline_id" uuid NOT NULL,
                                                             "is_active" boolean DEFAULT true NOT NULL,
                                                             "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                             "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                             "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "local_user_airline_pkey" PRIMARY KEY (local_user_id, airline_id)
    );
        COMMENT ON TABLE "public"."local_user_airline" IS 'Aerolíneas que puede operar un usuario con rol Aerolínea: restringe botonera y Staff Pages a sus vuelos (UC-22, UC-27).';

CREATE TABLE IF NOT EXISTS "public"."local_user_airport" (
                                                             "local_user_id" uuid NOT NULL,
                                                             "airport_id" uuid NOT NULL,
                                                             "is_default" boolean DEFAULT false NOT NULL,
                                                             "is_active" boolean DEFAULT true NOT NULL,
                                                             "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                             "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                                             "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "local_user_airport_pkey" PRIMARY KEY (local_user_id, airport_id)
    );
        COMMENT ON TABLE "public"."local_user_airport" IS 'Aeropuertos a los que tiene acceso el usuario: aislamiento multitenant (NF-005).';



-- --------------------------------------------------------------------------------------
-- 3.8 ALERTAS CRÍTICAS Y EMERGENCIAS (AL, IE-005)
-- --------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."emergency_alert_display_rule" (
                                                                       "id" uuid DEFAULT uuidv7() NOT NULL,
    "alert_type_id" integer NOT NULL,
    "display_type_id" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "emergency_alert_display_rule_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_emergency_alert_display_rule" UNIQUE (alert_type_id, display_type_id)
    );
        COMMENT ON TABLE "public"."emergency_alert_display_rule" IS 'Tipos de pantalla donde se despliega cada tipo de alerta. Ej.: sismo solo en tótems (DS) (regla UC-23).';

CREATE TABLE IF NOT EXISTS "public"."emergency_message_template" (
                                                                     "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid,
    "alert_type_id" integer NOT NULL,
    "language_id" integer NOT NULL,
    "title" character varying(100) NOT NULL,
    "subtitle" character varying(200),
    "instructions" jsonb,
    "ticker_text" character varying(1000),
    "icon_media_asset_id" uuid,
    "display_template_id" uuid,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "emergency_message_template_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."emergency_message_template" IS 'Mensajes y gráficos diferenciados por tipo de alerta e idioma (AL-002, prototipo fids_emergency_alert).';

CREATE TABLE IF NOT EXISTS "public"."emergency_alert" (
                                                          "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid NOT NULL,
    "alert_type_id" integer NOT NULL,
    "origin_id" integer NOT NULL,
    "coverage_id" integer NOT NULL,
    "status_id" integer NOT NULL,
    "integration_message_id" uuid,
    "custom_message_es" character varying(1000),
    "custom_message_en" character varying(1000),
    "requested_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                 "requested_by" character varying(50),
    "confirmed_at" timestamp with time zone,
                                 "confirmed_by" character varying(50),
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
                                 "ended_by" character varying(50),
    "deploy_duration_ms" integer,
    "restore_duration_ms" integer,
    "pa_triggered" boolean DEFAULT false NOT NULL,
    "observation" character varying(1000),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "emergency_alert_pkey" PRIMARY KEY (id),
    CONSTRAINT "ck_emergency_alert_dates" CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
    );
        COMMENT ON TABLE "public"."emergency_alert" IS 'Alertas de emergencia manuales o PVAS: tipo, cobertura, operador, hora inicio/fin (AL-001, AL-002, AL-006, IE-005, UC-09, UC-23, UC-24).';

CREATE TABLE IF NOT EXISTS "public"."emergency_alert_sector" (
                                                                 "id" uuid DEFAULT uuidv7() NOT NULL,
    "emergency_alert_id" uuid NOT NULL,
    "airport_sector_id" uuid NOT NULL,
    "evacuation_route_id" uuid,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "emergency_alert_sector_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_emergency_alert_sector" UNIQUE (emergency_alert_id, airport_sector_id)
    );
        COMMENT ON TABLE "public"."emergency_alert_sector" IS 'Sectores afectados y dirección de evacuación por sector (AL-003).';

CREATE TABLE IF NOT EXISTS "public"."emergency_alert_device" (
                                                                 "id" uuid DEFAULT uuidv7() NOT NULL,
    "emergency_alert_id" uuid NOT NULL,
    "device_id" uuid NOT NULL,
    "previous_behavior_group_id" uuid,
    "evacuation_route_id" uuid,
    "status_id" integer NOT NULL,
    "sent_at" timestamp with time zone,
    "displayed_at" timestamp with time zone,
    "restored_at" timestamp with time zone,
                                "error_message" character varying(1000),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "emergency_alert_device_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_emergency_alert_device" UNIQUE (emergency_alert_id, device_id)
    );
        COMMENT ON TABLE "public"."emergency_alert_device" IS 'Estado de despliegue y restauración por pantalla; guarda el grupo previo para restaurar (AL-004, UC-24).';

CREATE TABLE IF NOT EXISTS "public"."operational_alert" (
                                                            "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid NOT NULL,
    "flight_id" uuid NOT NULL,
    "alert_type_id" integer NOT NULL,
    "threshold_value" character varying(50),
    "old_value" character varying(200),
    "new_value" character varying(200),
    "detected_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                "notified_to" character varying(500),
    "acknowledged_at" timestamp with time zone,
                                "acknowledged_by" character varying(50),
    "propagated_at" timestamp with time zone,
                                "is_active" boolean DEFAULT true NOT NULL,
                                "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "operational_alert_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."operational_alert" IS 'Alertas operacionales automáticas: cancelación, cambio de puerta, desvío, demora sobre umbral (AL-005, AL-006, UC-25).';


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
                                                    "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
                                                    "airport_id" uuid,
                                                    "local_user_id" uuid,
                                                    "username" character varying(100),
    "action_id" integer NOT NULL,
    "entity_name" character varying(100),
    "entity_id" character varying(100),
    "description" character varying(1000),
    "old_values" jsonb,
    "new_values" jsonb,
    "ip_address" character varying(50),
    "user_agent" character varying(500),
    "occurred_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                "created_by" character varying(50),
    CONSTRAINT "audit_log_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."audit_log" IS 'Log de auditoría inmutable (trigger impide UPDATE/DELETE): login/logout, cambios, alertas. Retención mínima 1 año (SC-005, UC-30).';

-- --------------------------------------------------------------------------------------
-- 3.10 MONITOREO OPERACIONAL Y REPORTERÍA (MO)
-- --------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."system_event_log" (
                                                           "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
                                                           "airport_id" uuid,
                                                           "level_id" integer NOT NULL,
                                                           "component_id" integer NOT NULL,
                                                           "event_type_id" integer,
                                                           "message" character varying(2000) NOT NULL,
    "details" jsonb,
    "device_id" uuid,
    "integration_channel_id" uuid,
    "emergency_alert_id" uuid,
    "correlation_id" character varying(100),
    "host_name" character varying(100),
    "occurred_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                "is_notified" boolean DEFAULT false NOT NULL,
                                "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                "created_by" character varying(50),
    CONSTRAINT "system_event_log_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."system_event_log" IS 'Log de eventos del sistema con nivel ERROR/WARNING/INFO/DEBUG (MO-005, UC-33).';

CREATE TABLE IF NOT EXISTS "public"."notification_recipient" (
                                                                 "id" uuid DEFAULT uuidv7() NOT NULL,
    "airport_id" uuid,
    "event_type_id" integer NOT NULL,
    "channel_id" integer NOT NULL,
    "local_user_id" uuid,
    "recipient_address" character varying(200) NOT NULL,
    "min_level_id" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "notification_recipient_pkey" PRIMARY KEY (id),
    CONSTRAINT "ux_notification_recipient" UNIQUE (airport_id, event_type_id, channel_id, recipient_address)
    );
        COMMENT ON TABLE "public"."notification_recipient" IS 'Lista de destinatarios configurable por tipo de evento y canal (MO-004).';

CREATE TABLE IF NOT EXISTS "public"."notification" (
                                                       "id" uuid DEFAULT uuidv7() NOT NULL,
    "system_event_log_id" bigint,
    "notification_recipient_id" uuid,
    "channel_id" integer NOT NULL,
    "recipient_address" character varying(200) NOT NULL,
    "subject" character varying(300),
    "body" text,
    "status_id" integer NOT NULL,
    "attempts" smallint DEFAULT 0 NOT NULL,
    "sent_at" timestamp with time zone,
                            "error_message" character varying(1000),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "notification_pkey" PRIMARY KEY (id)
    );
        COMMENT ON TABLE "public"."notification" IS 'Notificaciones enviadas por correo/SMS ante eventos críticos (MO-004).';





-- ======================================================================================
-- 4. FOREIGN KEYS
-- ======================================================================================
-- Se agregan solo si no existen (bloque idempotente)
        DO $do$
DECLARE
    r record;
BEGIN
            FOR r IN
    SELECT * FROM (VALUES
                       -- tablas existentes ampliadas
                       ('flight','flight_connection_type_id_fkey','connection_type_id','feature(id)'),
                       ('flight','flight_status_source_id_fkey','status_source_id','feature(id)'),
                       ('flight','flight_flight_import_batch_id_fkey','flight_import_batch_id','flight_import_batch(id)'),
                       ('airline','airline_logo_media_asset_id_fkey','logo_media_asset_id','media_asset(id)'),
                       ('airport_resource','airport_resource_airport_sector_id_fkey','airport_sector_id','airport_sector(id)'),
                       ('airport_resource_allocation','airport_resource_allocation_display_airline_id_fkey','display_airline_id','airline(id)'),

                       -- vuelos
                       ('flight_status_transition','flight_status_transition_from_status_id_fkey','from_status_id','feature(id)'),
                       ('flight_status_transition','flight_status_transition_to_status_id_fkey','to_status_id','feature(id)'),
                       ('flight_status_history','flight_status_history_flight_id_fkey','flight_id','flight(id) ON DELETE CASCADE'),
                       ('flight_status_history','flight_status_history_previous_status_id_fkey','previous_status_id','feature(id)'),
                       ('flight_status_history','flight_status_history_new_status_id_fkey','new_status_id','feature(id)'),
                       ('flight_status_history','flight_status_history_source_id_fkey','source_id','feature(id)'),
                       ('flight_change_history','flight_change_history_flight_id_fkey','flight_id','flight(id) ON DELETE CASCADE'),
                       ('flight_change_history','flight_change_history_source_id_fkey','source_id','feature(id)'),
                       ('flight_timing_rule','flight_timing_rule_airport_id_fkey','airport_id','airport(id)'),
                       ('flight_timing_rule','flight_timing_rule_terminal_id_fkey','terminal_id','terminal(id)'),
                       ('flight_timing_rule','flight_timing_rule_airport_sector_id_fkey','airport_sector_id','airport_sector(id)'),
                       ('flight_timing_rule','flight_timing_rule_event_type_id_fkey','event_type_id','feature(id)'),
                       ('flight_timing_rule','flight_timing_rule_reference_time_id_fkey','reference_time_id','feature(id)'),
                       ('flight_timing_rule','flight_timing_rule_flight_direction_id_fkey','flight_direction_id','feature(id)'),
                       ('flight_timing_rule','flight_timing_rule_flight_type_id_fkey','flight_type_id','feature(id)'),
                       ('flight_timing_rule','flight_timing_rule_airline_id_fkey','airline_id','airline(id)'),
                       ('flight_timing_rule','flight_timing_rule_destination_airport_id_fkey','destination_airport_id','airport(id)'),
                       ('flight_timing_rule','flight_timing_rule_resource_type_id_fkey','resource_type_id','feature(id)'),
                       ('airport_resource_allocation_history','airport_resource_allocation_history_allocation_id_fkey','airport_resource_allocation_id','airport_resource_allocation(id)'),
                       ('airport_resource_allocation_history','airport_resource_allocation_history_resource_id_fkey','airport_resource_id','airport_resource(id)'),
                       ('airport_resource_allocation_history','airport_resource_allocation_history_previous_resource_id_fkey','previous_resource_id','airport_resource(id)'),
                       ('airport_resource_allocation_history','airport_resource_allocation_history_flight_id_fkey','flight_id','flight(id)'),
                       ('airport_resource_allocation_history','airport_resource_allocation_history_airline_id_fkey','airline_id','airline(id)'),
                       ('airport_resource_allocation_history','airport_resource_allocation_history_action_id_fkey','action_id','feature(id)'),
                       ('airport_resource_allocation_history','airport_resource_allocation_history_source_id_fkey','source_id','feature(id)'),
                       ('flight_import_batch','flight_import_batch_airport_id_fkey','airport_id','airport(id)'),
                       ('flight_import_batch','flight_import_batch_file_type_id_fkey','file_type_id','feature(id)'),
                       ('flight_import_batch','flight_import_batch_status_id_fkey','status_id','feature(id)'),
                       ('flight_import_batch','flight_import_batch_airline_id_fkey','airline_id','airline(id)'),
                       ('flight_import_row','flight_import_row_flight_import_batch_id_fkey','flight_import_batch_id','flight_import_batch(id) ON DELETE CASCADE'),
                       ('flight_import_row','flight_import_row_status_id_fkey','status_id','feature(id)'),
                       ('flight_import_row','flight_import_row_reconciliation_action_id_fkey','reconciliation_action_id','feature(id)'),
                       ('flight_import_row','flight_import_row_airline_id_fkey','airline_id','airline(id)'),
                       ('flight_import_row','flight_import_row_existing_flight_id_fkey','existing_flight_id','flight(id)'),
                       ('flight_import_row','flight_import_row_flight_id_fkey','flight_id','flight(id)'),
                       -- sectores
                       ('airport_sector','airport_sector_airport_id_fkey','airport_id','airport(id)'),
                       ('airport_sector','airport_sector_terminal_id_fkey','terminal_id','terminal(id)'),
                       ('airport_sector','airport_sector_parent_id_fkey','parent_id','airport_sector(id)'),
                       ('evacuation_route','evacuation_route_airport_sector_id_fkey','airport_sector_id','airport_sector(id)'),
                       -- grupos y plantillas
                       ('behavior_group','behavior_group_airport_id_fkey','airport_id','airport(id)'),
                       ('behavior_group','behavior_group_display_type_id_fkey','display_type_id','feature(id)'),
                       ('behavior_group','behavior_group_content_type_id_fkey','content_type_id','feature(id)'),
                       ('behavior_group','behavior_group_flight_direction_id_fkey','flight_direction_id','feature(id)'),
                       ('behavior_group','behavior_group_flight_type_id_fkey','flight_type_id','feature(id)'),
                       ('behavior_group_rule','behavior_group_rule_behavior_group_id_fkey','behavior_group_id','behavior_group(id) ON DELETE CASCADE'),
                       ('behavior_group_rule','behavior_group_rule_rule_type_id_fkey','rule_type_id','feature(id)'),
                       ('behavior_group_rule','behavior_group_rule_field_id_fkey','field_id','feature(id)'),
                       ('behavior_group_rule','behavior_group_rule_operator_id_fkey','operator_id','feature(id)'),
                       ('behavior_group_rule','behavior_group_rule_airport_sector_id_fkey','airport_sector_id','airport_sector(id)'),
                       ('display_template','display_template_airport_id_fkey','airport_id','airport(id)'),
                       ('display_template','display_template_display_type_id_fkey','display_type_id','feature(id)'),
                       ('display_template','display_template_orientation_id_fkey','orientation_id','feature(id)'),
                       ('display_template','display_template_resolution_id_fkey','resolution_id','feature(id)'),
                       ('display_template','display_template_current_version_id_fkey','current_version_id','display_template_version(id)'),
                       ('display_template_version','display_template_version_display_template_id_fkey','display_template_id','display_template(id) ON DELETE CASCADE'),
                       ('display_template_version','display_template_version_background_media_asset_id_fkey','background_media_asset_id','media_asset(id)'),
                       ('display_template_field','display_template_field_version_id_fkey','display_template_version_id','display_template_version(id) ON DELETE CASCADE'),
                       ('display_template_field','display_template_field_field_id_fkey','field_id','feature(id)'),
                       ('display_template_widget','display_template_widget_version_id_fkey','display_template_version_id','display_template_version(id) ON DELETE CASCADE'),
                       ('display_template_widget','display_template_widget_widget_type_id_fkey','widget_type_id','feature(id)'),
                       ('behavior_group_template','behavior_group_template_behavior_group_id_fkey','behavior_group_id','behavior_group(id) ON DELETE CASCADE'),
                       ('behavior_group_template','behavior_group_template_display_template_id_fkey','display_template_id','display_template(id)'),
                       ('behavior_group_template','behavior_group_template_orientation_id_fkey','orientation_id','feature(id)'),
                       ('behavior_group_template','behavior_group_template_resolution_id_fkey','resolution_id','feature(id)'),
                       ('feature_translation','feature_translation_feature_id_fkey','feature_id','feature(id) ON DELETE CASCADE'),
                       ('feature_translation','feature_translation_language_id_fkey','language_id','feature(id)'),
                       ('text_translation','text_translation_airport_id_fkey','airport_id','airport(id)'),
                       ('text_translation','text_translation_language_id_fkey','language_id','feature(id)'),
                       -- dispositivos
                       ('video_wall','video_wall_airport_id_fkey','airport_id','airport(id)'),
                       ('video_wall','video_wall_terminal_id_fkey','terminal_id','terminal(id)'),
                       ('video_wall','video_wall_airport_sector_id_fkey','airport_sector_id','airport_sector(id)'),
                       ('video_wall','video_wall_behavior_group_id_fkey','behavior_group_id','behavior_group(id)'),
                       ('device','device_airport_id_fkey','airport_id','airport(id)'),
                       ('device','device_terminal_id_fkey','terminal_id','terminal(id)'),
                       ('device','device_airport_sector_id_fkey','airport_sector_id','airport_sector(id)'),
                       ('device','device_airport_resource_id_fkey','airport_resource_id','airport_resource(id)'),
                       ('device','device_display_type_id_fkey','display_type_id','feature(id)'),
                       ('device','device_orientation_id_fkey','orientation_id','feature(id)'),
                       ('device','device_resolution_id_fkey','resolution_id','feature(id)'),
                       ('device','device_behavior_group_id_fkey','behavior_group_id','behavior_group(id)'),
                       ('device','device_video_wall_id_fkey','video_wall_id','video_wall(id)'),
                       ('device','device_status_id_fkey','status_id','feature(id)'),
                       ('device_group_assignment_history','device_group_assignment_history_device_id_fkey','device_id','device(id) ON DELETE CASCADE'),
                       ('device_group_assignment_history','device_group_assignment_history_prev_group_id_fkey','previous_behavior_group_id','behavior_group(id)'),
                       ('device_group_assignment_history','device_group_assignment_history_behavior_group_id_fkey','behavior_group_id','behavior_group(id)'),
                       ('device_status_history','device_status_history_device_id_fkey','device_id','device(id) ON DELETE CASCADE'),
                       ('device_status_history','device_status_history_status_id_fkey','status_id','feature(id)'),
                       ('device_incident','device_incident_device_id_fkey','device_id','device(id) ON DELETE CASCADE'),
                       ('device_incident','device_incident_incident_type_id_fkey','incident_type_id','feature(id)'),
                       ('device_incident','device_incident_system_event_log_id_fkey','system_event_log_id','system_event_log(id)'),
                       -- contenido
                       ('media_asset','media_asset_airport_id_fkey','airport_id','airport(id)'),
                       ('media_asset','media_asset_media_type_id_fkey','media_type_id','feature(id)'),
                       ('ad_campaign','ad_campaign_airport_id_fkey','airport_id','airport(id)'),
                       ('ad_campaign','ad_campaign_company_id_fkey','company_id','company(id)'),
                       ('ad_campaign','ad_campaign_priority_id_fkey','priority_id','feature(id)'),
                       ('ad_campaign','ad_campaign_status_id_fkey','status_id','feature(id)'),
                       ('ad_campaign_item','ad_campaign_item_ad_campaign_id_fkey','ad_campaign_id','ad_campaign(id) ON DELETE CASCADE'),
                       ('ad_campaign_item','ad_campaign_item_media_asset_id_fkey','media_asset_id','media_asset(id)'),
                       ('ad_campaign_behavior_group','ad_campaign_behavior_group_ad_campaign_id_fkey','ad_campaign_id','ad_campaign(id) ON DELETE CASCADE'),
                       ('ad_campaign_behavior_group','ad_campaign_behavior_group_behavior_group_id_fkey','behavior_group_id','behavior_group(id)'),
                       -- aerolínea / usuarios
                       ('virtual_keypad_button','virtual_keypad_button_airport_id_fkey','airport_id','airport(id)'),
                       ('virtual_keypad_button','virtual_keypad_button_airline_id_fkey','airline_id','airline(id)'),
                       ('virtual_keypad_button','virtual_keypad_button_target_status_id_fkey','target_status_id','feature(id)'),
                       ('local_user_airline','local_user_airline_local_user_id_fkey','local_user_id','local_user(id)'),
                       ('local_user_airline','local_user_airline_airline_id_fkey','airline_id','airline(id)'),
                       ('local_user_airport','local_user_airport_local_user_id_fkey','local_user_id','local_user(id)'),
                       ('local_user_airport','local_user_airport_airport_id_fkey','airport_id','airport(id)'),
                       -- alertas
                       ('emergency_alert_display_rule','emergency_alert_display_rule_alert_type_id_fkey','alert_type_id','feature(id)'),
                       ('emergency_alert_display_rule','emergency_alert_display_rule_display_type_id_fkey','display_type_id','feature(id)'),
                       ('emergency_message_template','emergency_message_template_airport_id_fkey','airport_id','airport(id)'),
                       ('emergency_message_template','emergency_message_template_alert_type_id_fkey','alert_type_id','feature(id)'),
                       ('emergency_message_template','emergency_message_template_language_id_fkey','language_id','feature(id)'),
                       ('emergency_message_template','emergency_message_template_icon_media_asset_id_fkey','icon_media_asset_id','media_asset(id)'),
                       ('emergency_message_template','emergency_message_template_display_template_id_fkey','display_template_id','display_template(id)'),
                       ('emergency_alert','emergency_alert_airport_id_fkey','airport_id','airport(id)'),
                       ('emergency_alert','emergency_alert_alert_type_id_fkey','alert_type_id','feature(id)'),
                       ('emergency_alert','emergency_alert_origin_id_fkey','origin_id','feature(id)'),
                       ('emergency_alert','emergency_alert_coverage_id_fkey','coverage_id','feature(id)'),
                       ('emergency_alert','emergency_alert_status_id_fkey','status_id','feature(id)'),
                       ('emergency_alert_sector','emergency_alert_sector_emergency_alert_id_fkey','emergency_alert_id','emergency_alert(id) ON DELETE CASCADE'),
                       ('emergency_alert_sector','emergency_alert_sector_airport_sector_id_fkey','airport_sector_id','airport_sector(id)'),
                       ('emergency_alert_sector','emergency_alert_sector_evacuation_route_id_fkey','evacuation_route_id','evacuation_route(id)'),
                       ('emergency_alert_device','emergency_alert_device_emergency_alert_id_fkey','emergency_alert_id','emergency_alert(id) ON DELETE CASCADE'),
                       ('emergency_alert_device','emergency_alert_device_device_id_fkey','device_id','device(id)'),
                       ('emergency_alert_device','emergency_alert_device_prev_group_id_fkey','previous_behavior_group_id','behavior_group(id)'),
                       ('emergency_alert_device','emergency_alert_device_evacuation_route_id_fkey','evacuation_route_id','evacuation_route(id)'),
                       ('emergency_alert_device','emergency_alert_device_status_id_fkey','status_id','feature(id)'),
                       ('operational_alert','operational_alert_airport_id_fkey','airport_id','airport(id)'),
                       ('operational_alert','operational_alert_flight_id_fkey','flight_id','flight(id)'),
                       ('operational_alert','operational_alert_alert_type_id_fkey','alert_type_id','feature(id)'),

                       ('audit_log','audit_log_airport_id_fkey','airport_id','airport(id)'),
                       ('audit_log','audit_log_local_user_id_fkey','local_user_id','local_user(id)'),
                       ('audit_log','audit_log_action_id_fkey','action_id','feature(id)'),
                       -- monitoreo
                       ('system_event_log','system_event_log_airport_id_fkey','airport_id','airport(id)'),
                       ('system_event_log','system_event_log_level_id_fkey','level_id','feature(id)'),
                       ('system_event_log','system_event_log_component_id_fkey','component_id','feature(id)'),
                       ('system_event_log','system_event_log_event_type_id_fkey','event_type_id','feature(id)'),
                       ('system_event_log','system_event_log_device_id_fkey','device_id','device(id)'),
                       ('system_event_log','system_event_log_emergency_alert_id_fkey','emergency_alert_id','emergency_alert(id)'),
                       ('notification_recipient','notification_recipient_airport_id_fkey','airport_id','airport(id)'),
                       ('notification_recipient','notification_recipient_event_type_id_fkey','event_type_id','feature(id)'),
                       ('notification_recipient','notification_recipient_channel_id_fkey','channel_id','feature(id)'),
                       ('notification_recipient','notification_recipient_local_user_id_fkey','local_user_id','local_user(id)'),
                       ('notification_recipient','notification_recipient_min_level_id_fkey','min_level_id','feature(id)'),
                       ('notification','notification_system_event_log_id_fkey','system_event_log_id','system_event_log(id)'),
                       ('notification','notification_notification_recipient_id_fkey','notification_recipient_id','notification_recipient(id)'),
                       ('notification','notification_channel_id_fkey','channel_id','feature(id)'),
                       ('notification','notification_status_id_fkey','status_id','feature(id)')

                  ) AS t(table_name, constraint_name, column_name, reference)
        LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c
                   WHERE c.conname = r.constraint_name
                     AND c.conrelid = format('public.%I', r.table_name)::regclass) THEN
        EXECUTE format('ALTER TABLE "public".%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s',
                           r.table_name, r.constraint_name, r.column_name, r.reference);
END IF;
END LOOP;
END
$do$;




-- ======================================================================================
-- 5. ÍNDICES
-- ======================================================================================

-- flight
CREATE INDEX IF NOT EXISTS idx_flight_board ON public.flight USING btree (airport_id, schedule_date, flight_direction_id, scheduled_time) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_flight_status ON public.flight USING btree (status_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_flight_external_ref ON public.flight USING btree (external_ref) WHERE (external_ref IS NOT NULL);
CREATE INDEX IF NOT EXISTS ix_flight_import_batch ON public.flight USING btree (flight_import_batch_id);
CREATE INDEX IF NOT EXISTS ix_flight_airline_date ON public.flight USING btree (airline_id, schedule_date);

-- recursos
CREATE INDEX IF NOT EXISTS idx_res_alloc_resource_time ON public.airport_resource_allocation USING btree (airport_resource_id, star_time, end_time) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS ix_airport_resource_sector ON public.airport_resource USING btree (airport_sector_id);
CREATE INDEX IF NOT EXISTS ix_res_alloc_history_alloc ON public.airport_resource_allocation_history USING btree (airport_resource_allocation_id, action_at DESC);
CREATE INDEX IF NOT EXISTS ix_res_alloc_history_flight ON public.airport_resource_allocation_history USING btree (flight_id, action_at DESC);

-- historial de vuelos
CREATE INDEX IF NOT EXISTS ix_flight_status_history_flight ON public.flight_status_history USING btree (flight_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS ix_flight_change_history_flight ON public.flight_change_history USING btree (flight_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_flight_timing_rule_lookup ON public.flight_timing_rule USING btree (airport_id, event_type_id, flight_direction_id, flight_type_id, priority) WHERE (is_active = true);

-- importación
CREATE INDEX IF NOT EXISTS ix_flight_import_batch_airport ON public.flight_import_batch USING btree (airport_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_flight_import_row_status ON public.flight_import_row USING btree (flight_import_batch_id, status_id);


-- sectores
CREATE INDEX IF NOT EXISTS ix_airport_sector_terminal ON public.airport_sector USING btree (terminal_id);

-- grupos / plantillas
CREATE UNIQUE INDEX IF NOT EXISTS ux_behavior_group_code ON public.behavior_group USING btree (COALESCE(airport_id, '00000000-0000-0000-0000-000000000000'::uuid), code);
CREATE INDEX IF NOT EXISTS ix_behavior_group_rule_group ON public.behavior_group_rule USING btree (behavior_group_id, sort_order);
CREATE INDEX IF NOT EXISTS ix_display_template_field_version ON public.display_template_field USING btree (display_template_version_id);
CREATE INDEX IF NOT EXISTS ix_display_template_widget_version ON public.display_template_widget USING btree (display_template_version_id);
CREATE INDEX IF NOT EXISTS ix_behavior_group_template_group ON public.behavior_group_template USING btree (behavior_group_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_text_translation ON public.text_translation USING btree (COALESCE(airport_id, '00000000-0000-0000-0000-000000000000'::uuid), text_key, language_id);

-- dispositivos
CREATE INDEX IF NOT EXISTS ix_device_airport_status ON public.device USING btree (airport_id, status_id) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS ix_device_behavior_group ON public.device USING btree (behavior_group_id);
CREATE INDEX IF NOT EXISTS ix_device_sector ON public.device USING btree (airport_sector_id);
CREATE INDEX IF NOT EXISTS ix_device_resource ON public.device USING btree (airport_resource_id);
CREATE INDEX IF NOT EXISTS idx_device_heartbeat ON public.device USING btree (last_heartbeat_at) WHERE (is_active = true);
CREATE UNIQUE INDEX IF NOT EXISTS ux_device_mac ON public.device USING btree (lower((mac_address)::text)) WHERE (mac_address IS NOT NULL AND is_active = true);
CREATE UNIQUE INDEX IF NOT EXISTS ux_device_video_wall_position ON public.device USING btree (video_wall_id, video_wall_position) WHERE (video_wall_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS ix_device_group_assign_hist ON public.device_group_assignment_history USING btree (device_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS ix_device_status_history_device ON public.device_status_history USING btree (device_id, started_at DESC);
CREATE INDEX IF NOT EXISTS ix_device_incident_device ON public.device_incident USING btree (device_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_incident_open ON public.device_incident USING btree (detected_at) WHERE (resolved_at IS NULL);

-- contenido
CREATE INDEX IF NOT EXISTS idx_ad_campaign_active ON public.ad_campaign USING btree (airport_id, start_date, end_date) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS ix_ad_campaign_item_campaign ON public.ad_campaign_item USING btree (ad_campaign_id, sort_order);

-- alertas
CREATE INDEX IF NOT EXISTS idx_emergency_alert_active ON public.emergency_alert USING btree (airport_id, started_at DESC) WHERE (ended_at IS NULL);
CREATE INDEX IF NOT EXISTS ix_emergency_alert_device_device ON public.emergency_alert_device USING btree (device_id);
CREATE INDEX IF NOT EXISTS ix_operational_alert_flight ON public.operational_alert USING btree (flight_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_operational_alert_airport ON public.operational_alert USING btree (airport_id, detected_at DESC);

-- seguridad
CREATE INDEX IF NOT EXISTS idx_audit_log_occurred ON public.audit_log USING btree (occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log USING btree (local_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log USING btree (action_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log USING btree (entity_name, entity_id);

-- monitoreo
CREATE INDEX IF NOT EXISTS idx_system_event_log_occurred ON public.system_event_log USING btree (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_event_log_level ON public.system_event_log USING btree (level_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_event_log_component ON public.system_event_log USING btree (component_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_pending ON public.notification USING btree (status_id, created_at);




-- ======================================================================================
-- 6. FUNCIONES Y TRIGGERS
-- ======================================================================================

-- 6.1 Validación de transición de estado del vuelo (GV-002) – solo aplica a estados FIDS
CREATE OR REPLACE FUNCTION public.fn_flight_status_validate()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
DECLARE
    v_group_id integer;
        v_from varchar;
        v_to varchar;
BEGIN
    IF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
        SELECT fg.id INTO v_group_id
        FROM feature_group AS fg
        WHERE trim(lower(fg.name)) = 'estados vuelo fids'
            LIMIT 1;

    IF v_group_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM feature WHERE id = OLD.status_id AND feature_group_id = v_group_id)
        AND EXISTS (SELECT 1 FROM feature WHERE id = NEW.status_id AND feature_group_id = v_group_id)
        AND NOT EXISTS (SELECT 1 FROM flight_status_transition AS t
                        WHERE t.from_status_id = OLD.status_id
                          AND t.to_status_id = NEW.status_id
                          AND t.is_active = true) THEN
        SELECT abbreviation INTO v_from FROM feature WHERE id = OLD.status_id;
    SELECT abbreviation INTO v_to FROM feature WHERE id = NEW.status_id;
            RAISE EXCEPTION 'Transición de estado no permitida para el vuelo % (%): % -> %',
                NEW.flight_identity, NEW.id, v_from, v_to;
END IF;

        NEW.status_updated_at := CURRENT_TIMESTAMP;
END IF;
RETURN NEW;
END;
$function$;

-- 6.2 Historial automático de estados (GV-004)
CREATE OR REPLACE FUNCTION public.fn_flight_status_history()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.status_id IS DISTINCT FROM OLD.status_id THEN
        INSERT INTO flight_status_history (flight_id, previous_status_id, new_status_id, source_id, changed_at,
                                           changed_by, estimated_time, actual_time, created_by, modified_by)
        VALUES (NEW.id,
                CASE WHEN TG_OP = 'UPDATE' THEN OLD.status_id END,
                NEW.status_id,
                NEW.status_source_id,
                COALESCE(NEW.status_updated_at, CURRENT_TIMESTAMP),
                COALESCE(NEW.modified_by, NEW.created_by),
                NEW.estimated_time,
                COALESCE(NEW.actual_block_time, NEW.actual_runway_time),
                COALESCE(NEW.modified_by, NEW.created_by),
                COALESCE(NEW.modified_by, NEW.created_by));
END IF;
RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_flight_status_validate ON public.flight;
CREATE TRIGGER trg_flight_status_validate
    BEFORE UPDATE OF status_id ON public.flight
    FOR EACH ROW EXECUTE FUNCTION public.fn_flight_status_validate();

DROP TRIGGER IF EXISTS trg_flight_status_history ON public.flight;
CREATE TRIGGER trg_flight_status_history
    AFTER INSERT OR UPDATE OF status_id ON public.flight
    FOR EACH ROW EXECUTE FUNCTION public.fn_flight_status_history();

-- 6.3 Historial de reasignación de pantallas a grupos (GB-002)
CREATE OR REPLACE FUNCTION public.fn_device_group_history()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.behavior_group_id IS NOT NULL
        AND (TG_OP = 'INSERT' OR NEW.behavior_group_id IS DISTINCT FROM OLD.behavior_group_id) THEN
        INSERT INTO device_group_assignment_history (device_id, previous_behavior_group_id, behavior_group_id,
                                                     assigned_at, assigned_by, created_by, modified_by)
        VALUES (NEW.id,
                CASE WHEN TG_OP = 'UPDATE' THEN OLD.behavior_group_id END,
                NEW.behavior_group_id,
                CURRENT_TIMESTAMP,
                COALESCE(NEW.modified_by, NEW.created_by),
                COALESCE(NEW.modified_by, NEW.created_by),
                COALESCE(NEW.modified_by, NEW.created_by));
END IF;
RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_device_group_history ON public.device;
CREATE TRIGGER trg_device_group_history
    AFTER INSERT OR UPDATE OF behavior_group_id ON public.device
    FOR EACH ROW EXECUTE FUNCTION public.fn_device_group_history();

-- 6.4 Historial de estado de dispositivos (DM-005): cierra el periodo anterior y abre uno nuevo
CREATE OR REPLACE FUNCTION public.fn_device_status_history()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
DECLARE
    v_now timestamp with time zone := CURRENT_TIMESTAMP;
BEGIN
    IF TG_OP = 'INSERT' OR NEW.status_id IS DISTINCT FROM OLD.status_id THEN
        UPDATE device_status_history
        SET ended_at = v_now,
            duration_seconds = EXTRACT(EPOCH FROM (v_now - started_at))::integer,
            updated_at = CURRENT_TIMESTAMP
        WHERE device_id = NEW.id
          AND ended_at IS NULL;

    INSERT INTO device_status_history (device_id, status_id, started_at, created_by, modified_by)
    VALUES (NEW.id, NEW.status_id, v_now, COALESCE(NEW.modified_by, NEW.created_by), COALESCE(NEW.modified_by, NEW.created_by));
END IF;
RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_device_status_history ON public.device;
CREATE TRIGGER trg_device_status_history
    AFTER INSERT OR UPDATE OF status_id ON public.device
    FOR EACH ROW EXECUTE FUNCTION public.fn_device_status_history();

-- 6.5 Validación de capacidad del video wall (DP-004) – parámetro MAX_MONITORS_VIDEO_WALL
CREATE OR REPLACE FUNCTION public.fn_device_video_wall_validate()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
DECLARE
    v_max integer;
        v_count integer;
BEGIN
    IF NEW.video_wall_id IS NOT NULL THEN
        v_max := COALESCE(public.fn_get_parameter('parametros dispositivos', 'MAX_MONITORS_VIDEO_WALL')::integer, 6);
    SELECT count(*) INTO v_count
    FROM device
    WHERE video_wall_id = NEW.video_wall_id
      AND is_active = true
      AND id <> NEW.id;
    IF v_count + 1 > v_max THEN
            RAISE EXCEPTION 'El video wall supera el máximo de % monitores', v_max;
END IF;
END IF;
RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_device_video_wall_validate ON public.device;
CREATE TRIGGER trg_device_video_wall_validate
    BEFORE INSERT OR UPDATE OF video_wall_id ON public.device
    FOR EACH ROW EXECUTE FUNCTION public.fn_device_video_wall_validate();

-- 6.6 Log de auditoría inmutable (SC-005)
CREATE OR REPLACE FUNCTION public.fn_audit_log_immutable()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
BEGIN
            RAISE EXCEPTION 'audit_log es inmutable: operación % no permitida', TG_OP;
END;
$function$;

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON public.audit_log;
CREATE TRIGGER trg_audit_log_immutable
    BEFORE UPDATE OR DELETE ON public.audit_log
                         FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_immutable();

DROP TRIGGER IF EXISTS trg_audit_log_no_truncate ON public.audit_log;
CREATE TRIGGER trg_audit_log_no_truncate
    BEFORE TRUNCATE ON public.audit_log
    FOR EACH STATEMENT EXECUTE FUNCTION public.fn_audit_log_immutable();


-- ======================================================================================
-- 7. VISTAS
-- ======================================================================================

-- Vista de vuelos para pantallas FIDS/GIDS/CIDS/BIDS, Staff Pages y API (PL-002, FV-004, IE-007)
CREATE OR REPLACE VIEW "public"."view_flight_fids" AS
SELECT f.id,
       f.airport_id,
       f.terminal_id,
       f.schedule_date,
       f.flight_direction_id,
       f.flight_type_id,
       f.connection_type_id,
       ct.abbreviation AS connection_type_code,
       f.flight_identity,
       f.public_iata_code,
       f.flight_number,
       al.id AS airline_id,
       al.iata_code AS airline_iata_code,
       al.oaci_code AS airline_icao_code,
       COALESCE(al.short_name, al.company_name) AS airline_name,
       al.logo_url AS airline_logo_url,
       f.origin_airport_code,
       f.destination_airprt_code AS destination_airport_code,
       oa.city AS other_airport_city,
       oa.name AS other_airport_name,
       f.scheduled_time,
       f.estimated_time,
       COALESCE(f.actual_block_time, f.actual_runway_time) AS actual_time,
       f.status_id,
       st.abbreviation AS status_code,
       COALESCE(st_es.short_text, st.description) AS status_es,
       st_en.short_text AS status_en,
       f.status_source_id,
       src.abbreviation AS status_source_code,
       f.status_updated_at,
       (SELECT string_agg(ar.code, ', ' ORDER BY ar.code)
        FROM airport_resource_allocation ra
                 JOIN airport_resource ar ON ar.id = ra.airport_resource_id
                 JOIN boarding_gate bg ON bg.resource_id = ar.id
        WHERE ra.flight_id = f.id AND ra.is_active = true) AS gate,
       (SELECT string_agg(ar.code, ', ' ORDER BY ar.code)
        FROM airport_resource_allocation ra
                 JOIN airport_resource ar ON ar.id = ra.airport_resource_id
                 JOIN checkin_counter cc ON cc.resource_id = ar.id
        WHERE ra.flight_id = f.id AND ra.is_active = true) AS counters,
       (SELECT string_agg(ar.code, ', ' ORDER BY ar.code)
        FROM airport_resource_allocation ra
                 JOIN airport_resource ar ON ar.id = ra.airport_resource_id
                 JOIN baggage_carousel bc ON bc.resource_id = ar.id
        WHERE ra.flight_id = f.id AND ra.is_active = true) AS belt,
       act.icao_code AS aircraft_type_icao,
       ac.registration AS aircraft_registration,
       f.remarks,
       f.is_displayed
FROM flight f
         LEFT JOIN airline al ON al.id = f.airline_id
         LEFT JOIN airport oa ON oa.id = f.other_airport_id
         LEFT JOIN feature st ON st.id = f.status_id
         LEFT JOIN feature_translation st_es ON st_es.feature_id = f.status_id AND st_es.language_id = public.fn_get_feature_id('idiomas', 'ES')
         LEFT JOIN feature_translation st_en ON st_en.feature_id = f.status_id AND st_en.language_id = public.fn_get_feature_id('idiomas', 'EN')
         LEFT JOIN feature ct ON ct.id = f.connection_type_id
         LEFT JOIN feature src ON src.id = f.status_source_id
         LEFT JOIN aircraft_type act ON act.id = f.aircraft_type_id
         LEFT JOIN aircraft ac ON ac.id = f.aircraft_id
WHERE f.is_active = true;

-- Vista de estado de dispositivos para el dashboard (MO-001, UC-14, UC-31)
CREATE OR REPLACE VIEW "public"."view_device_status" AS
SELECT d.id,
       d.airport_id,
       d.terminal_id,
       d.code,
       d.name,
       d.location_description,
       s.name AS sector_name,
       dt.abbreviation AS display_type,
       ds.abbreviation AS status_code,
       ds.description AS status_name,
       bg.code AS behavior_group_code,
       bg.name AS behavior_group_name,
       d.ip_address,
       d.last_heartbeat_at,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - d.last_heartbeat_at))::integer AS seconds_since_heartbeat,
    (d.last_heartbeat_at IS NULL OR d.last_heartbeat_at < CURRENT_TIMESTAMP
        - make_interval(mins => COALESCE(public.fn_get_parameter('parametros dispositivos', 'OFFLINE_THRESHOLD_MIN')::integer, 5))) AS is_heartbeat_lost,
    d.consecutive_errors,
    d.is_offline_mode,
    d.software_version,
    d.last_status_change_at,
    (SELECT dsh.started_at FROM device_status_history dsh
      WHERE dsh.device_id = d.id AND dsh.ended_at IS NULL
      ORDER BY dsh.started_at DESC LIMIT 1) AS current_status_since
FROM device d
    LEFT JOIN feature dt ON dt.id = d.display_type_id
    LEFT JOIN feature ds ON ds.id = d.status_id
    LEFT JOIN behavior_group bg ON bg.id = d.behavior_group_id
    LEFT JOIN airport_sector s ON s.id = d.airport_sector_id
WHERE d.is_active = true;

-- Vista de alertas de emergencia vigentes (MO-001, UC-31)
CREATE OR REPLACE VIEW "public"."view_active_emergency_alert" AS
SELECT ea.id,
       ea.airport_id,
       t.abbreviation AS alert_type_code,
       t.description AS alert_type_name,
       o.abbreviation AS origin_code,
       c.abbreviation AS coverage_code,
       st.abbreviation AS status_code,
       ea.started_at,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ea.started_at))::integer AS elapsed_seconds,
    ea.requested_by,
    (SELECT string_agg(s.name, ', ' ORDER BY s.name)
       FROM emergency_alert_sector eas
       JOIN airport_sector s ON s.id = eas.airport_sector_id
      WHERE eas.emergency_alert_id = ea.id) AS sectors,
    (SELECT count(*) FROM emergency_alert_device ead WHERE ead.emergency_alert_id = ea.id) AS devices_total,
    (SELECT count(*) FROM emergency_alert_device ead WHERE ead.emergency_alert_id = ea.id AND ead.displayed_at IS NOT NULL) AS devices_displaying
FROM emergency_alert ea
    JOIN feature t ON t.id = ea.alert_type_id
    JOIN feature o ON o.id = ea.origin_id
    JOIN feature c ON c.id = ea.coverage_id
    JOIN feature st ON st.id = ea.status_id
WHERE ea.ended_at IS NULL
  AND st.abbreviation IN ('PENDING', 'ACTIVE');












-- ======================================================================================
-- 8. DATOS INICIALES DEPENDIENTES
-- ======================================================================================

-- 8.1 Roles RBAC oficiales (SC-001)
INSERT INTO "public"."role" ("name",  "created_at", "modified_at", "created_by", "modified_by", "is_active")
SELECT v.name,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'script_fids', 'script_fids', true
FROM (VALUES
          ('ADMINISTRADOR FIDS'),
          ('OPERADOR_CCO'),
          ('AEROLINEA'),
          ('COMERCIAL'),
          ('AVSEC'),
          ('SOLO_LECTURA'),
          ('TECNICO_TI')
     ) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "public"."role" r WHERE upper(r.name) = v.name);

-- 8.2 Traducciones ES/EN de estados de vuelo (sección 6.3) y tipos de alerta
INSERT INTO "public"."feature_translation" ("feature_id", "language_id", "short_text", "long_text", "created_by", "modified_by")
SELECT public.fn_get_feature_id(v.group_name, v.code), public.fn_get_feature_id('idiomas', v.lang), v.short_text, v.long_text, 'script_fids', 'script_fids'
FROM (VALUES
          ('estados vuelo fids','SCH','ES','PROGRAMADO','Programado'),
          ('estados vuelo fids','SCH','EN','SCHEDULED','Scheduled'),
          ('estados vuelo fids','SCT','ES','CONFIRMADO','Confirmado'),
          ('estados vuelo fids','SCT','EN','CONFIRMED','Confirmed'),
          ('estados vuelo fids','GTO','ES','LLAMADA','Diríjase a la puerta'),
          ('estados vuelo fids','GTO','EN','CALL','Go to gate'),
          ('estados vuelo fids','BST','ES','EMBARCANDO','Embarcando'),
          ('estados vuelo fids','BST','EN','BOARDING','Boarding'),
          ('estados vuelo fids','BEN','ES','ULT LLAMADA','Última llamada'),
          ('estados vuelo fids','BEN','EN','LAST CALL','Last call'),
          ('estados vuelo fids','GCL','ES','FIN EMBARQ','Puerta cerrada'),
          ('estados vuelo fids','GCL','EN','GATE CLOSED','Gate closed'),
          ('estados vuelo fids','OFB','ES','FIN EMBARQ','Puerta cerrada'),
          ('estados vuelo fids','OFB','EN','GATE CLOSED','Gate closed'),
          ('estados vuelo fids','LAN','ES','ATERRIZO','Aterrizó'),
          ('estados vuelo fids','LAN','EN','LANDED','Landed'),
          ('estados vuelo fids','ONB','ES','ATERRIZO','Aterrizó'),
          ('estados vuelo fids','ONB','EN','LANDED','Landed'),
          ('estados vuelo fids','DEL','ES','DEMORADO','Demorado'),
          ('estados vuelo fids','DEL','EN','DELAYED','Delayed'),
          ('estados vuelo fids','DX','ES','CANCELADO','Cancelado'),
          ('estados vuelo fids','DX','EN','CANCELLED','Cancelled'),
          ('estados vuelo fids','DV','ES','DESVIADO','Desviado'),
          ('estados vuelo fids','DV','EN','DIVERTED','Diverted'),
          ('tipos alerta emergencia','EARTHQUAKE','ES','SISMO','Sismo'),
          ('tipos alerta emergencia','EARTHQUAKE','EN','EARTHQUAKE','Earthquake'),
          ('tipos alerta emergencia','FIRE','ES','INCENDIO','Incendio'),
          ('tipos alerta emergencia','FIRE','EN','FIRE','Fire'),
          ('tipos alerta emergencia','SILENT','ES','ALERTA','Alerta de seguridad'),
          ('tipos alerta emergencia','SILENT','EN','ALERT','Security alert'),
          ('tipos alerta emergencia','TSUNAMI','ES','TSUNAMI','Tsunami'),
          ('tipos alerta emergencia','TSUNAMI','EN','TSUNAMI','Tsunami')
     ) AS v(group_name, code, lang, short_text, long_text)
WHERE public.fn_get_feature_id(v.group_name, v.code) IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "public"."feature_translation" t
                  WHERE t.feature_id = public.fn_get_feature_id(v.group_name, v.code)
                    AND t.language_id = public.fn_get_feature_id('idiomas', v.lang));

-- 8.3 Textos fijos de pantallas (prototipos)
INSERT INTO "public"."text_translation" ("airport_id", "text_key", "language_id", "text_value", "context", "created_by", "modified_by")
SELECT NULL, v.text_key, public.fn_get_feature_id('idiomas', v.lang), v.text_value, v.context, 'script_fids', 'script_fids'
FROM (VALUES
          ('header.departures','ES','SALIDAS','FIDS'),
          ('header.departures','EN','DEPARTURES','FIDS'),
          ('header.arrivals','ES','LLEGADAS','FIDS'),
          ('header.arrivals','EN','ARRIVALS','FIDS'),
          ('header.connections','ES','CONEXIONES','FIDS'),
          ('header.connections','EN','CONNECTIONS','FIDS'),
          ('header.gate','ES','PUERTA DE EMBARQUE','GIDS'),
          ('header.gate','EN','BOARDING GATE','GIDS'),
          ('header.checkin','ES','CHECK-IN','CIDS'),
          ('header.checkin','EN','CHECK-IN','CIDS'),
          ('header.baggage','ES','CINTA','BIDS'),
          ('header.baggage','EN','BELT','BIDS'),
          ('label.next_flight','ES','PRÓXIMO VUELO','GIDS'),
          ('label.next_flight','EN','NEXT FLIGHT','GIDS'),
          ('footer.disclaimer','ES','La información de vuelos está sujeta a cambios sin previo aviso','FIDS'),
          ('footer.disclaimer','EN','Flight information is subject to change without notice','FIDS'),
          ('device.offline','ES','MODO OFFLINE — última información recibida','UC-16'),
          ('device.offline','EN','OFFLINE MODE — last received information','UC-16')
     ) AS v(text_key, lang, text_value, context)
WHERE NOT EXISTS (SELECT 1 FROM "public"."text_translation" t
                  WHERE t.airport_id IS NULL
                    AND t.text_key = v.text_key
                    AND t.language_id = public.fn_get_feature_id('idiomas', v.lang));

-- 8.4 Matriz de transiciones de estado (UC-02, UC-03, UC-22)
INSERT INTO "public"."flight_status_transition" ("from_status_id", "to_status_id", "applies_to_departure", "applies_to_arrival", "allowed_for_airline", "created_by", "modified_by")
SELECT public.fn_get_feature_id('estados vuelo fids', v.f),
       public.fn_get_feature_id('estados vuelo fids', v.t),
       v.dep, v.arr,
       (v.dep AND v.f IN ('SCT', 'GTO', 'BST', 'BEN', 'GCL', 'DEL') AND v.t IN ('BST', 'BEN', 'GCL', 'OFB')),
       'script_fids', 'script_fids'
FROM (VALUES
          -- salida: SCH -> SCT -> GTO -> BST -> BEN -> GCL/OFB (se permite avanzar saltando pasos)
          ('SCH','SCT',true,true), ('SCH','GTO',true,false), ('SCH','BST',true,false), ('SCH','BEN',true,false), ('SCH','GCL',true,false), ('SCH','OFB',true,false),
          ('SCT','GTO',true,false), ('SCT','BST',true,false), ('SCT','BEN',true,false), ('SCT','GCL',true,false), ('SCT','OFB',true,false),
          ('GTO','BST',true,false), ('GTO','BEN',true,false), ('GTO','GCL',true,false), ('GTO','OFB',true,false),
          ('BST','BEN',true,false), ('BST','GCL',true,false), ('BST','OFB',true,false),
          ('BEN','GCL',true,false), ('BEN','OFB',true,false),
          ('GCL','OFB',true,false),
          -- llegada: SCH -> SCT -> LAN/ONB
          ('SCH','LAN',false,true), ('SCH','ONB',false,true),
          ('SCT','LAN',false,true), ('SCT','ONB',false,true),
          ('LAN','ONB',false,true),
          -- contingencias DEL / DX / DV
          ('SCH','DEL',true,true), ('SCH','DX',true,true), ('SCH','DV',true,true),
          ('SCT','DEL',true,true), ('SCT','DX',true,true), ('SCT','DV',true,true),
          ('GTO','DEL',true,false), ('GTO','DX',true,false),
          ('BST','DEL',true,false), ('BST','DX',true,false),
          ('BEN','DEL',true,false), ('BEN','DX',true,false),
          ('DEL','SCT',true,true), ('DEL','DX',true,true), ('DEL','DV',true,true),
          ('DEL','GTO',true,false), ('DEL','BST',true,false), ('DEL','BEN',true,false), ('DEL','GCL',true,false), ('DEL','OFB',true,false),
          ('DEL','LAN',false,true), ('DEL','ONB',false,true)
     ) AS v(f, t, dep, arr)
WHERE public.fn_get_feature_id('estados vuelo fids', v.f) IS NOT NULL
  AND public.fn_get_feature_id('estados vuelo fids', v.t) IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "public"."flight_status_transition" x
                  WHERE x.from_status_id = public.fn_get_feature_id('estados vuelo fids', v.f)
                    AND x.to_status_id = public.fn_get_feature_id('estados vuelo fids', v.t));

-- 8.5 Los 12 grupos de comportamiento estándar de fábrica (sección 3.4.2, GB-001)
INSERT INTO "public"."behavior_group" ("airport_id", "code", "name", "description", "standard_number", "is_standard", "display_type_id",
                                       "content_type_id", "priority", "is_emergency", "max_flights", "created_by", "modified_by")
SELECT NULL, v.code, v.name, v.description, v.num, true,
       public.fn_get_feature_id('tipos pantalla', v.display_type),
       public.fn_get_feature_id('tipos contenido grupo', v.content_type),
       v.priority, v.is_emergency, v.max_flights, 'script_fids', 'script_fids'
FROM (VALUES
          (1,  'DEPARTURES',     'Salidas',                  'Solo vuelos de salida nacionales e internacionales. Zonas de prefiltros y post-filtros.', 'FIDS', 'DEPARTURES',     20, false, NULL::smallint),
          (2,  'ARRIVALS',       'Llegadas',                 'Solo vuelos de llegada. Zonas de migración y salas de stakeholders.',                      'FIDS', 'ARRIVALS',       20, false, NULL),
          (3,  'MIXED',          'Salidas y Llegadas',       'Alternancia de salidas y llegadas. Zonas de control central.',                             'FIDS', 'MIXED',          20, false, NULL),
          (4,  'DEPARTURES_INT', 'Salidas Internacionales',  'Solo vuelos de salida internacional.',                                                     'FIDS', 'DEPARTURES_INT', 20, false, NULL),
          (5,  'DEPARTURES_DOM', 'Salidas Nacionales',       'Solo vuelos de salida doméstica.',                                                         'FIDS', 'DEPARTURES_DOM', 20, false, NULL),
          (6,  'CONNECTIONS',    'Conexiones',               'Vuelos en conexión DOM-DOM, DOM-INT, INT-INT. Zona de conexiones.',                        'FIDS', 'CONNECTIONS',    20, false, NULL),
          (7,  'GATE',           'Embarque (Gate)',          'Información del vuelo asignado a la puerta. Incluye Call to Gate.',                         'GIDS', 'GATE',           10, false, 1),
          (8,  'CHECKIN',        'Check-in',                 'Mostradores asignados por vuelo y aerolínea.',                                              'CIDS', 'CHECKIN',        10, false, 2),
          (9,  'BAGGAGE',        'Equipaje (BIDS)',          'Cinta de reclamo asignada. Hasta 3 vuelos por cinta.',                                      'BIDS', 'BAGGAGE',        10, false, 3),
          (10, 'SIGNAGE',        'Dynamic Signage',          'Contenido comercial y publicidad. Programación por horario.',                               'DS',   'SIGNAGE',        50, false, NULL),
          (11, 'WAYFINDING',     'Wayfinding',               'Mapas de orientación y servicios del aeropuerto.',                                          'DS',   'WAYFINDING',     40, false, NULL),
          (12, 'EMERGENCY',      'Emergencia / Evacuación',  'Señaléticas y rutas de evacuación. Prioridad máxima, anula cualquier grupo.',              NULL,   'EMERGENCY',      0,  true,  NULL)
     ) AS v(num, code, name, description, display_type, content_type, priority, is_emergency, max_flights)
WHERE NOT EXISTS (SELECT 1 FROM "public"."behavior_group" bg WHERE bg.airport_id IS NULL AND bg.code = v.code);

-- 8.6 Despliegue de alertas por tipo de pantalla (regla UC-23: sismo solo en tótems)
INSERT INTO "public"."emergency_alert_display_rule" ("alert_type_id", "display_type_id", "created_by", "modified_by")
SELECT public.fn_get_feature_id('tipos alerta emergencia', v.alert_type), public.fn_get_feature_id('tipos pantalla', v.display_type), 'script_fids', 'script_fids'
FROM (VALUES
          ('EARTHQUAKE','DS'),
          ('FIRE','FIDS'), ('FIRE','GIDS'), ('FIRE','CIDS'), ('FIRE','BIDS'), ('FIRE','DS'),
          ('SILENT','FIDS'), ('SILENT','GIDS'), ('SILENT','CIDS'), ('SILENT','BIDS'), ('SILENT','DS'),
          ('TSUNAMI','FIDS'), ('TSUNAMI','GIDS'), ('TSUNAMI','CIDS'), ('TSUNAMI','BIDS'), ('TSUNAMI','DS')
     ) AS v(alert_type, display_type)
WHERE NOT EXISTS (SELECT 1 FROM "public"."emergency_alert_display_rule" r
                  WHERE r.alert_type_id = public.fn_get_feature_id('tipos alerta emergencia', v.alert_type)
                    AND r.display_type_id = public.fn_get_feature_id('tipos pantalla', v.display_type));

-- 8.7 Mensajes de emergencia base ES/EN (prototipo fids_emergency_alert)
INSERT INTO "public"."emergency_message_template" ("airport_id", "alert_type_id", "language_id", "title", "subtitle", "instructions", "ticker_text", "created_by", "modified_by")
SELECT NULL, public.fn_get_feature_id('tipos alerta emergencia', v.alert_type), public.fn_get_feature_id('idiomas', v.lang),
       v.title, v.subtitle, v.instructions::jsonb, v.ticker, 'script_fids', 'script_fids'
FROM (VALUES
          ('EARTHQUAKE','ES','SISMO','Alerta de emergencia','["EVACUACIÓN","AGÁCHESE","SIGA INSTRUCCIONES","NO USE EL ASCENSOR"]','SISMO DETECTADO – MANTENGA LA CALMA – SIGA LAS INDICACIONES DEL PERSONAL – DIRÍJASE A ZONAS SEGURAS'),
          ('EARTHQUAKE','EN','EARTHQUAKE','Emergency alert','["EVACUATE NOW","DROP AND COVER","FOLLOW STAFF","DO NOT USE LIFTS"]','EARTHQUAKE DETECTED – STAY CALM – FOLLOW STAFF INSTRUCTIONS – PROCEED TO SAFE AREAS'),
          ('FIRE','ES','EVACUAR – INCENDIO','Diríjase a la salida indicada','["EVACUACIÓN","NO USE EL ASCENSOR","SIGA INSTRUCCIONES"]','INCENDIO – EVACÚE POR LA SALIDA INDICADA'),
          ('FIRE','EN','EVACUATE – FIRE','Proceed to the indicated exit','["EVACUATE NOW","DO NOT USE LIFTS","FOLLOW STAFF"]','FIRE – EVACUATE THROUGH THE INDICATED EXIT'),
          ('SILENT','ES','EVACUAR','Siga las instrucciones del personal','["EVACUACIÓN","SIGA INSTRUCCIONES"]','DIRÍJASE A LA SALIDA INDICADA'),
          ('SILENT','EN','EVACUATE','Follow staff instructions','["EVACUATE NOW","FOLLOW STAFF"]','PROCEED TO THE INDICATED EXIT'),
          ('TSUNAMI','ES','TSUNAMI','Diríjase a zonas altas','["EVACUACIÓN","DIRÍJASE A ZONAS ALTAS","SIGA INSTRUCCIONES"]','ALERTA DE TSUNAMI – DIRÍJASE A ZONAS ALTAS'),
          ('TSUNAMI','EN','TSUNAMI','Move to higher ground','["EVACUATE NOW","MOVE TO HIGHER GROUND","FOLLOW STAFF"]','TSUNAMI WARNING – MOVE TO HIGHER GROUND')
     ) AS v(alert_type, lang, title, subtitle, instructions, ticker)
WHERE NOT EXISTS (SELECT 1 FROM "public"."emergency_message_template" m
                  WHERE m.airport_id IS NULL
                    AND m.alert_type_id = public.fn_get_feature_id('tipos alerta emergencia', v.alert_type)
                    AND m.language_id = public.fn_get_feature_id('idiomas', v.lang));

-- 8.8 Botonera virtual global (UC-22: Embarcando, Última llamada, Fin de embarque, Puerta cerrada)
INSERT INTO "public"."virtual_keypad_button" ("airport_id", "airline_id", "target_status_id", "label_es", "label_en", "color", "sort_order", "requires_confirmation", "created_by", "modified_by")
SELECT NULL, NULL, public.fn_get_feature_id('estados vuelo fids', v.status), v.label_es, v.label_en, v.color, v.sort_order, v.confirm, 'script_fids', 'script_fids'
FROM (VALUES
          ('BST', 'Embarcando',      'Boarding',    '#00CC66', 1, false),
          ('BEN', 'Última llamada',  'Last call',   '#FF4400', 2, false),
          ('GCL', 'Fin de embarque', 'Gate closed', '#999999', 3, true),
          ('OFB', 'Puerta cerrada',  'Off-block',   '#C00000', 4, true)
     ) AS v(status, label_es, label_en, color, sort_order, confirm)
WHERE NOT EXISTS (SELECT 1 FROM "public"."virtual_keypad_button" b
                  WHERE b.airport_id IS NULL AND b.airline_id IS NULL
                    AND b.target_status_id = public.fn_get_feature_id('estados vuelo fids', v.status));




