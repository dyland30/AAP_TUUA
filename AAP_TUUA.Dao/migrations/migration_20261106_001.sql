-- Venta de tickets TUUA (punto de venta)
-- 1. Catálogos requeridos por la venta (idempotente)
-- 2. Columnas de moneda de pago / vuelto en tuua_sales_operation
-- 3. Índice único de correlativos en tuua_ticket
-- 4. Procedimiento usp_insert_tuua_sales_operation
-- 5. Recurso de menú /tuua_ticket_sale
BEGIN;

-- 1. Catálogos ---------------------------------------------------------------------------------
DO $$
DECLARE
    v_group_id integer;
    v_item record;
BEGIN
    FOR v_item IN
        SELECT * FROM (VALUES
            ('Estados Ticket TUUA', 'Estados de los tickets TUUA emitidos', 'Emitido', 'emitido'),
            ('Estados Ticket TUUA', 'Estados de los tickets TUUA emitidos', 'Utilizado', 'utilizado'),
            ('Estados Ticket TUUA', 'Estados de los tickets TUUA emitidos', 'Anulado', 'anulado'),
            ('Parametros Venta TUUA', 'Parámetros del punto de venta de tickets TUUA', 'Dias Vuelos Venta', '1')
        ) AS items(group_name, group_description, description, feature_value)
    LOOP
        SELECT id INTO v_group_id
        FROM feature_group
        WHERE trim(lower(name)) = trim(lower(v_item.group_name))
        LIMIT 1;

        IF v_group_id IS NULL THEN
            INSERT INTO feature_group (name, description, created_by, created_date, modified_by, modified_date)
            VALUES (v_item.group_name, v_item.group_description, 'migration_20261106_001', CURRENT_TIMESTAMP,
                    'migration_20261106_001', CURRENT_TIMESTAMP)
            RETURNING id INTO v_group_id;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM feature
                       WHERE feature_group_id = v_group_id
                         AND trim(lower(description)) = trim(lower(v_item.description))) THEN
            INSERT INTO feature (description, abbreviation, feature_value, is_active, feature_group_id,
                                 created_by, created_date, modified_by, modified_date)
            VALUES (v_item.description, null, v_item.feature_value, true, v_group_id,
                    'migration_20261106_001', CURRENT_TIMESTAMP, 'migration_20261106_001', CURRENT_TIMESTAMP);
        END IF;
    END LOOP;
END;
$$;

-- 2. Moneda en que paga el cliente y moneda en que recibe el vuelto (solo efectivo) ---------------
alter table tuua_sales_operation
    add column if not exists cash_payment_currency_id int references feature(id), -- Feature Group Name: Monedas
    add column if not exists cash_change_currency_id int references feature(id); -- Feature Group Name: Monedas

-- 3. Evita correlativos duplicados por serie ------------------------------------------------------
create unique index if not exists ux_tuua_ticket_sequential
    on tuua_ticket (document_sequential_numbers_id, sequential_number);

create index if not exists ix_tuua_ticket_sales_operation
    on tuua_ticket (tuua_sales_operation_id);

create index if not exists ix_cash_flow_sales_operation
    on cash_flow (tuua_sales_operation_id);

-- 4. Registro de la venta -------------------------------------------------------------------------
-- Todo el procedimiento se ejecuta dentro de la transacción del CALL (no contiene COMMIT/ROLLBACK):
-- si cualquier paso falla (RAISE EXCEPTION o error de BD), se revierten la venta, los tickets,
-- el incremento del correlativo y los movimientos de caja.
-- Los importes se recalculan aquí a partir del precio vigente, el IGV y el tipo de cambio;
-- no se confía en los importes calculados por el cliente.
CREATE OR REPLACE PROCEDURE usp_insert_tuua_sales_operation(
    p_cashier_machine_session_id uuid,
    p_document_type_id integer,
    p_sale_type_id integer,
    p_flight_type_id integer,
    p_flight_id uuid,
    p_passenger_name varchar(100),
    p_passenger_email varchar(100),
    p_ticket_quantity integer,
    p_payment_type_id integer,
    p_cash_payment_currency_id integer,
    p_cash_amount_payed numeric(12,2),
    p_cash_change_currency_id integer,
    p_user varchar(50),
    INOUT p_tuua_sales_operation_id uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_session cashier_machine_session%ROWTYPE;
    v_cashier_machine cashier_machine%ROWTYPE;
    v_flight flight%ROWTYPE;
    v_tuua_price tuua_price%ROWTYPE;
    v_exchange_rate exchange_rate%ROWTYPE;
    v_document_sequential_number document_sequential_numbers%ROWTYPE;
    v_serial_prefix varchar(2);
    v_serial varchar(10);
    v_secuencial bigint;
    v_ticket_id uuid;

    v_seae_ticket_id integer;
    v_sale_status_id integer;
    v_ticket_status_id integer;
    v_national_currency_id integer;
    v_payment_type_value varchar;
    v_igv_value varchar;
    v_igv numeric;

    v_total numeric(12,2);
    v_subtotal numeric(12,2);
    v_igv_tax_amount numeric(12,2);
    v_ticket_subtotal numeric(12,2);
    v_ticket_igv_tax_amount numeric(12,2);

    v_amount_due numeric(12,2);      -- importe a cobrar en la moneda de pago
    v_change numeric(12,2);          -- vuelto en la moneda de pago
    v_change_delivered numeric(12,2); -- vuelto en la moneda en que se entrega
    v_now timestamp := current_timestamp;
BEGIN

    if p_ticket_quantity is null or p_ticket_quantity < 1 then
        raise exception 'La cantidad de tickets debe ser mayor a cero';
    end if;

    -- sesión de caja abierta
    select * into v_session
    from cashier_machine_session
    where id = p_cashier_machine_session_id
      and end_time is null
      and is_active = true;

    if not found then
        raise exception 'El turno de caja no existe o ya fue cerrado';
    end if;

    select * into v_cashier_machine from cashier_machine where code = v_session.cashier_machine_code;

    if v_cashier_machine.terminal_id is null or v_cashier_machine.location_id is null then
        raise exception 'La caja % no tiene terminal o sede asignada', v_session.cashier_machine_code;
    end if;

    -- catálogos
    select f.id into v_seae_ticket_id
    from feature as f inner join feature_group as fg on f.feature_group_id = fg.id
    where trim(lower(fg.name)) = 'tipo representación seae' and f.feature_value = 'ticket'
    limit 1;

    if v_seae_ticket_id is null then
        raise exception 'No se encontró el tipo de representación SEAE "ticket"';
    end if;

    select f.id into v_sale_status_id
    from feature as f inner join feature_group as fg on f.feature_group_id = fg.id
    where trim(lower(fg.name)) = 'estados operacion venta' and f.feature_value = 'emitido'
    limit 1;

    if v_sale_status_id is null then
        raise exception 'No se encontró el estado de operación de venta "emitido"';
    end if;

    select f.id into v_ticket_status_id
    from feature as f inner join feature_group as fg on f.feature_group_id = fg.id
    where trim(lower(fg.name)) = 'estados ticket tuua' and f.feature_value = 'emitido'
    limit 1;

    if v_ticket_status_id is null then
        raise exception 'No se encontró el estado de ticket TUUA "emitido"';
    end if;

    select f.id into v_national_currency_id
    from feature as f inner join feature_group as fg on f.feature_group_id = fg.id
    where trim(lower(fg.name)) = 'monedas' and f.feature_value = 'PEN'
    limit 1;

    if v_national_currency_id is null then
        raise exception 'No se encontró la moneda nacional "PEN"';
    end if;

    select f.feature_value into v_igv_value
    from feature as f inner join feature_group as fg on f.feature_group_id = fg.id
    where trim(lower(fg.name)) = 'parametros contables' and trim(lower(f.description)) = 'igv' and f.is_active
    limit 1;

    if v_igv_value is null then
        raise exception 'No se encontró el parámetro contable "IGV"';
    end if;

    v_igv := v_igv_value::numeric;
    if v_igv > 1 then
        v_igv := v_igv / 100; -- admite el IGV expresado como porcentaje (18) o como fracción (0.18)
    end if;

    select f.feature_value into v_payment_type_value
    from feature as f inner join feature_group as fg on f.feature_group_id = fg.id
    where trim(lower(fg.name)) = 'tipos de pago' and f.id = p_payment_type_id
    limit 1;

    if v_payment_type_value is null or v_payment_type_value not in ('E', 'T', 'Y', 'P') then
        raise exception 'Tipo de pago no permitido para la venta de tickets';
    end if;

    if not exists (select 1 from feature as f inner join feature_group as fg on f.feature_group_id = fg.id
                   where trim(lower(fg.name)) = 'tipos documentos tuua' and f.id = p_document_type_id
                     and f.feature_value in ('56', '28')) then
        raise exception 'Tipo de documento no permitido para la venta de tickets';
    end if;

    -- vuelo
    select * into v_flight from flight where id = p_flight_id and is_active = true;

    if not found then
        raise exception 'No se encontró el vuelo seleccionado';
    end if;

    -- precio tuua vigente: la moneda de la venta es la del precio
    select * into v_tuua_price
    from tuua_price
    where is_active = true
      and flight_type_id = p_flight_type_id
      and location_id = v_cashier_machine.location_id
      and terminal_id = v_cashier_machine.terminal_id
      and date_start <= current_date
      and (date_end is null or date_end >= current_date)
    order by date_start desc
    limit 1;

    if not found then
        raise exception 'No se encontró un precio TUUA vigente para el tipo de vuelo y el terminal de la caja %',
            v_cashier_machine.code;
    end if;

    -- último tipo de cambio activo cuya moneda base es la del precio
    select * into v_exchange_rate
    from exchange_rate
    where is_active = true
      and base_currency_id = v_tuua_price.currency_id
    order by day desc, created_at desc
    limit 1;

    if not found then
        raise exception 'No se encontró un tipo de cambio activo para la moneda del precio TUUA';
    end if;

    -- importes
    v_total := v_tuua_price.price * p_ticket_quantity;
    v_subtotal := round(v_total / (1 + v_igv), 2);
    v_igv_tax_amount := round(v_igv * v_subtotal, 2);
    v_ticket_subtotal := round(v_tuua_price.price / (1 + v_igv), 2);
    v_ticket_igv_tax_amount := round(v_igv * v_ticket_subtotal, 2);

    -- pago
    if v_payment_type_value = 'E' then
        if p_cash_payment_currency_id is null or p_cash_amount_payed is null then
            raise exception 'Debe indicar la moneda y el monto con que paga el cliente';
        end if;

        if p_cash_payment_currency_id = v_tuua_price.currency_id then
            v_amount_due := v_total;
        elsif p_cash_payment_currency_id = v_national_currency_id then
            v_amount_due := round(v_total * v_exchange_rate.sales_exchange_rate, 2);
        else
            raise exception 'La moneda de pago debe ser la del precio o la moneda nacional';
        end if;

        if p_cash_amount_payed < v_amount_due then
            raise exception 'El monto pagado (%) es menor al importe a cobrar (%)', p_cash_amount_payed, v_amount_due;
        end if;

        v_change := p_cash_amount_payed - v_amount_due;
        p_cash_change_currency_id := coalesce(p_cash_change_currency_id, p_cash_payment_currency_id);

        if p_cash_change_currency_id = p_cash_payment_currency_id then
            v_change_delivered := v_change;
        elsif p_cash_change_currency_id = v_national_currency_id then
            v_change_delivered := round(v_change * v_exchange_rate.purchase_exchange_rate, 2);
        else
            raise exception 'El vuelto solo puede entregarse en la moneda de pago o en moneda nacional';
        end if;
    else
        -- TARJETA / YAPE / PLIN: siempre en moneda nacional, sin vuelto
        if v_tuua_price.currency_id = v_national_currency_id then
            v_amount_due := v_total;
        else
            v_amount_due := round(v_total * v_exchange_rate.sales_exchange_rate, 2);
        end if;
    end if;

    -- serie y correlativo (se bloquea la fila para evitar correlativos duplicados en concurrencia)
    select d.* into v_document_sequential_number
    from document_sequential_numbers as d
             inner join document_serial_group as dg
                        on d.document_serial_group_id = dg.id
    where dg.document_type_id = p_document_type_id
      and dg.seae_type_id = v_seae_ticket_id
      and dg.sale_type_id = p_sale_type_id
      and dg.terminal_id = v_cashier_machine.terminal_id
      and d.cashier_code = v_cashier_machine.code
      and d.is_active = true
      and dg.is_active = true
    limit 1
    for update of d;

    if not found then
        raise exception 'No se encontró una serie activa de tickets para la caja %, el tipo de documento y la modalidad de venta seleccionados',
            v_cashier_machine.code;
    end if;

    select g.serial_prefix into v_serial_prefix
    from document_serial_group as g
    where g.id = v_document_sequential_number.document_serial_group_id;

    v_serial := v_serial_prefix || lpad(v_document_sequential_number.serial_number::text, 3, '0');

    -- operación de venta
    insert into tuua_sales_operation (cashier_machine_session_id, operation_date, document_type_id, seae_type_id,
                                      sale_type_id, currency_id, flight_type_id, airline_id, flight_number,
                                      flight_date, flight_id, titular_passenger_name, passenger_email,
                                      exchange_rate_id, purchase_exchange_rate, sales_exchange_rate,
                                      payment_type_id, status_id, ticket_quantity, unit_price, tuua_price_id,
                                      subtotal, total, igv_tax_amount,
                                      cash_amount_payed, cash_change, cash_payment_currency_id, cash_change_currency_id,
                                      payment_amount, payment_currency, payment_date,
                                      created_at, updated_at, created_by, modified_by)
    values (v_session.id, v_now, p_document_type_id, v_seae_ticket_id,
            p_sale_type_id, v_tuua_price.currency_id, p_flight_type_id, v_flight.airline_id,
            upper(trim(v_flight.flight_identity)),
            v_flight.schedule_date, v_flight.id, trim(upper(p_passenger_name)), nullif(trim(lower(p_passenger_email)), ''),
            v_exchange_rate.id, v_exchange_rate.purchase_exchange_rate, v_exchange_rate.sales_exchange_rate,
            p_payment_type_id, v_sale_status_id, p_ticket_quantity, v_tuua_price.price, v_tuua_price.id,
            v_subtotal, v_total, v_igv_tax_amount,
            case when v_payment_type_value = 'E' then p_cash_amount_payed end,
            case when v_payment_type_value = 'E' then v_change_delivered end,
            case when v_payment_type_value = 'E' then p_cash_payment_currency_id end,
            case when v_payment_type_value = 'E' then p_cash_change_currency_id end,
            v_amount_due,
            (select f.feature_value from feature as f
             where f.id = case when v_payment_type_value = 'E' then p_cash_payment_currency_id
                               else v_national_currency_id end),
            v_now,
            v_now, v_now, p_user, p_user)
    returning id into p_tuua_sales_operation_id;

    -- tickets
    v_secuencial := v_document_sequential_number.max_sequential_number;

    for i in 1..p_ticket_quantity loop
        v_secuencial := v_secuencial + 1;
        v_ticket_id := uuidv7();

        insert into tuua_ticket (id, tuua_sales_operation_id, document_sequential_numbers_id, serial,
                                 sequential_number, hash_ticket, status_id, price, subtotal, total,
                                 igv_tax_amount, due_date, created_at, updated_at, created_by, modified_by)
        values (v_ticket_id, p_tuua_sales_operation_id, v_document_sequential_number.id, v_serial,
                v_secuencial,
                'TKT-' || upper(substr(encode(sha256(convert_to(v_ticket_id::text || v_serial || v_secuencial::text, 'UTF8')), 'hex'), 1, 16)),
                v_ticket_status_id, v_tuua_price.price, v_ticket_subtotal, v_tuua_price.price,
                v_ticket_igv_tax_amount, v_flight.schedule_date, v_now, v_now, p_user, p_user);
    end loop;

    update document_sequential_numbers
    set max_sequential_number = v_secuencial
    where id = v_document_sequential_number.id;

    -- movimientos de caja
    if v_payment_type_value = 'E' then
        insert into cash_flow (cashier_machine_session_id, tuua_sales_operation_id, direction, operator,
                               payment_type_id, currency_id, amount, reference_code, observation, is_active,
                               created_at, updated_at, created_by, modified_by)
        values (v_session.id, p_tuua_sales_operation_id, 'I', 1, p_payment_type_id, p_cash_payment_currency_id,
                p_cash_amount_payed, p_tuua_sales_operation_id::text, 'Venta de tickets TUUA', true,
                v_now, v_now, p_user, p_user);

        if v_change_delivered > 0 then
            insert into cash_flow (cashier_machine_session_id, tuua_sales_operation_id, direction, operator,
                                   payment_type_id, currency_id, amount, reference_code, observation, is_active,
                                   created_at, updated_at, created_by, modified_by)
            values (v_session.id, p_tuua_sales_operation_id, 'E', -1, p_payment_type_id, p_cash_change_currency_id,
                    v_change_delivered, p_tuua_sales_operation_id::text, 'Vuelto venta de tickets TUUA', true,
                    v_now, v_now, p_user, p_user);
        end if;
    else
        insert into cash_flow (cashier_machine_session_id, tuua_sales_operation_id, direction, operator,
                               payment_type_id, currency_id, amount, reference_code, observation, is_active,
                               created_at, updated_at, created_by, modified_by)
        values (v_session.id, p_tuua_sales_operation_id, 'I', 1, p_payment_type_id, v_national_currency_id,
                v_amount_due, p_tuua_sales_operation_id::text, 'Venta de tickets TUUA', true,
                v_now, v_now, p_user, p_user);
    end if;

END;
$$;

-- 5. Menú -----------------------------------------------------------------------------------------
-- Se ubica dentro del grupo "Modulo de Ventas" (padre de /money_exchange, /cash_movements u /open_cashier_session).
-- Después de ejecutarlo, asignar el recurso a los roles desde Roles > Recursos.
DO $$
DECLARE
    menu_parent_id uuid;
    next_weight integer;
BEGIN
    SELECT parent_id INTO menu_parent_id
    FROM public.resource
    WHERE type = 'UI'
      AND trim(BOTH '/' FROM path) IN ('money_exchange', 'cash_movements', 'open_cashier_session')
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
    SET name = 'Venta de tickets TUUA',
        description = 'Punto de venta de tickets TUUA del turno de caja',
        method = 'GET',
        parent_id = menu_parent_id,
        icon = 'confirmation_number',
        is_active = true,
        modified_at = CURRENT_TIMESTAMP,
        modified_by = 'migration_20261106_001'
    WHERE type = 'UI'
      AND trim(BOTH '/' FROM path) = 'tuua_ticket_sale';

    IF NOT FOUND THEN
        INSERT INTO public.resource
            (name, description, type, path, method, parent_id, icon, weight, is_active,
             created_at, modified_at, created_by, modified_by)
        VALUES
            ('Venta de tickets TUUA', 'Punto de venta de tickets TUUA del turno de caja', 'UI', '/tuua_ticket_sale',
             'GET', menu_parent_id, 'confirmation_number', next_weight, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
             'migration_20261106_001', 'migration_20261106_001');
        END IF;
END;
$$;

COMMIT;
