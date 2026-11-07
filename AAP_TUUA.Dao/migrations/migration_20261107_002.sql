-- Cierre de turno y cuadre de caja
-- 1. Estado "Cerrado" en el catálogo "Estados Turno Caja" (idempotente)
-- 2. Tablas del cuadre: cabecera por turno y detalle por moneda / tipo de pago
-- 3. Recurso de menú /close_cashier_session
BEGIN;

-- 1. Catálogos ---------------------------------------------------------------------------------
DO $$
DECLARE
    v_group_id integer;
    v_item record;
BEGIN
    FOR v_item IN
        SELECT * FROM (VALUES
            ('Estados Turno Caja', 'Estados de los turnos de caja', 'Cerrado', 'cerrado')
        ) AS items(group_name, group_description, description, feature_value)
    LOOP
        SELECT id INTO v_group_id
        FROM feature_group
        WHERE trim(lower(name)) = trim(lower(v_item.group_name))
        LIMIT 1;

        IF v_group_id IS NULL THEN
            INSERT INTO feature_group (name, description, created_by, created_date, modified_by, modified_date)
            VALUES (v_item.group_name, v_item.group_description, 'migration_20261107_002', CURRENT_TIMESTAMP,
                    'migration_20261107_002', CURRENT_TIMESTAMP)
            RETURNING id INTO v_group_id;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM feature
                       WHERE feature_group_id = v_group_id
                         AND (trim(lower(description)) = trim(lower(v_item.description))
                              OR trim(lower(feature_value)) = trim(lower(v_item.feature_value)))) THEN
            INSERT INTO feature (description, abbreviation, feature_value, is_active, feature_group_id,
                                 created_by, created_date, modified_by, modified_date)
            VALUES (v_item.description, null, v_item.feature_value, true, v_group_id,
                    'migration_20261107_002', CURRENT_TIMESTAMP, 'migration_20261107_002', CURRENT_TIMESTAMP);
        END IF;
    END LOOP;
END;
$$;

-- 2. Cuadre de turno ------------------------------------------------------------------------------
create table if not exists cashier_machine_session_closing(
    id  uuid default uuidv7() not null primary key,
    cashier_machine_session_id uuid not null references cashier_machine_session(id),
    closing_date timestamp not null,
    has_difference boolean not null default false,
    observation varchar(500),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50)
);

-- un turno se cuadra una sola vez
create unique index if not exists ux_cashier_machine_session_closing_session
    on cashier_machine_session_closing (cashier_machine_session_id);

create table if not exists cashier_machine_session_closing_detail(
    id  uuid default uuidv7() not null primary key,
    cashier_machine_session_closing_id uuid not null references cashier_machine_session_closing(id),
    currency_id int not null references feature(id), -- Feature Group Name: Monedas
    payment_type_id int not null references feature(id), -- Feature Group Name: Tipos de Pago
    expected_amount decimal(18,2) not null, -- saldo según cash_flow
    declared_amount decimal(18,2) not null, -- conteo del cajero
    difference_amount decimal(18,2) not null, -- declared_amount - expected_amount
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" character varying(50),
    "modified_by" character varying(50),
    constraint ux_cashier_machine_session_closing_detail
        unique (cashier_machine_session_closing_id, currency_id, payment_type_id)
);

create index if not exists ix_cash_flow_cashier_machine_session
    on cash_flow (cashier_machine_session_id);

-- 3. Menú -----------------------------------------------------------------------------------------
-- Se ubica dentro del grupo "Modulo de Ventas", junto a Abrir turno / Movimientos de caja.
-- Después de ejecutarlo, asignar el recurso a los roles desde Roles > Recursos.
DO $$
DECLARE
    menu_parent_id uuid;
    next_weight integer;
BEGIN
    SELECT parent_id INTO menu_parent_id
    FROM public.resource
    WHERE type = 'UI'
      AND trim(BOTH '/' FROM path) IN ('open_cashier_session', 'cash_movements', 'tuua_ticket_sale')
      AND parent_id IS NOT NULL
    ORDER BY created_at, id
    LIMIT 1;

    IF menu_parent_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el grupo "Modulo de Ventas": registrar primero /open_cashier_session.';
    END IF;

    SELECT COALESCE(MAX(weight), 0) + 10 INTO next_weight
    FROM public.resource
    WHERE parent_id = menu_parent_id;

    UPDATE public.resource
    SET name = 'Cierre de turno',
        description = 'Cuadre de caja por moneda y tipo de pago, y cierre del turno abierto',
        method = 'GET',
        parent_id = menu_parent_id,
        icon = 'lock_clock',
        is_active = true,
        modified_at = CURRENT_TIMESTAMP,
        modified_by = 'migration_20261107_002'
    WHERE type = 'UI'
      AND trim(BOTH '/' FROM path) = 'close_cashier_session';

    IF NOT FOUND THEN
        INSERT INTO public.resource
            (name, description, type, path, method, parent_id, icon, weight, is_active,
             created_at, modified_at, created_by, modified_by)
        VALUES
            ('Cierre de turno', 'Cuadre de caja por moneda y tipo de pago, y cierre del turno abierto',
             'UI', '/close_cashier_session', 'GET', menu_parent_id, 'lock_clock', next_weight, true,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'migration_20261107_002', 'migration_20261107_002');
    END IF;
END;
$$;

COMMIT;
