create table company(
                        id  uuid default uuidv7() not null primary key,
                        company_name varchar(200) not null,
                        business_name varchar(200) not null, -- razon social
                        document_number varchar(20), -- RUC
                        address varchar(200),
                        is_active boolean not null default true,
                        "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                        "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                        "created_by" character varying(50),
                        "modified_by" character varying(50)
);

alter table local_user
    add company_id uuid references company(id);