
create table exchange_rate(
                              id  uuid default uuidv7() not null primary key,
                              day date not null,
                              base_currency_id int not null references feature(id), -- Feature Group Name: Monedas
                              target_currency_id int not null references feature(id),-- Feature Group Name: Monedas
                              purchase_exchange_rate decimal(10,3) not null,
                              sales_exchange_rate decimal(10,3) not null,
                              is_active boolean not null default true,
                              "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                              "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                              "created_by" character varying(50),
                              "modified_by" character varying(50)
);


create table cashier_machine_session(
                                        id  uuid default uuidv7() not null primary key,
                                        cashier_machine_code varchar(20) not null references cashier_machine(code),
                                        local_user_id uuid not null references local_user(id),
                                        start_time timestamp not null,
                                        end_time timestamp,
                                        status_id int not null references feature(id), --  Feature Group Name: Estados Turno Caja
                                        is_active boolean not null default true,
                                        "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                        "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                        "created_by" character varying(50),
                                        "modified_by" character varying(50)
);




create table tuua_sales_operation(
                                     id  uuid default uuidv7() not null primary key,
                                     cashier_machine_session_id uuid not null references cashier_machine_session(id),
                                     operation_date timestamp not null,
                                     document_type_id int not null references feature(id), -- Feature Group Name: Tipos Documentos TUUA
                                     seae_type_id int not null references feature(id), -- Feature Group Name: Tipo Representación SEAE
                                     sale_type_id int not null references feature(id), -- Feature Group Name: Modalidad de Venta TUUA
                                     currency_id int not null references feature(id), -- Feature Group Name: Monedas

                                     flight_type_id int references feature(id),--  Feature Group Name: Tipos de Vuelo
                                     airline_id uuid references airline(id),
                                     flight_number varchar(10),
                                     flight_date date,
                                     flight_id uuid references flight(id),
                                     titular_passenger_name varchar(100),
                                     passenger_email varchar(100),

                                     exchange_rate_id uuid not null references exchange_rate(id),
                                     purchase_exchange_rate decimal(10,3) not null,
                                     sales_exchange_rate decimal(10,3) not null,

                                     payment_type_id int not null references feature(id), -- Feature Group Name: Tipos de Pago
                                     status_id int not null references feature(id), -- Feature Group Name: Estados Operacion Venta

                                     ticket_quantity int not null,
                                     unit_price decimal(12,2) not null,
                                     tuua_price_id uuid not null references tuua_price(id),

                                     subtotal decimal(12,2) not null,
                                     total decimal(12,2) not null,
                                     igv_tax_amount decimal(12,2) not null,

    -- cash
                                     cash_amount_payed decimal(12,2),
                                     cash_change decimal(12,2),
    --credit card
                                     payment_id varchar(100) null,
                                     payment_authorization varchar(100) null,
                                     payment_card_brand varchar(50) null,
                                     payment_holder_name varchar(100) null,
                                     payment_status varchar(50) null,
                                     payment_amount decimal(10, 2) null,
                                     payment_currency varchar(10) null,
                                     payment_date timestamp null,
                                     payment_response text null,

                                     "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                     "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                     "created_by" character varying(50),
                                     "modified_by" character varying(50)

);

create table tuua_ticket(
                            id  uuid default uuidv7() not null primary key,
                            tuua_sales_operation_id uuid references tuua_sales_operation(id),
                            document_sequential_numbers_id uuid  not null references document_sequential_numbers(id),
                            tuua_gate_code varchar(20) references tuua_gate(code), -- se completa cuando se lee en el egate
                            serial varchar(10) not null,
                            sequential_number bigint not null,
                            hash_ticket varchar(100) not null, -- hash unico del ID, formado por TKT-<HASH>
                            status_id int not null references feature(id), -- Feature Group Name: Estados Ticket TUUA
                            price decimal(12,2) not null,
                            subtotal decimal(12,2) not null,
                            total decimal(12,2) not null,
                            igv_tax_amount decimal(12,2) not null,
                            utilization_date timestamp,
                            due_date date,

                            "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                            "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                            "created_by" character varying(50),
                            "modified_by" character varying(50)

);


create table cash_flow(
                          id  uuid default uuidv7() not null primary key,
                          cashier_machine_session_id uuid not null references cashier_machine_session(id),
                          tuua_sales_operation_id uuid references tuua_sales_operation(id),
                          direction char(1) not null, -- I --> Ingreso, E --> Egreso
                          operator smallint not null, -- -1 para Egreso y 1 para Ingreso
                          payment_type_id int not null references feature(id), -- Feature Group Name: Tipos de Pago
                          currency_id int not null references feature(id), -- Feature Group Name: Monedas
                          amount decimal(18,2) not null,
                          reference_code varchar(50),
                          observation varchar(500),
                          is_active boolean not null default true,
                          "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                          "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                          "created_by" character varying(50),
                          "modified_by" character varying(50)
);



