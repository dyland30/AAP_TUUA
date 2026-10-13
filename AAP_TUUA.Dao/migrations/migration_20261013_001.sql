alter table public.airline
    add column legal_name varchar(200) -- razon social
;


create table public.cashier_machine (
    code varchar(20) not null, --formado por: 'CAJA-'+upper(isnull(airport(iata_code),'000')) +"-"+ upper(trim(isnull(terminal_name,'00'))) +"-"+  sequential (4 chars like 0001),
    location_id uuid null references location(id),
    terminal_id uuid null references terminal(id),
    is_active boolean not null default true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    constraint pk_cashier_machine primary key(code)
);


create table public.document_serial_group(
    id uuid default uuidv7() not null,
    document_type_id int  not null references feature(id),  -- Feature Group Name: Tipos Documentos TUUA
    seae_type_id int  not null references feature(id), -- Feature Group Name: Tipo Representación SEAE
    sale_type_id int  not null references feature(id), -- Feature Group Name: Modalidad de Venta TUUA
    serial_prefix varchar(2) not null,
    cashier_code varchar(20) not null references cashier_machine(code),
    serial_start int not null, --validate the ranges of serial_start and serial_end dont colide for the same prefix
    serial_end varchar(5) not null,
    is_active boolean not null default true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    constraint pk_document_serial_group primary key(id)
);


create table public.document_sequential_numbers(
    id uuid default uuidv7() not null,
    document_serial_group_id uuid not null references document_serial_group(id),
    serial_number int not null, -- the serial field will be calculated in the backend by serial_prefix +  LPAD(serial_number,4, '0')
    max_sequential_number bigint not null,
    is_active boolean not null default true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    constraint pk_document_sequential_numbers primary key(id)

);
