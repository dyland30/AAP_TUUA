-- Registra las rutas de los CRUD de FIDS (sectores, reglas de tiempo, dispositivos, grupos de comportamiento,
-- plantillas, multimedia, campañas, botonera, alertas, notificaciones y auditoría) en public.resource.
-- Las pantallas hijas (rutas de evacuación, reglas/plantillas de grupo, versiones/campos/widgets de plantilla,
-- contenido/grupos de campaña y asignación de aerolíneas/aeropuertos a usuarios) se abren desde su pantalla padre
-- y no necesitan entrada de menú.
-- Reutiliza el menú padre de Aerolíneas / Tipos de aeronave / Aeronaves / Aeropuertos / Vuelos cuando existe.
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

    IF menu_parent_id IS NULL THEN
        SELECT parent_id INTO menu_parent_id
        FROM public.resource
        WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'aircraft_types'
        ORDER BY created_at, id
        LIMIT 1;
    END IF;

    IF menu_parent_id IS NULL THEN
        SELECT parent_id INTO menu_parent_id
        FROM public.resource
        WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'aircrafts'
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
        WHERE type = 'UI' AND trim(BOTH '/' FROM path) = 'flights'
        ORDER BY created_at, id
        LIMIT 1;
    END IF;

    FOR route IN
        SELECT * FROM (VALUES
            ('Sectores del aeropuerto', 'Sectores físicos del aeropuerto y sus rutas de evacuación', '/airport_sectors', 'grid_view', 200),
            ('Reglas de tiempo de vuelos', 'Reglas de apertura/cierre y Call to Gate por tipo de vuelo y ruta', '/flight_timing_rules', 'schedule', 210),
            ('Dispositivos', 'Registro y administración de pantallas y dispositivos de campo', '/devices', 'tv', 220),
            ('Video walls', 'Circuitos de video wall de pantallas', '/video_walls', 'video_label', 230),
            ('Grupos de comportamiento', 'Grupos de comportamiento de pantallas, sus reglas y plantillas', '/behavior_groups', 'account_tree', 240),
            ('Plantillas visuales', 'Plantillas visuales de pantalla, versiones, campos y widgets', '/display_templates', 'web', 250),
            ('Multimedia', 'Recursos multimedia para plantillas y campañas', '/media_assets', 'perm_media', 260),
            ('Campañas publicitarias', 'Campañas de Dynamic Signage, su contenido y grupos', '/ad_campaigns', 'ads_click', 270),
            ('Botonera virtual', 'Botones de la botonera virtual de aerolíneas', '/virtual_keypad_buttons', 'dialpad', 280),
            ('Alertas de emergencia', 'Activación y cierre de alertas de emergencia', '/emergency_alerts', 'crisis_alert', 290),
            ('Reglas de visualización de alertas', 'Tipos de pantalla que muestran cada tipo de alerta', '/emergency_alert_display_rules', 'rule', 300),
            ('Mensajes de emergencia', 'Plantillas de mensajes de emergencia por tipo de alerta e idioma', '/emergency_message_templates', 'campaign', 310),
            ('Destinatarios de notificaciones', 'Destinatarios de notificaciones de eventos críticos', '/notification_recipients', 'notifications_active', 320),
            ('Log de auditoría', 'Consulta del registro de auditoría del sistema', '/audit_logs', 'history', 330)
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
            modified_by = 'migration_20261111_001'
        WHERE type = 'UI'
          AND trim(BOTH '/' FROM path) = trim(BOTH '/' FROM route.path);

        IF NOT FOUND THEN
            INSERT INTO public.resource
                (name, description, type, path, method, parent_id, icon, weight, is_active,
                 created_at, modified_at, created_by, modified_by)
            VALUES
                (route.name, route.description, 'UI', route.path, 'GET', menu_parent_id,
                 route.icon, route.weight, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                 'migration_20261111_001', 'migration_20261111_001');
        END IF;
    END LOOP;
END;
$$;

COMMIT;
