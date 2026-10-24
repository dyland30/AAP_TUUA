
create table public.runway(
                              id uuid default uuidv7() not null,
                              airport_id uuid not null references airport(id),
                              designator varchar(10) not null,
                              length_m integer,
                              width_m  integer,
                              surface text,
                              status_id int not null references feature(id), -- Feature Group Name: Estado de Recursos
                              is_active boolean not null default true,
                              "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                              "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                              "created_by" character varying(50),
                              "modified_by" character varying(50),
                              constraint pk_runway primary key(id)

);



create table public.airport_resource(
                                        id uuid default uuidv7() not null,
                                        resource_type_id int not null references feature(id), -- Feature Group Name: Tipos de Recursos
                                        terminal_id uuid not null references terminal(id),
                                        flight_type_id int not null references feature(id), -- Feature Group Name: Tipos de Vuelo
                                        status_id int not null references feature(id), -- Feature Group Name: Estado de Recursos
                                        code varchar(20) not null,
                                        name text,
                                        is_active boolean not null default true,
                                        "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                        "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                        "created_by" character varying(50),
                                        "modified_by" character varying(50),
                                        constraint pk_resource primary key(id)
);

-- stand se hereda de recursos
create table public.stand
(
    resource_id uuid default uuidv7() not null primary key references airport_resource (id),
    is_contact boolean not null default true,
    max_aircraft_size_type int not null references feature(id), -- Feature Group Name: Aircraft Size Codes
    max_wingspan_m numeric (5,2),
    has_fixed_gpu      boolean NOT NULL DEFAULT false, -- 400 Hz
    has_pca            boolean NOT NULL DEFAULT false, -- aire preacondicionado
    has_fuel_hydrant   boolean NOT NULL DEFAULT false
);


-- boarding gate se hereda de recursos
create table public.boarding_gate(
                                     resource_id uuid default uuidv7() not null primary key references airport_resource(id),
                                     boarding_type_id int not null references feature(id), -- Feature Group Name: Tipo de Embarque
                                     default_stand_id uuid references stand(resource_id),
                                     is_active boolean not null default true,
                                     "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                     "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                     "created_by" character varying(50),
                                     "modified_by" character varying(50)
);

--hereda de recursos
CREATE TABLE passenger_loading_bridge(
                                         resource_id uuid default uuidv7() not null primary key references airport_resource(id),
                                         boarding_gate_id uuid not null references boarding_gate(resource_id),
                                         stand_id uuid not null references stand(resource_id),
                                         bridge_type_id int not null references feature(id), -- Feature Group Name: Tipos de PLB
                                         door_position       varchar(4),                    -- 'L1', 'L2', 'UD' (upper deck)
                                         max_aircraft_size_id   int not null references feature(id),  -- Feature Group Name: Aircraft Size Codes
                                         min_sill_height_m   numeric(4,2),
                                         max_sill_height_m   numeric(4,2),
                                         has_pca             boolean NOT NULL DEFAULT false,
                                         has_gpu_400hz       boolean NOT NULL DEFAULT false,
                                         manufacturer        text,
                                         serial_number       text
);


create table public.checkin_counter(
                                       resource_id uuid default uuidv7() not null primary key references airport_resource(id),
                                       terminal_id uuid not null references terminal(id),
                                       island varchar(10) not null,
                                       counter_type_id int not null references feature(id), -- Feature Group Name: Tipo de Checkin
                                       has_baggage_belt   boolean NOT NULL DEFAULT true,
                                       is_common_use      boolean NOT NULL DEFAULT true  -- CUTE / CUPPS
);


create table public.baggage_carousel(
                                        resource_id uuid default uuidv7() not null primary key references airport_resource(id),
                                        terminal_id uuid not null references terminal(id),
                                        carousel_function_id int not null references feature(id), -- Feature Group Name: Función Faja de Equipaje
                                        belt_length_m      numeric(6,2)
);

CREATE TABLE resource_outage (
                                 id uuid default uuidv7() not null,
                                 resource_id   uuid NOT NULL REFERENCES airport_resource (id) ON DELETE CASCADE,
                                 start_date    timestamp without time zone ,
                                 end_date timestamp without time zone,
                                 reason        text NOT NULL,
                                 is_planned    boolean NOT NULL DEFAULT true,
                                 is_active boolean not null default true,
                                 "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                 "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                 "created_by" character varying(50),
                                 "modified_by" character varying(50)
);

