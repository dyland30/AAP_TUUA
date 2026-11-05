create table local_user_cashier_machine(
   local_user_id uuid references local_user(id),
   cashier_machine_code varchar(20) references cashier_machine(code),
   "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
   "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
   "created_by" character varying(50),
   "modified_by" character varying(50),
   constraint pk_local_user_cashier_machine primary key (local_user_id, cashier_machine_code)
);