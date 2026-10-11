CREATE TABLE "public"."feature_group" (
    "id" integer generated always as identity NOT NULL,
    "name" character varying(50),
    "description" character varying(200),
    "created_by" character varying(50),
    "created_date" timestamp without time zone,
    "modified_by" character varying(50),
    "modified_date" timestamp without time zone,
    CONSTRAINT "feature_group_pk" PRIMARY KEY (id)
);


CREATE TABLE "public"."feature" (
    "id" integer generated always as identity  NOT NULL,
    "description" character varying(500),
    "abbreviation" character varying(50),
    "feature_value" character varying(8000),
    "is_active" boolean DEFAULT true NOT NULL,
    "parent_id" integer,
    "feature_group_id" integer NOT NULL,
    "created_by" character varying(50),
    "created_date" timestamp without time zone,
    "modified_by" character varying(50),
    "modified_date" timestamp without time zone,
    CONSTRAINT "feature_pk" PRIMARY KEY (id),
    CONSTRAINT fk_feature_group FOREIGN KEY (feature_group_id)
                                references feature_group (id)
);


CREATE TABLE "public"."local_user" (
    "id" uuid default uuidv7() NOT NULL,
    "name" character varying(100) NOT NULL,
    "email" character varying(100) NOT NULL,
    "password_salt" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "password_reset_token" character varying(255),
    "password_reset_token_expires_at" timestamp without time zone,
    "created_at" timestamp without time zone NOT NULL,
    "modified_at" timestamp without time zone NOT NULL,
    "created_by" character varying(50) NOT NULL,
    "modified_by" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "verification_code" character varying(255),
    "reset_password_code" character varying(255),
    "last_login_at" timestamp without time zone,
     is_external boolean default false not null,
     CONSTRAINT "local_user_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."role" (
    "id" uuid default uuidv7() NOT NULL,
    "name" character varying(20) NOT NULL,
    "created_at" timestamp without time zone NOT NULL,
    "modified_at" timestamp without time zone NOT NULL,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "role_name_key" UNIQUE (name),
    CONSTRAINT "role_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."user_role" (
    "user_id" uuid NOT NULL references local_user (id),
    "role_id" uuid NOT NULL references role (id),
    "created_at" timestamp without time zone NOT NULL,
    "modified_at" timestamp without time zone NOT NULL,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "user_role_pkey" PRIMARY KEY (user_id, role_id)
);

CREATE TABLE "public"."resource" (
    "id" uuid default uuidv7() NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" character varying(200) NOT NULL,
    "type" character varying(20) NOT NULL,
    "path" character varying(100) NOT NULL,
    "method" character varying(20) NOT NULL,
    "parent_id" uuid,
    "created_at" timestamp without time zone NOT NULL,
    "modified_at" timestamp without time zone NOT NULL,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    "weight" integer,
    "icon" character varying(100),
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "resource_pkey" PRIMARY KEY (id)
);


CREATE TABLE "public"."role_resource" (
    "role_id" uuid NOT NULL references role(id),
    "resource_id" uuid NOT NULL references resource(id),
    "created_at" timestamp without time zone NOT NULL,
    "modified_at" timestamp without time zone NOT NULL,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "role_resource_pkey" PRIMARY KEY (role_id, resource_id)
);



CREATE TABLE "public"."role_resource_permission" (
    "role_id" uuid NOT NULL,
    "resource_id" uuid NOT NULL,
    "permission_id" integer NOT NULL references feature(id),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT "role_resource_permission_pkey" PRIMARY KEY (role_id, resource_id, permission_id),
    CONSTRAINT fk_role_resource_permission FOREIGN KEY (role_id,resource_id) references role_resource (role_id, resource_id)
);


CREATE TABLE public.airline (
	id uuid default uuidv7() not null,
	company_name varchar(100),
	ruc varchar(30),
	cod_sap varchar(100),
	oaci_code varchar(5),
	iata_code varchar(5),
	is_active boolean NOT NULL DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    CONSTRAINT airline_pk PRIMARY KEY (id)
);



CREATE TABLE public.airport(
    id uuid default uuidv7() not null,
    iata_code varchar(5),
    oaci_code varchar(5),
    "name" varchar(500),
    city  varchar(200),
    region varchar(200),
    country_code varchar(5),
    ubigeo varchar(10),
    latitude decimal(10,6),
    longitude decimal(10,6),
    elevation_m int,
    elevation_f int,
    timezone varchar(100),
    airport_type varchar(100),
    is_active boolean not null default true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    constraint airport_pk primary key (id)

);


CREATE TABLE "public"."ubigeo_departamento" (
    "codigo" character varying(10) NOT NULL,
    "nombre" character varying(100) NOT NULL,
    CONSTRAINT "ubigeo_departamento_pk" PRIMARY KEY (codigo)
);

CREATE TABLE "public"."ubigeo_distrito" (
    "codigo" character varying(10) NOT NULL,
    "codigo_provincia" character varying(10) NOT NULL,
    "nombre" character varying(100) NOT NULL,
    CONSTRAINT "ubigeo_distrito_pk" PRIMARY KEY (codigo)
);

CREATE TABLE "public"."ubigeo_provincia" (
    "codigo" character varying(10) NOT NULL,
    "codigo_departamento" character varying(10) NOT NULL,
    "nombre" character varying(100) NOT NULL,
    CONSTRAINT "ubigeo_provincia_pk" PRIMARY KEY (codigo)
);

CREATE TABLE public.location  --sede
(
    id uuid default uuidv7() not null,
    airport_id uuid references airport(id),
    "name" varchar(500),
    description varchar(500),
    ubigeo varchar(10),
    constraint location_pk primary key (id)
);




CREATE OR REPLACE VIEW "public"."view_role_resource_permission_expanded" AS
 SELECT rrp.role_id,
    rrp.resource_id,
    rrp.permission_id,
    rrp.is_active,
    rrp.created_at,
    rrp.updated_at,
    rrp.created_by,
    rrp.modified_by,
    f.description AS permission_name,
    res.name AS resource_name,
    ro.name AS role_name
   FROM role_resource_permission rrp
     JOIN feature f ON rrp.permission_id = f.id
     JOIN resource res ON rrp.resource_id = res.id
     JOIN role ro ON rrp.role_id = ro.id;;



CREATE OR REPLACE VIEW "public"."view_resource_expanded" AS
 SELECT ch.id,
    ch.name,
    ch.description,
    pa.description AS parent_description,
    ch.type,
    ch.path,
    ch.method,
    ch.parent_id,
    ch.created_at,
    ch.modified_at,
    ch.created_by,
    ch.modified_by,
    ch.weight,
    ch.icon,
    ch.is_active
   FROM resource ch
     LEFT JOIN resource pa ON ch.parent_id = pa.id;;
