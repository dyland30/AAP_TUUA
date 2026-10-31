
CREATE TABLE aircraft_type (
                               id  uuid default uuidv7() not null primary key,
                               icao_code         varchar(4) NOT NULL UNIQUE,      -- 'A320', 'B738'
                               iata_code         varchar(3),                      -- '320', '738'
                               manufacturer_id      int NOT NULL references feature(id), -- Feature Group Name: Fabricante - Aircraft
                               model             text NOT NULL,
                               size_code_id         int NOT NULL references feature(id), -- Feature Group Name: Aircraft Size Codes
                               wingspan_m        numeric(5,2),
                               length_m          numeric(5,2),
                               max_seats         integer,
                               is_widebody       boolean NOT NULL DEFAULT false,
                               is_active boolean not null default true,
                               "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                               "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                               "created_by" character varying(50),
                               "modified_by" character varying(50)
);

CREATE TABLE aircraft (
                          id       uuid default uuidv7() not null primary key,
                          registration      varchar(20) NOT NULL UNIQUE,     -- matrícula, ej. 'OB-2123'
                          aircraft_type_id  uuid NOT NULL REFERENCES aircraft_type (id),
                          operator_id       uuid REFERENCES airline (id),
                          seat_count        integer,
                          is_active boolean not null default true,
                          "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                          "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                          "created_by" character varying(50),
                          "modified_by" character varying(50)
);

CREATE TABLE flight(
                       id uuid default uuidv7() not null primary key,
                       airport_id uuid not null references airport(id), --aeropuerto base de la operacion
                       terminal_id uuid not null references terminal(id), --terminal del aeropuerto base de la operacion
                       location_id uuid not null references location(id), -- sede base de la operacion
                       other_airport_id uuid not null references airport(id), -- origen (ARR) o destino (DEP)
                       origin_airport_code varchar(5) not null,
                       destination_airprt_code varchar(5) not null,
                       flight_direction_id int not null references feature(id), -- Feature Group Name: Tipo Operación Vuelo
                       service_type_id int not null references feature(id), -- Feature Group Name: Tipo Servicio IATA
                       aircraft_type_id uuid references aircraft_type(id),
                       aircraft_id uuid references aircraft(id),
                       airline_id uuid references airline(id),
                       public_iata_code varchar(5),
                       operational_iata_code varchar(5),
                       flight_number varchar(5),
                       flight_identity varchar(10),
                       schedule_date date not null,
                       scheduled_time       timestamptz NOT NULL,         -- STA / STD
                       estimated_time       timestamptz,                  -- ETA / ETD (o EIBT / EOBT)
                       actual_runway_time   timestamptz,                  -- ALDT / ATOT
                       actual_block_time    timestamptz,                  -- AIBT / AOBT
                       status_id            int not null references feature(id), -- Feature Group Name: Estados de Vuelo
                       runway_id   uuid references runway(id),
                       diverted_to_id uuid references airport(id), -- Desviado a Aerpuerto
                       remarks text,
                       is_active boolean not null default true,
                       "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                       "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                       "created_by" character varying(50),
                       "modified_by" character varying(50)
);

CREATE TABLE turnaround (
                            id uuid default uuidv7() not null primary key,
                            arrival_flight_id uuid references flight(id),
                            departure_flight_id uuid references flight(id),
                            min_ground_time int,
                            "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                            "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                            "created_by" character varying(50),
                            "modified_by" character varying(50)
);

CREATE TABLE flight_codeshare (
                                  flight_id uuid not null references flight(id),
                                  airline_id uuid not null references airline(id),
                                  flight_identity varchar(10) not null,
                                  primary key (flight_id,airline_id,flight_identity)
);