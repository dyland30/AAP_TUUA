
-- ======================================================================================
-- 2. AMPLIACIÓN DE TABLAS EXISTENTES
-- ======================================================================================

-- flight: 
ALTER TABLE "public"."flight" ADD COLUMN IF NOT EXISTS "connection_type_id" integer;
ALTER TABLE "public"."flight" ADD COLUMN IF NOT EXISTS "status_source_id" integer;
ALTER TABLE "public"."flight" ADD COLUMN IF NOT EXISTS "status_updated_at" timestamp with time zone;
ALTER TABLE "public"."flight" ADD COLUMN IF NOT EXISTS "external_ref" character varying(50);
ALTER TABLE "public"."flight" ADD COLUMN IF NOT EXISTS "flight_import_batch_id" uuid;
ALTER TABLE "public"."flight" ADD COLUMN IF NOT EXISTS "is_displayed" boolean DEFAULT true NOT NULL;

-- airline: logo y presentación
ALTER TABLE "public"."airline" ADD COLUMN IF NOT EXISTS "short_name" character varying(50);
ALTER TABLE "public"."airline" ADD COLUMN IF NOT EXISTS "logo_url" character varying(500);
ALTER TABLE "public"."airline" ADD COLUMN IF NOT EXISTS "logo_media_asset_id" uuid;
ALTER TABLE "public"."airline" ADD COLUMN IF NOT EXISTS "brand_color" character varying(9);

-- airport_resource: sector físico (alertas por sector, wayfinding, reglas por sector)
ALTER TABLE "public"."airport_resource" ADD COLUMN IF NOT EXISTS "airport_sector_id" uuid;

-- airport_resource_allocation: tiempos reales, orden en BIDS y logo activo (AR-002, AR-003, AR-005)
ALTER TABLE "public"."airport_resource_allocation" ADD COLUMN IF NOT EXISTS "actual_start_time" timestamp without time zone;
ALTER TABLE "public"."airport_resource_allocation" ADD COLUMN IF NOT EXISTS "actual_end_time" timestamp without time zone;
ALTER TABLE "public"."airport_resource_allocation" ADD COLUMN IF NOT EXISTS "display_order" smallint;
ALTER TABLE "public"."airport_resource_allocation" ADD COLUMN IF NOT EXISTS "is_auto_calculated" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."airport_resource_allocation" ADD COLUMN IF NOT EXISTS "display_airline_id" uuid;

