alter table tuua_gate
    add cashier_code varchar(20) references cashier_machine(code);


CREATE OR REPLACE PROCEDURE usp_insert_boardingpass_dae_seae(
    p_tuua_gate_code varchar(20),
    p_flight_type_id integer,
    p_airline_id uuid,
    p_flight_number varchar(10),
    p_flight_date date,
    p_passenger_name varchar(30),
    p_seat_number varchar(10),
    p_pnr varchar(20),
    p_checkin_sequence_number int,
    p_passenger_status varchar(2),
    p_str_bcbp varchar(200),
    p_user varchar(50)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_tuua_gate tuua_gate%ROWTYPE;
        v_cod_rep_seae integer;
        v_document_sequential_number document_sequential_numbers%ROWTYPE;
        v_secuencial bigint;
        v_tuua_price tuua_price%ROWTYPE;
        v_serial_prefix varchar(2);
        v_serial varchar(10);
        v_ose_status_id integer;
        v_bp_status_id integer;
        v_flight flight%ROWTYPE;

BEGIN

    -- obtener tipo documento boardingpass
    select f.id into v_cod_rep_seae from feature as f
                                             inner join feature_group as fg
                                                        on f.feature_group_id = fg.id
    where trim(lower(fg.name)) = 'tipo representación seae'
      and f.feature_value = 'boardingpass'
    ;


    -- obtener status id de boardingpass registrado

    select f.id into v_bp_status_id from feature as f
                                             inner join feature_group as fg
                                                        on f.feature_group_id = fg.id
    where trim(lower(fg.name)) = 'estados boardingpass'
      and f.feature_value = 'u'
    ;

    -- obtener status id de ose pendiente

    select f.id into v_ose_status_id from feature as f
                                              inner join feature_group as fg
                                                         on f.feature_group_id = fg.id
    where trim(lower(fg.name)) = 'estados ose'
      and f.feature_value = 'p'
    ;

    --TODO
    -- document_type_id
    -- salte_type_id

    -- obtener tuua gate
    select * into v_tuua_gate from tuua_gate where code = p_tuua_gate_code;

    -- obtener serie y correlativo
    select d.* into v_document_sequential_number
    from document_sequential_numbers as d
             inner join document_serial_group as dg
                        on d.document_serial_group_id = dg.id
    where
        dg.seae_type_id = v_cod_rep_seae
      and dg.terminal_id = v_tuua_gate.terminal_id
      and d.cashier_code = v_tuua_gate.cashier_code
      and d.is_active = true
      and dg.is_active = true
        limit 1;

    --obtener prefix
    select  g.serial_prefix into v_serial_prefix
    from document_serial_group as g
    where  g.seae_type_id = v_cod_rep_seae
      and g.terminal_id  = v_tuua_gate.terminal_id
      and g.is_active = true
        limit 1;


    -- obtener precio tuua activo
    select * into v_tuua_price
    from tuua_price
    where is_active = true
      and    flight_type_id = p_flight_type_id
      and terminal_id = v_tuua_gate.terminal_id
      and current_date >= date_start  and current_date <= coalesce(date_end, (current_date+ INTERVAL '1 day'))
    ;

    -- obtener vuelo programado

    select * into v_flight
    from flight
    where lower(trim(flight_identity)) = trim(lower(p_flight_number))
      and schedule_date = p_flight_date
        limit 1;


            v_serial := v_serial_prefix || lpad(v_document_sequential_number.serial_number::text,3,'0');




    -- aumentar secuencial en 1 y actualizar
            v_secuencial := v_document_sequential_number.max_sequential_number +1;

    update document_sequential_numbers
    set max_sequential_number = v_secuencial
    where id = v_document_sequential_number.id;


    --insertar boardingpass

    insert into boardingpass_dae_seae (document_sequential_numbers_id, serial,
                                       sequential_number, tuua_gate_code, flight_type_id, airline_id, price, currency_id,
                                       status_id, flight_number, flight_date, passenger_name, seat_number, pnr,
                                       checkin_sequence_number, origin_airport_code, destination_airport_code,
                                       passenger_status, str_bcbp, ose_status_id, ose_response,
                                       created_at, updated_at, created_by, modified_by)
    values (v_document_sequential_number.id,
            v_serial,
            v_secuencial,
            p_tuua_gate_code,
            p_flight_type_id,
            p_airline_id,
            v_tuua_price.price,
            v_tuua_price.currency_id,
            v_bp_status_id,
            p_flight_number,
            p_flight_date,
            p_passenger_name,
            p_seat_number,
            p_pnr,
            p_checkin_sequence_number,
            v_flight.origin_airport_code,
            v_flight.destination_airprt_code,
            p_passenger_status,
            p_str_bcbp,
            v_bp_status_id,
            null,
            current_timestamp,
            current_timestamp,
            p_user,
            p_user);



END;
$$;