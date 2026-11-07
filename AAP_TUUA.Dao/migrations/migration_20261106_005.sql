create index if not exists idx_tuua_ticket_hash
    on public.tuua_ticket (hash_ticket);

-- Llaves de Destrabe
create table if not exists tuua_gate_unlock_keys(
    id  uuid default uuidv7() not null primary key,
    user_id uuid not null references local_user(id),
    code varchar(50) not null, --formed by the value of feature of type_id concatenated with the hash of (user_id concat with created_at string)
    type_id int not null references feature(id), -- Feature Group Name: Tipos de Llaves de Destrabe
    is_active boolean not null default true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50)
    );

-- Historia de uso de llaves de destrabe
create table if not exists tuua_gate_unlock_keys_usage_history(
    id  uuid default uuidv7() not null primary key,
    tuua_gate_unlock_keys_id uuid references tuua_gate_unlock_keys(id),
    usage_date timestamp not null,
    tuua_gate_code varchar(20) not null references tuua_gate(code),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50)
);