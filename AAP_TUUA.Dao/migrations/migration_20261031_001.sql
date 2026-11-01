create table airport_resource_allocation(
                                           id uuid default uuidv7() not null primary key,
                                           airport_resource_id uuid not null references airport_resource(id),
                                           flight_id uuid references flight(id),
                                           turnaround_id uuid  references turnaround(id),
                                           airline_id uuid references airline(id),
                                           star_time timestamp not null,
                                           end_time timestamp null,
                                           status_id int not null references feature(id), -- Feature Group Name: ESTADO ASIGNACION RECURSOS
                                           is_shared       boolean NOT NULL DEFAULT false,   -- ej. faja compartida por dos vuelos
                                           notes           text,
                                           is_active boolean not null default true,
                                           "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                           "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                           "created_by" character varying(50),
                                           "modified_by" character varying(50)

);

CREATE INDEX ix_res_alloc_flight     ON airport_resource_allocation (flight_id);
CREATE INDEX ix_res_alloc_turnaround ON airport_resource_allocation (turnaround_id);