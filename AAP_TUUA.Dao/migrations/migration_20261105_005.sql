create table money_exchange_operation(
         id  uuid default uuidv7() not null primary key,
         cashier_machine_session_id uuid not null references cashier_machine_session(id),
         operation_date timestamp not null,
         operation_type char(1) not null, -- S --> Sale, P --> Purchase
         local_currency_id int not null references feature(id), -- Feature Group Name: Monedas
         foreign_currency_id int not null references feature(id), -- Feature Group Name: Monedas
         exchange_rate_id uuid not null references exchange_rate(id),
         applied_exchange_rate decimal(10,3) not null, -- puede ser purchase_exchange_rate o sales_exchange_rate segun operation_type
         local_currency_amount decimal(12,2) not null,
         foreign_currency_amount decimal(12,2) not null,
         "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
         "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
         "created_by" character varying(50),
         "modified_by" character varying(50)
);

alter table cash_flow
    add money_exchange_operation_id uuid references money_exchange_operation(id);
