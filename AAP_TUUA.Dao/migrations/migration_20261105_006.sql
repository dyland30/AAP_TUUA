-- Registra la ruta de Cambio de moneda en public.resource.
-- Se ubica dentro del grupo "Modulo de Ventas", reutilizando el menú padre de
-- Ingresos/Egresos de caja (/cash_movements) o, si no existe, de Abrir Turno (/open_cashier_session).
-- Puede ejecutarse nuevamente sin duplicar el recurso ni modificar su ID.
-- Después de ejecutarlo, asignar el recurso a los roles desde Roles > Recursos.
BEGIN;

DO $$
DECLARE
    menu_parent_id uuid;
    next_weight integer;
    route record;
BEGIN
    SELECT parent_id INTO menu_parent_id
    FROM public.resource
    WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'cash_movements' AND parent_id IS NOT NULL
    ORDER BY created_at, id
    LIMIT 1;

    IF menu_parent_id IS NULL THEN
        SELECT parent_id INTO menu_parent_id
        FROM public.resource
        WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'open_cashier_session' AND parent_id IS NOT NULL
        ORDER BY created_at, id
        LIMIT 1;
    END IF;

    IF menu_parent_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el grupo "Modulo de Ventas": registrar primero /cash_movements o /open_cashier_session.';
    END IF;

    -- Se agrega al final del grupo.
    SELECT COALESCE(MAX(weight), 0) + 10 INTO next_weight
    FROM public.resource
    WHERE parent_id = menu_parent_id;

    FOR route IN
        SELECT * FROM (VALUES
            ('Cambio de moneda', 'Compra y venta de moneda extranjera del turno de caja', '/money_exchange', 'currency_exchange', next_weight)
        ) AS routes(name, description, path, icon, weight)
    LOOP
        UPDATE public.resource
        SET name = route.name,
            description = route.description,
            path = route.path,
            method = 'GET',
            parent_id = menu_parent_id,
            icon = route.icon,
            is_active = true,
            modified_at = CURRENT_TIMESTAMP,
            modified_by = 'migration_20261105_006'
        WHERE type = 'UI'
          AND trim(BOTH '/' FROM path) = trim(BOTH '/' FROM route.path);

        IF NOT FOUND THEN
            INSERT INTO public.resource
                (name, description, type, path, method, parent_id, icon, weight, is_active,
                 created_at, modified_at, created_by, modified_by)
            VALUES
                (route.name, route.description, 'UI', route.path, 'GET', menu_parent_id,
                 route.icon, route.weight, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                 'migration_20261105_006', 'migration_20261105_006');
        END IF;
    END LOOP;
END;
$$;

COMMIT;
