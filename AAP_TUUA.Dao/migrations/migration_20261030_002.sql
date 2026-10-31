-- Registra las rutas de los CRUD de Tipos de aeronave y Aeronaves en public.resource.
-- Reutiliza el menú padre de Aerolíneas / Aeropuertos cuando existe.
-- Puede ejecutarse nuevamente sin duplicar los recursos ni modificar sus IDs.
-- Después de ejecutarlo, asignar los recursos a los roles desde Roles > Recursos.
BEGIN;

DO $$
DECLARE
    menu_parent_id uuid;
    route record;
BEGIN
    SELECT parent_id INTO menu_parent_id
    FROM public.resource
    WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'airlines'
    ORDER BY created_at, id
    LIMIT 1;

    IF menu_parent_id IS NULL THEN
        SELECT parent_id INTO menu_parent_id
        FROM public.resource
        WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'airports'
        ORDER BY created_at, id
        LIMIT 1;
    END IF;

    FOR route IN
        SELECT * FROM (VALUES
            ('Tipos de aeronave', 'Administración de tipos de aeronave', '/aircraft_types', 'connecting_airports', 130),
            ('Aeronaves', 'Administración de aeronaves', '/aircrafts', 'flight', 140)
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
            modified_by = 'migration_20261030_002'
        WHERE type = 'UI'
          AND trim(BOTH '/' FROM path) = trim(BOTH '/' FROM route.path);

        IF NOT FOUND THEN
            INSERT INTO public.resource
                (name, description, type, path, method, parent_id, icon, weight, is_active,
                 created_at, modified_at, created_by, modified_by)
            VALUES
                (route.name, route.description, 'UI', route.path, 'GET', menu_parent_id,
                 route.icon, route.weight, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                 'migration_20261030_002', 'migration_20261030_002');
        END IF;
    END LOOP;
END;
$$;

COMMIT;
