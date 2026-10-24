-- Registra la ruta del CRUD de Tarifas TUUA en public.resource.
-- Reutiliza el menú padre de Puertas TUUA / Cajas / Aeropuertos / Aerolíneas cuando existe.
-- Puede ejecutarse nuevamente sin duplicar el recurso ni modificar su ID.
-- Después de ejecutarlo, asignar el recurso a los roles desde Roles > Recursos.
BEGIN;

DO $$
DECLARE
    menu_parent_id uuid;
    route record;
BEGIN
    SELECT parent_id INTO menu_parent_id
    FROM public.resource
    WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'tuua_gates'
    ORDER BY created_at, id
    LIMIT 1;

    IF menu_parent_id IS NULL THEN
        SELECT parent_id INTO menu_parent_id
        FROM public.resource
        WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'cashier_machines'
        ORDER BY created_at, id
        LIMIT 1;
    END IF;

    IF menu_parent_id IS NULL THEN
        SELECT parent_id INTO menu_parent_id
        FROM public.resource
        WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'airports'
        ORDER BY created_at, id
        LIMIT 1;
    END IF;

    IF menu_parent_id IS NULL THEN
        SELECT parent_id INTO menu_parent_id
        FROM public.resource
        WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'airlines'
        ORDER BY created_at, id
        LIMIT 1;
    END IF;

    FOR route IN
        SELECT * FROM (VALUES
            ('Tarifas TUUA', 'Administración de tarifas TUUA por sede, terminal y tipo de vuelo', '/tuua_prices', 'price_change', 120)
        ) AS routes(name, description, path, icon, weight)
    LOOP
        UPDATE public.resource
        SET name = route.name,
            description = route.description,
            path = route.path,
            method = 'GET',
            icon = route.icon,
            weight = route.weight,
            is_active = true,
            modified_at = CURRENT_TIMESTAMP,
            modified_by = 'migration_20261017_002'
        WHERE type = 'UI'
          AND trim(BOTH '/' FROM path) = trim(BOTH '/' FROM route.path);

        IF NOT FOUND THEN
            INSERT INTO public.resource
                (name, description, type, path, method, parent_id, icon, weight, is_active,
                 created_at, modified_at, created_by, modified_by)
            VALUES
                (route.name, route.description, 'UI', route.path, 'GET', menu_parent_id,
                 route.icon, route.weight, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                 'migration_20261017_002', 'migration_20261017_002');
        END IF;
    END LOOP;
END;
$$;

COMMIT;
