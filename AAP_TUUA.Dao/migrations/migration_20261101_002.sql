-- Índices de soporte para usp_insert_boardingpass_dae_seae (migration_20261101_001.sql)
--
-- Nota: si esta migración se ejecuta sobre tablas con muchos datos y fuera de una transacción,
-- considerar crear los índices con CREATE INDEX CONCURRENTLY para no bloquear escrituras.

-- 1) Vuelo programado: la expresión coincide exactamente con la usada en el procedimiento
--    (lower(trim(flight_identity)) = trim(lower(p_flight_number))) y schedule_date = p_flight_date.
create index if not exists idx_flight_schedule_identity
    on flight (schedule_date, (lower(trim(flight_identity))));

-- 2) Serie vigente por terminal y tipo de representación SEAE (join de document_serial_group).
create index if not exists idx_document_serial_group_lookup
    on document_serial_group (terminal_id, seae_type_id)
    where is_active = true;

-- 3) Secuencia vigente por grupo y caja (cubre la FK document_serial_group_id).
--    No se indexa max_sequential_number para mantener las actualizaciones HOT en cada boardingpass.
create index if not exists idx_document_sequential_numbers_lookup
    on document_sequential_numbers (document_serial_group_id, cashier_code)
    where is_active = true;

-- La fila de correlativo se actualiza en cada boardingpass: dejar espacio para actualizaciones HOT.
alter table document_sequential_numbers set (fillfactor = 70);

-- 4) Precio TUUA vigente por terminal y tipo de vuelo, ordenado por fecha de inicio descendente
--    (evita el sort del "limit 1"). idx_tuua_price_lookup se conserva porque
--    TuuaPriceDao.GetActivePrice también filtra por location_id.
create index if not exists idx_tuua_price_active_lookup
    on tuua_price (terminal_id, flight_type_id, date_start desc)
    include (date_end, price, currency_id)
    where is_active = true;

-- 5) Integridad del correlativo: no puede repetirse un secuencial dentro de la misma secuencia.
--    Falla si ya existen duplicados; depurarlos antes de ejecutar.
create unique index if not exists ux_boardingpass_dae_seae_seq
    on boardingpass_dae_seae (document_sequential_numbers_id, sequential_number);
