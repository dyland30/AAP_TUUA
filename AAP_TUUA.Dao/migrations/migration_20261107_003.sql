-- Registra la ruta del Reporte de turnos de caja en public.resource.
-- Se ubica dentro del grupo "Modulo de Ventas", junto a la búsqueda de ventas y los demás reportes.
-- Requiere migration_20261107_002 (tablas del cuadre de turno), que el reporte consulta.
-- Puede ejecutarse nuevamente sin duplicar el recurso ni modificar su ID.
-- Después de ejecutarlo, asignar el recurso a los roles desde Roles > Recursos.
BEGIN;

DO $$
DECLARE
    menu_parent_id uuid;
    next_weight integer;
BEGIN
    SELECT parent_id INTO menu_parent_id
    FROM public.resource
    WHERE type = 'UI'
      AND trim(BOTH '/' FROM path) IN ('tuua_sales_search', 'close_cashier_session', 'open_cashier_session')
      AND parent_id IS NOT NULL
    ORDER BY created_at, id
    LIMIT 1;

    IF menu_parent_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el grupo "Modulo de Ventas": registrar primero /tuua_sales_search.';
    END IF;

    SELECT COALESCE(MAX(weight), 0) + 10 INTO next_weight
    FROM public.resource
    WHERE parent_id = menu_parent_id;

    UPDATE public.resource
    SET name = 'Reporte de turnos',
        description = 'Resumen de turnos de caja: ventas, tickets, movimientos y cuadre',
        method = 'GET',
        parent_id = menu_parent_id,
        icon = 'summarize',
        is_active = true,
        modified_at = CURRENT_TIMESTAMP,
        modified_by = 'migration_20261107_003'
    WHERE type = 'UI'
      AND trim(BOTH '/' FROM path) = 'cashier_session_report';

    IF NOT FOUND THEN
        INSERT INTO public.resource
            (name, description, type, path, method, parent_id, icon, weight, is_active,
             created_at, modified_at, created_by, modified_by)
        VALUES
            ('Reporte de turnos', 'Resumen de turnos de caja: ventas, tickets, movimientos y cuadre',
             'UI', '/cashier_session_report', 'GET', menu_parent_id, 'summarize', next_weight, true,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'migration_20261107_003', 'migration_20261107_003');
    END IF;
END;
$$;

COMMIT;
