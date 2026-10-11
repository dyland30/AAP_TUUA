-- Registra las rutas de los nuevos CRUD en public.resource.
-- Reutiliza el grupo de Aerolíneas, cuando existe, para las nuevas entradas.
-- Puede ejecutarse nuevamente sin duplicar recursos ni modificar sus IDs.
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

    FOR route IN
        SELECT * FROM (VALUES
            ('Aeropuertos', 'Administración de aeropuertos', '/airports', 'local_airport', 60),
            ('Sedes', 'Administración de sedes', '/locations', 'business', 70),
            ('Ubigeos', 'Administración de departamentos, provincias y distritos', '/ubigeos', 'map', 80)
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
            modified_by = 'migration_20261010_001'
        WHERE type = 'UI'
          AND trim(BOTH '/' FROM path) = trim(BOTH '/' FROM route.path);

        IF NOT FOUND THEN
            INSERT INTO public.resource
                (name, description, type, path, method, parent_id, icon, weight, is_active,
                 created_at, modified_at, created_by, modified_by)
            VALUES
                (route.name, route.description, 'UI', route.path, 'GET', menu_parent_id,
                 route.icon, route.weight, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                 'migration_20261010_001', 'migration_20261010_001');
        END IF;
    END LOOP;
END;
$$;

COMMIT;
