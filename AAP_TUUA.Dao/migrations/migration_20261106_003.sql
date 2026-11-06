-- Registra la ruta de Consulta de boardingpass registrados en public.resource.
-- Se ubica dentro del grupo "Modulo de Ventas", junto a la búsqueda de ventas TUUA.
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
      AND trim(BOTH '/' FROM path) IN ('tuua_sales_search', 'tuua_ticket_sale', 'money_exchange', 'cash_movements', 'open_cashier_session')
      AND parent_id IS NOT NULL
    ORDER BY created_at, id
    LIMIT 1;

    IF menu_parent_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el grupo "Modulo de Ventas": registrar primero /tuua_ticket_sale.';
    END IF;

    SELECT COALESCE(MAX(weight), 0) + 10 INTO next_weight
    FROM public.resource
    WHERE parent_id = menu_parent_id;

    UPDATE public.resource
    SET name = 'Consulta de boardingpass',
        description = 'Consulta paginada de boardingpass registrados',
        method = 'GET',
        parent_id = menu_parent_id,
        icon = 'airplane_ticket',
        is_active = true,
        modified_at = CURRENT_TIMESTAMP,
        modified_by = 'migration_20261106_003'
    WHERE type = 'UI'
      AND trim(BOTH '/' FROM path) = 'boardingpass_search';

    IF NOT FOUND THEN
        INSERT INTO public.resource
            (name, description, type, path, method, parent_id, icon, weight, is_active,
             created_at, modified_at, created_by, modified_by)
        VALUES
            ('Consulta de boardingpass', 'Consulta paginada de boardingpass registrados',
             'UI', '/boardingpass_search', 'GET', menu_parent_id, 'airplane_ticket', next_weight, true,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'migration_20261106_003', 'migration_20261106_003');
    END IF;
END;
$$;

COMMIT;
