create index idx_feature_group_lookup
on feature_group (name);

create index idx_feature_lookup
on feature (feature_group_id, is_active);

create table public.tuua_price(
    id uuid default uuidv7() NOT NULL,
    flight_type_id int not null references feature(id),
    location_id uuid not null references location(id),
    terminal_id uuid not null references terminal(id), --en frontend: seleccion en cascada Sede --> Aeropuerto --> Terminal
    currency_id int not null references feature(id),
    price decimal(10,2) not null,
    date_start date not null,
    date_end date null,
    is_active boolean not null default true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    constraint pk_tuua_price primary key (id)
);
CREATE INDEX idx_tuua_price_lookup
on tuua_price (is_active, flight_type_id,location_id, terminal_id, date_start, date_end);


create table public.boardingpass_dae_seae(
    id bigint generated always as identity not null,
    document_sequential_numbers_id uuid  not null references document_sequential_numbers(id),
    serial varchar(10) not null,
    sequential_number bigint not null,
    tuua_gate_code varchar(20) not null references tuua_gate(code),
    flight_type_id int not null references feature(id),
    airline_id uuid not null references airline(id),
    price decimal(10,2) not null,
    currency_id int not null references feature(id),
    status_id int not null references feature(id),
    flight_number varchar(10) not null,
    flight_date date not null,
    passenger_name varchar(30) not null,
    seat_number varchar(10),
    pnr varchar(20),
    checkin_sequence_number int,
    origin_airport_code varchar(10) not null,
    destination_airport_code varchar(10) not null,
    passenger_status varchar(2) not null,
    str_bcbp varchar(200),
    ose_status_id int  references feature(id),
    ose_response varchar(500),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    constraint pk_boardingpass_dae_seae primary key(id)
);

CREATE INDEX idx_boardingpass_dae_seae_lookup
on boardingpass_dae_seae (flight_date, flight_number, seat_number, passenger_name, checkin_sequence_number);
