-- Registra la ruta de Búsqueda de operaciones de venta TUUA en public.resource.
-- Se ubica dentro del grupo "Modulo de Ventas", junto a la venta de tickets.
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
      AND trim(BOTH '/' FROM path) IN ('tuua_ticket_sale', 'money_exchange', 'cash_movements', 'open_cashier_session')
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
    SET name = 'Búsqueda de ventas TUUA',
        description = 'Consulta de operaciones de venta de tickets TUUA y descarga de tickets',
        method = 'GET',
        parent_id = menu_parent_id,
        icon = 'manage_search',
        is_active = true,
        modified_at = CURRENT_TIMESTAMP,
        modified_by = 'migration_20261106_002'
    WHERE type = 'UI'
      AND trim(BOTH '/' FROM path) = 'tuua_sales_search';

    IF NOT FOUND THEN
        INSERT INTO public.resource
            (name, description, type, path, method, parent_id, icon, weight, is_active,
             created_at, modified_at, created_by, modified_by)
        VALUES
            ('Búsqueda de ventas TUUA', 'Consulta de operaciones de venta de tickets TUUA y descarga de tickets',
             'UI', '/tuua_sales_search', 'GET', menu_parent_id, 'manage_search', next_weight, true,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'migration_20261106_002', 'migration_20261106_002');
    END IF;
END;
$$;

COMMIT;
