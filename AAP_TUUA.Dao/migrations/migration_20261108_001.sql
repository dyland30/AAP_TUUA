
-- ======================================================================================
-- 0. FUNCIONES UTILITARIAS DE CATÁLOGO / PARÁMETROS
-- ======================================================================================

-- Devuelve el id de un feature buscando por nombre de grupo y abreviatura (o feature_value)
CREATE OR REPLACE FUNCTION public.fn_get_feature_id(p_group_name character varying, p_code character varying)
    RETURNS integer
    LANGUAGE sql STABLE
AS $function$
SELECT f.id
FROM feature AS f
         INNER JOIN feature_group AS fg ON f.feature_group_id = fg.id
WHERE trim(lower(fg.name)) = trim(lower(p_group_name))
  AND (upper(trim(f.abbreviation)) = upper(trim(p_code)) OR upper(trim(f.feature_value)) = upper(trim(p_code)))
  AND f.is_active = true
ORDER BY (upper(trim(f.abbreviation)) = upper(trim(p_code))) DESC, f.id
    LIMIT 1;
$function$;

-- Devuelve el valor (feature_value) de un parámetro identificado por grupo + abreviatura
CREATE OR REPLACE FUNCTION public.fn_get_parameter(p_group_name character varying, p_code character varying)
    RETURNS character varying
    LANGUAGE sql STABLE
AS $function$
SELECT f.feature_value
FROM feature AS f
         INNER JOIN feature_group AS fg ON f.feature_group_id = fg.id
WHERE trim(lower(fg.name)) = trim(lower(p_group_name))
  AND upper(trim(f.abbreviation)) = upper(trim(p_code))
  AND f.is_active = true
    LIMIT 1;
$function$;


-- ======================================================================================
-- 1. CATÁLOGOS Y PARÁMETROS (feature_group / feature)
-- ======================================================================================

INSERT INTO "public"."feature_group" ("name", "description", "created_by", "created_date")
SELECT v.name, v.description, 'script_fids', CURRENT_TIMESTAMP
FROM (VALUES
          -- Gestión de vuelos
          ('estados vuelo fids',            'Estados SOP del ciclo de vida del vuelo FIDS (GV-002)'),
          ('origen cambio vuelo',           'Origen de un cambio de vuelo: manual, AIDX, AODB, etc. (GV-004)'),
          ('tipos conexion vuelo',          'Tipo de vuelo en conexión DOM-DOM / DOM-INT / INT-INT (GV-007)'),
          ('campos bloqueables vuelo',      'Campos del vuelo que el operador puede bloquear frente al AODB (GV-008)'),
          ('eventos tiempo vuelo',          'Eventos temporales de apertura/cierre y Call to Gate (AR-002, GB-004)'),
          ('referencia tiempo vuelo',       'Hora de referencia para reglas de tiempo (STD/STA/ETD/ETA)'),
          ('acciones asignacion recurso',   'Acciones del flujo de asignación de recursos (AR-005)'),
          ('tipos archivo itinerario',      'Formato de archivo de itinerario en lote (GV-009, IE-004)'),
          ('estados lote importacion',      'Estados del lote de importación de itinerario'),
          ('estados fila importacion',      'Resultado de validación de cada fila importada'),
          ('acciones reconciliacion',       'Acción sugerida en reconciliación de schedule (UC-08)'),
          -- Integraciones
          ('tipos integracion',             'Sistemas externos integrados (IE-001 a IE-008)'),
          ('protocolos integracion',        'Protocolo / canal técnico de integración'),
          ('estados integracion',           'Estado de salud de un canal de integración (MO-001)'),
          ('tipos mensaje integracion',     'Tipos de mensaje AIDX, MVT, AODB, PVAS, CORPAC, OAG, PA'),
          ('estados mensaje integracion',   'Estado de procesamiento de mensajes de integración'),
          ('direccion mensaje',             'Dirección del mensaje (entrada/salida)'),
          ('tipos autenticacion api',       'Mecanismo de autenticación de clientes API (IE-007)'),
          ('disparadores anuncio pa',       'Eventos que disparan anuncios por PA/AFAS (IE-006, AL-007)'),
          ('estados anuncio pa',            'Estado de un anuncio enviado a PA/AFAS'),
          -- Dispositivos
          ('tipos pantalla',                'Tipos de pantalla FIDS/GIDS/CIDS/BIDS/DS (DP-002)'),
          ('orientacion pantalla',          'Orientación horizontal / vertical (DP-003)'),
          ('resoluciones pantalla',         'Resoluciones soportadas HD a 4K (DP-003)'),
          ('estados dispositivo',           'Estado online/offline/error del dispositivo (DM-001)'),
          ('tipos comando dispositivo',     'Acciones remotas sobre dispositivos (DM-002, DM-003)'),
          ('estados comando dispositivo',   'Estado de ejecución de un comando remoto'),
          ('tipos incidente dispositivo',   'Tipos de incidente de dispositivo (DM-004, DM-005)'),
          -- Grupos de comportamiento y plantillas
          ('tipos contenido grupo',         'Contenido que muestra un grupo de comportamiento (GB-001)'),
          ('tipos regla grupo',             'Tipos de regla condicional de un grupo (GB-003)'),
          ('operadores regla',              'Operadores de comparación para reglas condicionales'),
          ('campos plantilla',              'Campos disponibles para plantillas visuales (PL-001, PL-002)'),
          ('tipos widget',                  'Widgets dinámicos de plantilla (PL-005)'),
          ('idiomas',                       'Idiomas de presentación (PL-003)'),
          -- Contenido comercial y wayfinding
          ('tipos multimedia',              'Formatos multimedia soportados (PL-004)'),
          ('estados campana',               'Estados de campaña publicitaria (PL-006)'),
          ('prioridad campana',             'Prioridad de campaña publicitaria (PL-006)'),
          ('tipos servicio wayfinding',     'Servicios ubicables en mapas de wayfinding (PL-007, FV-002)'),
          -- Alertas
          ('tipos alerta emergencia',       'Tipos de alerta de emergencia (AL-002)'),
          ('origen alerta emergencia',      'Origen de la alerta: manual o PVAS (IE-005)'),
          ('cobertura alerta',              'Cobertura de la alerta: todas las pantallas o sector (AL-001)'),
          ('estados alerta emergencia',     'Estados del ciclo de vida de una alerta de emergencia'),
          ('estados pantalla alerta',       'Estado de despliegue/restauración por pantalla (AL-004)'),
          ('tipos alerta operacional',      'Alertas operacionales automáticas (AL-005)'),
          -- Seguridad
          ('proveedores autenticacion',     'Proveedor de identidad del usuario (SC-002, SC-003)'),
          ('tipos mfa',                     'Mecanismos de autenticación multifactor (SC-004)'),
          ('motivos fin sesion',            'Motivo de cierre de sesión (SC-007)'),
          ('acciones auditoria',            'Acciones registradas en el log de auditoría (SC-005)'),
          -- Monitoreo y reportería
          ('niveles log',                   'Niveles de log del sistema (MO-005)'),
          ('componentes sistema',           'Componentes monitoreados para SLA (MO-001, MO-006)'),
          ('tipos evento sistema',          'Eventos críticos del sistema (MO-004)'),
          ('canales notificacion',          'Canales de notificación automática (MO-004)'),
          ('estados notificacion',          'Estado de envío de notificaciones'),
          ('periodos sla',                  'Periodo de cálculo del SLA (MO-006)'),
          ('tipos reporte',                 'Reportes operacionales y de disponibilidad (MO-002, MO-003)'),
          ('formatos exportacion',          'Formatos de exportación de reportes y logs'),
          ('estados reporte',               'Estado de generación de reportes'),
          -- Parámetros
          ('parametros vuelos',             'Parámetros de gestión de vuelos y recursos'),
          ('parametros dispositivos',       'Parámetros de monitoreo y administración de dispositivos'),
          ('parametros alertas',            'Parámetros de alertas de emergencia y operacionales'),
          ('parametros integracion',        'Parámetros de integraciones externas'),
          ('parametros seguridad',          'Parámetros de autenticación, contraseñas y sesiones'),
          ('parametros monitoreo',          'Parámetros de log, SLA y disponibilidad'),
          ('parametros visualizacion',      'Parámetros de presentación en pantallas')
     ) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM "public"."feature_group" fg WHERE trim(lower(fg.name)) = trim(lower(v.name)));


INSERT INTO "public"."feature" ("description", "abbreviation", "feature_value", "is_active", "feature_group_id", "created_by", "created_date")
SELECT v.description, v.abbreviation, v.feature_value, true, fg.id, 'script_fids', CURRENT_TIMESTAMP
FROM (VALUES
          -- estados vuelo fids (sección 6.3 del documento)
          ('estados vuelo fids','SCH','SCH','PROGRAMADO'),
          ('estados vuelo fids','SCT','SCT','CONFIRMADO'),
          ('estados vuelo fids','GTO','GTO','LLAMADA'),
          ('estados vuelo fids','BST','BST','EMBARCANDO'),
          ('estados vuelo fids','BEN','BEN','ULTIMA LLAMADA'),
          ('estados vuelo fids','GCL','GCL','FIN EMBARQUE'),
          ('estados vuelo fids','OFB','OFB','FIN EMBARQUE (OFF-BLOCK)'),
          ('estados vuelo fids','LAN','LAN','ATERRIZO'),
          ('estados vuelo fids','ONB','ONB','ATERRIZO (ON-BLOCK)'),
          ('estados vuelo fids','DEL','DEL','DEMORADO'),
          ('estados vuelo fids','DX','DX','CANCELADO'),
          ('estados vuelo fids','DV','DV','DESVIADO'),
          -- origen cambio vuelo
          ('origen cambio vuelo','MANUAL','MANUAL','Manual (Operador CCA)'),
          ('origen cambio vuelo','AODB','AODB','AODB'),
          ('origen cambio vuelo','AIDX','AIDX','Mensaje AIDX'),
          ('origen cambio vuelo','TYPEB','TYPEB','Mensaje Type-B (MVT)'),
          ('origen cambio vuelo','CORPAC','CORPAC','Notificación CORPAC'),
          ('origen cambio vuelo','OAG','OAG','Schedule OAG'),
          ('origen cambio vuelo','IMPORT','IMPORT','Importación en lote'),
          ('origen cambio vuelo','SCHEDULER','SCHEDULER','Automático (Scheduler / Call to Gate)'),
          ('origen cambio vuelo','BOTONERA','BOTONERA','Botonera virtual (Aerolínea)'),
          ('origen cambio vuelo','ACARS','ACARS','ACARS'),
          -- tipos conexion vuelo
          ('tipos conexion vuelo','NONE','NONE','Sin conexión'),
          ('tipos conexion vuelo','DOM-DOM','DOM-DOM','Doméstico - Doméstico'),
          ('tipos conexion vuelo','DOM-INT','DOM-INT','Doméstico - Internacional'),
          ('tipos conexion vuelo','INT-DOM','INT-DOM','Internacional - Doméstico'),
          ('tipos conexion vuelo','INT-INT','INT-INT','Internacional - Internacional'),
          -- campos bloqueables vuelo (feature_value = columna física en flight)
          ('campos bloqueables vuelo','ESTIMATED_TIME','estimated_time','Hora estimada'),
          ('campos bloqueables vuelo','STATUS','status_id','Estado del vuelo'),
          ('campos bloqueables vuelo','SCHEDULED_TIME','scheduled_time','Hora programada'),
          ('campos bloqueables vuelo','AIRCRAFT','aircraft_id','Aeronave'),
          ('campos bloqueables vuelo','AIRCRAFT_TYPE','aircraft_type_id','Tipo de aeronave'),
          ('campos bloqueables vuelo','REMARKS','remarks','Observaciones'),
          ('campos bloqueables vuelo','GATE','gate','Puerta de embarque asignada'),
          ('campos bloqueables vuelo','COUNTER','counter','Mostradores asignados'),
          ('campos bloqueables vuelo','BELT','belt','Cinta de equipaje asignada'),
          -- eventos tiempo vuelo
          ('eventos tiempo vuelo','CHECKIN_OPEN','CHECKIN_OPEN','Apertura de mostradores'),
          ('eventos tiempo vuelo','CHECKIN_CLOSE','CHECKIN_CLOSE','Cierre de mostradores'),
          ('eventos tiempo vuelo','GATE_OPEN','GATE_OPEN','Apertura de puerta de embarque'),
          ('eventos tiempo vuelo','CALL_TO_GATE','GTO','Call to Gate (estado GTO)'),
          ('eventos tiempo vuelo','BOARDING','BST','Inicio de embarque (estado BST)'),
          ('eventos tiempo vuelo','LAST_CALL','BEN','Última llamada (estado BEN)'),
          ('eventos tiempo vuelo','GATE_CLOSE','GCL','Cierre de puerta (estado GCL)'),
          ('eventos tiempo vuelo','DISPLAY_FROM','DISPLAY_FROM','Inicio de aparición en pantalla'),
          ('eventos tiempo vuelo','DISPLAY_UNTIL','DISPLAY_UNTIL','Fin de aparición en pantalla'),
          ('eventos tiempo vuelo','AUTO_DELAY','DEL','Marcado automático de demora'),
          ('eventos tiempo vuelo','BELT_OPEN','BELT_OPEN','Apertura de cinta de equipaje'),
          ('eventos tiempo vuelo','BELT_CLOSE','BELT_CLOSE','Cierre de cinta de equipaje'),
          -- referencia tiempo vuelo
          ('referencia tiempo vuelo','SCHEDULED','scheduled_time','Hora programada (STD/STA)'),
          ('referencia tiempo vuelo','ESTIMATED','estimated_time','Hora estimada (ETD/ETA)'),
          ('referencia tiempo vuelo','ACTUAL','actual_block_time','Hora real (ATD/ATA)'),
          -- acciones asignacion recurso
          ('acciones asignacion recurso','ASSIGN','ASSIGN','Asignación'),
          ('acciones asignacion recurso','REASSIGN','REASSIGN','Reasignación'),
          ('acciones asignacion recurso','OPEN','OPEN','Apertura'),
          ('acciones asignacion recurso','LOGO_CHANGE','LOGO_CHANGE','Cambio de logo activo'),
          ('acciones asignacion recurso','CLOSE','CLOSE','Cierre'),
          ('acciones asignacion recurso','RELEASE','RELEASE','Liberación'),
          -- tipos archivo itinerario
          ('tipos archivo itinerario','CSV','CSV','Archivo CSV'),
          ('tipos archivo itinerario','DGAC_XLSX','DGAC_XLSX','Formato DGAC temporada (.xlsx)'),
          ('tipos archivo itinerario','OACI_XLSX','OACI_XLSX','Itinerario mensual formato OACI (.xlsx)'),
          ('tipos archivo itinerario','OAG','OAG','Schedule OAG'),
          ('tipos archivo itinerario','AIRLINE_SSIM','SSIM','Schedule aerolínea (SSIM)'),
          -- estados lote importacion
          ('estados lote importacion','UPLOADED','UPLOADED','Cargado'),
          ('estados lote importacion','VALIDATING','VALIDATING','Validando'),
          ('estados lote importacion','VALIDATED','VALIDATED','Validado – pendiente de confirmación'),
          ('estados lote importacion','CONFIRMED','CONFIRMED','Confirmado e importado'),
          ('estados lote importacion','CANCELLED','CANCELLED','Cancelado'),
          ('estados lote importacion','FAILED','FAILED','Fallido'),
          -- estados fila importacion
          ('estados fila importacion','VALID','VALID','Válido'),
          ('estados fila importacion','ERROR','ERROR','Con error'),
          ('estados fila importacion','DUPLICATE','DUPLICATE','Duplicado'),
          ('estados fila importacion','IMPORTED','IMPORTED','Importado'),
          -- acciones reconciliacion
          ('acciones reconciliacion','CREATE','CREATE','Crear vuelo'),
          ('acciones reconciliacion','UPDATE','UPDATE','Actualizar vuelo'),
          ('acciones reconciliacion','CANCEL','CANCEL','Marcar DX'),
          ('acciones reconciliacion','NONE','NONE','Sin cambios'),
          -- tipos integracion
          ('tipos integracion','AODB','AODB','AODB'),
          ('tipos integracion','AIDX','AIDX','IATA AIDX'),
          ('tipos integracion','TYPEB','TYPEB','Type-B'),
          ('tipos integracion','PVAS','PVAS','PVAS – alertas y evacuación'),
          ('tipos integracion','PA_AFAS','PA_AFAS','Megafonía PA / AFAS'),
          ('tipos integracion','CORPAC','CORPAC','CORPAC – ETA'),
          ('tipos integracion','OAG','OAG','OAG – schedules'),
          ('tipos integracion','LDAP','LDAP','LDAP / Active Directory'),
          ('tipos integracion','NTP','NTP','Servidor NTP'),
          ('tipos integracion','ACARS','ACARS','ACARS'),
          ('tipos integracion','SMTP','SMTP','Servidor de correo'),
          ('tipos integracion','SMS','SMS','Gateway SMS'),
          -- protocolos integracion
          ('protocolos integracion','REST','REST','API REST'),
          ('protocolos integracion','MQ','MQ','Mensajería / cola'),
          ('protocolos integracion','WEBSOCKET','WEBSOCKET','WebSocket'),
          ('protocolos integracion','SOAP','SOAP','SOAP / XML'),
          ('protocolos integracion','EMAIL_PARSER','EMAIL_PARSER','Parser de correo'),
          ('protocolos integracion','SFTP','SFTP','SFTP'),
          ('protocolos integracion','TCP','TCP','Socket TCP'),
          -- estados integracion
          ('estados integracion','ONLINE','ONLINE','Conectado'),
          ('estados integracion','DEGRADED','DEGRADED','Degradado / latencia alta'),
          ('estados integracion','RECONNECTING','RECONNECTING','Reconectando'),
          ('estados integracion','OFFLINE','OFFLINE','Desconectado'),
          -- tipos mensaje integracion
          ('tipos mensaje integracion','AODB_UPDATE','AODB_UPDATE','Actualización desde AODB'),
          ('tipos mensaje integracion','AODB_PUSH','AODB_PUSH','Envío de cambio hacia AODB'),
          ('tipos mensaje integracion','AIDX_FLIGHTLEG','AIDX_FLIGHTLEG','AIDX FlightLegNotification'),
          ('tipos mensaje integracion','MVT_ATD','MVT_ATD','MVT – ATD'),
          ('tipos mensaje integracion','MVT_ATA','MVT_ATA','MVT – ATA'),
          ('tipos mensaje integracion','MVT_ETA','MVT_ETA','MVT – ETA'),
          ('tipos mensaje integracion','MVT_ETE','MVT_ETE','MVT – ETE'),
          ('tipos mensaje integracion','PVAS_SIGNAL','PVAS_SIGNAL','Señal de emergencia PVAS'),
          ('tipos mensaje integracion','CORPAC_ETA','CORPAC_ETA','Notificación ETA CORPAC'),
          ('tipos mensaje integracion','OAG_SCHEDULE','OAG_SCHEDULE','Schedule OAG'),
          ('tipos mensaje integracion','PA_COMMAND','PA_COMMAND','Comando de anuncio PA/AFAS'),
          ('tipos mensaje integracion','HEARTBEAT','HEARTBEAT','Heartbeat de canal'),
          -- estados mensaje integracion
          ('estados mensaje integracion','RECEIVED','RECEIVED','Recibido'),
          ('estados mensaje integracion','PROCESSED','PROCESSED','Procesado'),
          ('estados mensaje integracion','RETRYING','RETRYING','Reintentando'),
          ('estados mensaje integracion','ERROR','ERROR','Error'),
          ('estados mensaje integracion','DISCARDED','DISCARDED','Descartado'),
          -- direccion mensaje
          ('direccion mensaje','IN','IN','Entrada'),
          ('direccion mensaje','OUT','OUT','Salida'),
          -- tipos autenticacion api
          ('tipos autenticacion api','API_KEY','API_KEY','API Key'),
          ('tipos autenticacion api','OAUTH2','OAUTH2','OAuth 2.0 client credentials'),
          -- disparadores anuncio pa
          ('disparadores anuncio pa','CALL_TO_GATE','CALL_TO_GATE','Call to Gate'),
          ('disparadores anuncio pa','BOARDING','BOARDING','Embarque'),
          ('disparadores anuncio pa','LAST_CALL','LAST_CALL','Última llamada'),
          ('disparadores anuncio pa','GATE_CHANGE','GATE_CHANGE','Cambio de puerta'),
          ('disparadores anuncio pa','DELAY','DELAY','Demora'),
          ('disparadores anuncio pa','CANCELLATION','CANCELLATION','Cancelación'),
          ('disparadores anuncio pa','EMERGENCY','EMERGENCY','Alerta de emergencia'),
          -- estados anuncio pa
          ('estados anuncio pa','QUEUED','QUEUED','En cola'),
          ('estados anuncio pa','SENT','SENT','Enviado'),
          ('estados anuncio pa','PLAYING','PLAYING','En emisión'),
          ('estados anuncio pa','CONFIRMED','CONFIRMED','Emitido (confirmado)'),
          ('estados anuncio pa','FAILED','FAILED','Fallido'),
          -- tipos pantalla
          ('tipos pantalla','FIDS','FIDS','Flight Information Display'),
          ('tipos pantalla','GIDS','GIDS','Gate Information Display'),
          ('tipos pantalla','CIDS','CIDS','Check-in Information Display'),
          ('tipos pantalla','BIDS','BIDS','Baggage Information Display'),
          ('tipos pantalla','DS','DS','Dynamic Signage / Tótem'),
          -- orientacion pantalla
          ('orientacion pantalla','H','H','Horizontal'),
          ('orientacion pantalla','V','V','Vertical'),
          -- resoluciones pantalla
          ('resoluciones pantalla','HD','1366x768','HD (1366x768)'),
          ('resoluciones pantalla','HD720','1280x720','HD 720p (1280x720)'),
          ('resoluciones pantalla','FHD','1920x1080','Full HD (1920x1080)'),
          ('resoluciones pantalla','QHD','2560x1440','QHD (2560x1440)'),
          ('resoluciones pantalla','UHD4K','3840x2160','4K (3840x2160)'),
          -- estados dispositivo
          ('estados dispositivo','ONLINE','ONLINE','Online'),
          ('estados dispositivo','OFFLINE','OFFLINE','Offline'),
          ('estados dispositivo','ERROR','ERROR','Con errores'),
          ('estados dispositivo','MAINTENANCE','MAINTENANCE','En mantenimiento'),
          ('estados dispositivo','PENDING','PENDING','Pendiente de validación'),
          -- tipos comando dispositivo
          ('tipos comando dispositivo','REBOOT','REBOOT','Reiniciar'),
          ('tipos comando dispositivo','UPDATE_SOFTWARE','UPDATE_SOFTWARE','Actualizar software'),
          ('tipos comando dispositivo','UPDATE_CONFIG','UPDATE_CONFIG','Actualizar configuración'),
          ('tipos comando dispositivo','NTP_SYNC','NTP_SYNC','Sincronizar NTP'),
          ('tipos comando dispositivo','RELOAD_TEMPLATE','RELOAD_TEMPLATE','Recargar plantilla'),
          -- estados comando dispositivo
          ('estados comando dispositivo','PENDING','PENDING','Pendiente de confirmación'),
          ('estados comando dispositivo','QUEUED','QUEUED','En cola'),
          ('estados comando dispositivo','RUNNING','RUNNING','En ejecución'),
          ('estados comando dispositivo','SUCCESS','SUCCESS','OK'),
          ('estados comando dispositivo','FAILED','FAILED','Fallido'),
          ('estados comando dispositivo','ROLLED_BACK','ROLLED_BACK','Rollback aplicado'),
          ('estados comando dispositivo','CANCELLED','CANCELLED','Cancelado'),
          -- tipos incidente dispositivo
          ('tipos incidente dispositivo','OFFLINE','OFFLINE','Pérdida de heartbeat'),
          ('tipos incidente dispositivo','REPEATED_ERRORS','REPEATED_ERRORS','Errores repetidos'),
          ('tipos incidente dispositivo','NTP_DESYNC','NTP_DESYNC','Desincronización de hora'),
          ('tipos incidente dispositivo','UPDATE_FAILED','UPDATE_FAILED','Fallo de actualización'),
          -- tipos contenido grupo
          ('tipos contenido grupo','DEPARTURES','DEPARTURES','Salidas'),
          ('tipos contenido grupo','ARRIVALS','ARRIVALS','Llegadas'),
          ('tipos contenido grupo','MIXED','MIXED','Salidas y llegadas'),
          ('tipos contenido grupo','DEPARTURES_INT','DEPARTURES_INT','Salidas internacionales'),
          ('tipos contenido grupo','DEPARTURES_DOM','DEPARTURES_DOM','Salidas nacionales'),
          ('tipos contenido grupo','CONNECTIONS','CONNECTIONS','Conexiones'),
          ('tipos contenido grupo','GATE','GATE','Embarque (Gate)'),
          ('tipos contenido grupo','CHECKIN','CHECKIN','Check-in'),
          ('tipos contenido grupo','BAGGAGE','BAGGAGE','Equipaje (BIDS)'),
          ('tipos contenido grupo','SIGNAGE','SIGNAGE','Dynamic Signage'),
          ('tipos contenido grupo','WAYFINDING','WAYFINDING','Wayfinding'),
          ('tipos contenido grupo','EMERGENCY','EMERGENCY','Emergencia / Evacuación'),
          -- tipos regla grupo
          ('tipos regla grupo','FILTER','FILTER','Filtro de vuelos'),
          ('tipos regla grupo','DISPLAY_WINDOW','DISPLAY_WINDOW','Ventana de aparición'),
          ('tipos regla grupo','ROTATION','ROTATION','Rotación / alternancia'),
          ('tipos regla grupo','HIGHLIGHT','HIGHLIGHT','Resaltado condicional'),
          ('tipos regla grupo','SORT','SORT','Ordenamiento'),
          -- operadores regla
          ('operadores regla','EQ','=','Igual'),
          ('operadores regla','NEQ','<>','Distinto'),
          ('operadores regla','IN','IN','En lista'),
          ('operadores regla','NOT_IN','NOT IN','No en lista'),
          ('operadores regla','GT','>','Mayor que'),
          ('operadores regla','GTE','>=','Mayor o igual'),
          ('operadores regla','LT','<','Menor que'),
          ('operadores regla','LTE','<=','Menor o igual'),
          ('operadores regla','BETWEEN','BETWEEN','Entre'),
          -- campos plantilla
          ('campos plantilla','FLIGHT_NUMBER','flight_identity','Número de vuelo'),
          ('campos plantilla','AIRLINE_LOGO','airline_logo','Logo de aerolínea'),
          ('campos plantilla','AIRLINE_NAME','airline_name','Nombre de aerolínea'),
          ('campos plantilla','CODESHARE','codeshare','Códigos compartidos'),
          ('campos plantilla','ORIGIN','origin','Origen'),
          ('campos plantilla','DESTINATION','destination','Destino'),
          ('campos plantilla','VIA','via','Escala'),
          ('campos plantilla','SCHEDULED_TIME','scheduled_time','Hora programada'),
          ('campos plantilla','ESTIMATED_TIME','estimated_time','Hora estimada'),
          ('campos plantilla','ACTUAL_TIME','actual_time','Hora real'),
          ('campos plantilla','STATUS','status','Estado'),
          ('campos plantilla','GATE','gate','Puerta'),
          ('campos plantilla','COUNTER','counter','Mostrador'),
          ('campos plantilla','BELT','belt','Cinta de equipaje'),
          ('campos plantilla','AIRCRAFT','aircraft','Aeronave / matrícula'),
          ('campos plantilla','FLIGHT_TYPE','flight_type','Tipo de vuelo (NAC/INT)'),
          ('campos plantilla','REMARKS','remarks','Observaciones'),
          ('campos plantilla','NEXT_FLIGHT','next_flight','Próximo vuelo (GIDS)'),
          ('campos plantilla','MEDIA_ZONE','media_zone','Zona multimedia / publicidad'),
          ('campos plantilla','TICKER','ticker','Cintillo de texto'),
          ('campos plantilla','HEADER','header','Encabezado'),
          -- tipos widget
          ('tipos widget','CLOCK','CLOCK','Reloj local'),
          ('tipos widget','DATE','DATE','Fecha'),
          ('tipos widget','WEATHER','WEATHER','Temperatura / clima'),
          ('tipos widget','COUNTDOWN_GATE','COUNTDOWN_GATE','Contador a cierre de puerta'),
          ('tipos widget','MESSAGE','MESSAGE','Mensaje configurable'),
          ('tipos widget','BOARDING_PROGRESS','BOARDING_PROGRESS','Progreso de embarque'),
          -- idiomas
          ('idiomas','ES','es','Español'),
          ('idiomas','EN','en','English'),
          -- tipos multimedia
          ('tipos multimedia','MP4','video/mp4','Video MP4'),
          ('tipos multimedia','JPG','image/jpeg','Imagen JPG'),
          ('tipos multimedia','PNG','image/png','Imagen PNG'),
          ('tipos multimedia','GIF','image/gif','Imagen GIF'),
          ('tipos multimedia','SVG','image/svg+xml','Vectorial SVG'),
          ('tipos multimedia','TEXT','text/plain','Mensaje de texto'),
          -- estados campana
          ('estados campana','DRAFT','DRAFT','Borrador'),
          ('estados campana','SCHEDULED','SCHEDULED','Programada'),
          ('estados campana','ACTIVE','ACTIVE','Activa'),
          ('estados campana','PAUSED','PAUSED','Pausada'),
          ('estados campana','FINISHED','FINISHED','Finalizada'),
          ('estados campana','CANCELLED','CANCELLED','Cancelada'),
          -- prioridad campana
          ('prioridad campana','HIGH','1','Alta'),
          ('prioridad campana','MEDIUM','2','Media'),
          ('prioridad campana','LOW','3','Baja'),
          -- tipos servicio wayfinding
          ('tipos servicio wayfinding','ATM','ATM','Cajero'),
          ('tipos servicio wayfinding','SHOP','SHOP','Local comercial'),
          ('tipos servicio wayfinding','FOOD','FOOD','Restaurante / cafetería'),
          ('tipos servicio wayfinding','OFFICE','OFFICE','Oficina'),
          ('tipos servicio wayfinding','STAND','STAND','Stand'),
          ('tipos servicio wayfinding','VIP','VIP','Sala VIP'),
          ('tipos servicio wayfinding','PHARMACY','PHARMACY','Farmacia'),
          ('tipos servicio wayfinding','RESTROOM','RESTROOM','Servicios higiénicos'),
          ('tipos servicio wayfinding','INFO','INFO','Información'),
          ('tipos servicio wayfinding','GATE','GATE','Puerta de embarque'),
          ('tipos servicio wayfinding','COUNTER','COUNTER','Mostrador'),
          ('tipos servicio wayfinding','BELT','BELT','Cinta de equipaje'),
          ('tipos servicio wayfinding','EXIT','EXIT','Salida / salida de emergencia'),
          ('tipos servicio wayfinding','MEDICAL','MEDICAL','Tópico / primeros auxilios'),
          -- tipos alerta emergencia
          ('tipos alerta emergencia','EARTHQUAKE','SISMO','Terremoto / Sismo'),
          ('tipos alerta emergencia','FIRE','INCENDIO','Incendio'),
          ('tipos alerta emergencia','SILENT','ATENTADO','Atentado / Alerta silenciosa'),
          ('tipos alerta emergencia','TSUNAMI','TSUNAMI','Tsunami'),
          -- origen alerta emergencia
          ('origen alerta emergencia','MANUAL','MANUAL','Activación manual (AVSEC / CCA)'),
          ('origen alerta emergencia','PVAS','PVAS','Señal automática PVAS'),
          -- cobertura alerta
          ('cobertura alerta','ALL','ALL','Todas las pantallas'),
          ('cobertura alerta','SECTOR','SECTOR','Sector específico'),
          -- estados alerta emergencia
          ('estados alerta emergencia','PENDING','PENDING','Pendiente de confirmación'),
          ('estados alerta emergencia','ACTIVE','ACTIVE','Activa'),
          ('estados alerta emergencia','ENDED','ENDED','Finalizada'),
          ('estados alerta emergencia','CANCELLED','CANCELLED','Cancelada'),
          -- estados pantalla alerta
          ('estados pantalla alerta','SENT','SENT','Enviada'),
          ('estados pantalla alerta','DISPLAYING','DISPLAYING','Mostrando alerta'),
          ('estados pantalla alerta','RESTORING','RESTORING','Restaurando'),
          ('estados pantalla alerta','RESTORED','RESTORED','Restaurada'),
          ('estados pantalla alerta','FAILED','FAILED','Fallida'),
          -- tipos alerta operacional
          ('tipos alerta operacional','CANCELLATION','CANCELLATION','Cancelación'),
          ('tipos alerta operacional','GATE_CHANGE','GATE_CHANGE','Cambio de puerta / sala'),
          ('tipos alerta operacional','DIVERSION','DIVERSION','Desvío'),
          ('tipos alerta operacional','DELAY','DELAY','Demora sobre umbral'),
          ('tipos alerta operacional','BELT_CHANGE','BELT_CHANGE','Cambio de cinta'),
          -- proveedores autenticacion
          ('proveedores autenticacion','LOCAL','LOCAL','Usuario / contraseña local'),
          ('proveedores autenticacion','LDAP','LDAP','LDAP / Active Directory'),
          ('proveedores autenticacion','ENTRA_ID','ENTRA_ID','SSO Entra ID'),
          -- tipos mfa
          ('tipos mfa','TOTP','TOTP','TOTP (app autenticadora)'),
          ('tipos mfa','SMS','SMS','Código SMS'),
          -- motivos fin sesion
          ('motivos fin sesion','LOGOUT','LOGOUT','Cierre por usuario'),
          ('motivos fin sesion','TIMEOUT','TIMEOUT','Timeout por inactividad'),
          ('motivos fin sesion','EXPIRED','EXPIRED','Expiración'),
          ('motivos fin sesion','REVOKED','REVOKED','Revocada por administrador'),
          -- acciones auditoria
          ('acciones auditoria','LOGIN','LOGIN','Inicio de sesión'),
          ('acciones auditoria','LOGIN_FAILED','LOGIN_FAILED','Intento de inicio de sesión fallido'),
          ('acciones auditoria','LOGOUT','LOGOUT','Cierre de sesión'),
          ('acciones auditoria','ACCOUNT_LOCKED','ACCOUNT_LOCKED','Bloqueo de cuenta'),
          ('acciones auditoria','CREATE','CREATE','Creación'),
          ('acciones auditoria','UPDATE','UPDATE','Modificación'),
          ('acciones auditoria','DELETE','DELETE','Eliminación'),
          ('acciones auditoria','STATUS_CHANGE','STATUS_CHANGE','Cambio de estado de vuelo'),
          ('acciones auditoria','FIELD_LOCK','FIELD_LOCK','Bloqueo de campo'),
          ('acciones auditoria','FIELD_UNLOCK','FIELD_UNLOCK','Desbloqueo de campo'),
          ('acciones auditoria','IMPORT','IMPORT','Importación de itinerario'),
          ('acciones auditoria','ALERT_ACTIVATE','ALERT_ACTIVATE','Activación de alerta'),
          ('acciones auditoria','ALERT_DEACTIVATE','ALERT_DEACTIVATE','Desactivación de alerta'),
          ('acciones auditoria','DEVICE_COMMAND','DEVICE_COMMAND','Comando remoto a dispositivo'),
          ('acciones auditoria','GROUP_ASSIGN','GROUP_ASSIGN','Asignación de pantalla a grupo'),
          ('acciones auditoria','EXPORT','EXPORT','Exportación'),
          -- niveles log
          ('niveles log','ERROR','40','ERROR'),
          ('niveles log','WARNING','30','WARNING'),
          ('niveles log','INFO','20','INFO'),
          ('niveles log','DEBUG','10','DEBUG'),
          -- componentes sistema
          ('componentes sistema','API','API','API REST'),
          ('componentes sistema','WEBSOCKET','WEBSOCKET','WebSocket Server'),
          ('componentes sistema','SCHEDULER','SCHEDULER','Scheduler Service'),
          ('componentes sistema','INTEGRATION','INTEGRATION','Integration Service'),
          ('componentes sistema','DEVICE_MANAGER','DEVICE_MANAGER','Device Manager'),
          ('componentes sistema','AUTH','AUTH','Auth Service'),
          ('componentes sistema','DATABASE','DATABASE','Base de datos'),
          ('componentes sistema','CACHE','CACHE','Redis Cache / PubSub'),
          ('componentes sistema','DEVICE_NETWORK','DEVICE_NETWORK','Red de dispositivos'),
          -- tipos evento sistema
          ('tipos evento sistema','DEVICE_OFFLINE','DEVICE_OFFLINE','Dispositivo offline'),
          ('tipos evento sistema','DEVICE_ERROR','DEVICE_ERROR','Errores repetidos en dispositivo'),
          ('tipos evento sistema','INTEGRATION_FAILURE','INTEGRATION_FAILURE','Fallo de integración'),
          ('tipos evento sistema','ALERT_ERROR','ALERT_ERROR','Error de despliegue de alerta'),
          ('tipos evento sistema','SLA_WARNING','SLA_WARNING','SLA próximo a incumplirse'),
          ('tipos evento sistema','SLA_BREACH','SLA_BREACH','SLA incumplido'),
          ('tipos evento sistema','GENERIC','GENERIC','Evento general'),
          -- canales notificacion
          ('canales notificacion','EMAIL','EMAIL','Correo electrónico'),
          ('canales notificacion','SMS','SMS','SMS'),
          -- estados notificacion
          ('estados notificacion','PENDING','PENDING','Pendiente'),
          ('estados notificacion','SENT','SENT','Enviada'),
          ('estados notificacion','FAILED','FAILED','Fallida'),
          -- periodos sla
          ('periodos sla','MONTHLY','MONTHLY','Mensual'),
          ('periodos sla','ANNUAL','ANNUAL','Anual'),
          -- tipos reporte
          ('tipos reporte','DAILY_FLIGHTS','DAILY_FLIGHTS','Listado diario de vuelos'),
          ('tipos reporte','PUNCTUALITY','PUNCTUALITY','Puntualidad de vuelos'),
          ('tipos reporte','CANCELLED','CANCELLED','Vuelos cancelados'),
          ('tipos reporte','GATE_CHANGES','GATE_CHANGES','Cambios de puerta'),
          ('tipos reporte','DEVICE_UPTIME','DEVICE_UPTIME','Disponibilidad de dispositivos'),
          ('tipos reporte','DEVICE_INCIDENTS','DEVICE_INCIDENTS','Incidentes de dispositivos'),
          ('tipos reporte','SLA_MONTHLY','SLA_MONTHLY','Cumplimiento SLA mensual'),
          ('tipos reporte','AUDIT','AUDIT','Log de auditoría'),
          -- formatos exportacion
          ('formatos exportacion','PDF','PDF','PDF'),
          ('formatos exportacion','XLSX','XLSX','Excel'),
          ('formatos exportacion','CSV','CSV','CSV'),
          -- estados reporte
          ('estados reporte','PENDING','PENDING','En cola'),
          ('estados reporte','GENERATED','GENERATED','Generado'),
          ('estados reporte','FAILED','FAILED','Fallido'),
          -- ===================== PARÁMETROS =====================
          -- parametros vuelos
          ('parametros vuelos','DELAY_ALERT_THRESHOLD_MIN','30','Minutos de demora a partir de los cuales se genera alerta operacional (AL-005)'),
          ('parametros vuelos','AUTO_DELAY_AFTER_MIN','15','Minutos tras STD/STA sin actualización para marcar DEL automático'),
          ('parametros vuelos','CALL_TO_GATE_COMMERCIAL_MIN','15','Minutos antes del embarque que el pasajero permanece en zona comercial (SOP)'),
          ('parametros vuelos','MAX_FLIGHTS_PER_BELT','3','Máximo de vuelos simultáneos por cinta de equipaje (AR-003)'),
          ('parametros vuelos','MAX_FLIGHTS_PER_GATE','1','Máximo de vuelos simultáneos por puerta de embarque (AR-004)'),
          ('parametros vuelos','MAX_FLIGHTS_PER_COUNTER','2','Máximo de vuelos simultáneos por mostrador (AR-004)'),
          ('parametros vuelos','SYNC_AODB_ON_UNLOCK','true','Enviar el valor al AODB al desbloquear un campo (GV-008)'),
          ('parametros vuelos','SCHEDULER_INTERVAL_SEG','30','Frecuencia de evaluación del scheduler Call to Gate (UC-26)'),
          ('parametros vuelos','IMPORT_MAX_ROWS','20000','Máximo de filas por archivo de itinerario'),
          -- parametros dispositivos
          ('parametros dispositivos','HEARTBEAT_INTERVAL_SEG','30','Intervalo de heartbeat de dispositivos (UC-14)'),
          ('parametros dispositivos','OFFLINE_THRESHOLD_MIN','5','Minutos sin heartbeat para considerar un dispositivo offline (DM-004)'),
          ('parametros dispositivos','ESCALATION_OFFLINE_MIN','15','Minutos offline para escalar la alerta'),
          ('parametros dispositivos','MAX_REPEATED_ERRORS','3','Errores repetidos para generar alerta (DM-004)'),
          ('parametros dispositivos','MAX_MONITORS_VIDEO_WALL','6','Máximo de monitores por circuito de video wall (DP-004)'),
          ('parametros dispositivos','NTP_SERVER','pool.ntp.org','Servidor NTP en la nube (DP-005)'),
          ('parametros dispositivos','OFFLINE_RETRY_INTERVAL_SEG','10','Reintento de reconexión del dispositivo en modo offline (DM-006)'),
          ('parametros dispositivos','UPDATE_AUTO_ROLLBACK','true','Rollback automático ante fallo de actualización (DM-003)'),
          -- parametros alertas
          ('parametros alertas','EMERGENCY_DEPLOY_MAX_SEG','5','Tiempo máximo de despliegue de alerta de emergencia (UC-23)'),
          ('parametros alertas','RESTORE_MAX_SEG','10','Tiempo máximo de restauración post-alerta (AL-004)'),
          ('parametros alertas','MANUAL_REQUIRES_CONFIRMATION','true','La activación manual requiere confirmación'),
          ('parametros alertas','EMERGENCY_GROUP_PRIORITY','0','Prioridad del grupo de emergencia (GB-005)'),
          -- parametros integracion
          ('parametros integracion','MSG_MAX_RETRIES','5','Reintentos máximos de procesamiento de mensajes (UC-07)'),
          ('parametros integracion','MSG_RETRY_INTERVAL_SEG','30','Intervalo entre reintentos de mensajes'),
          ('parametros integracion','AIDX_SUPPORTED_VERSIONS','1.x,2.x','Versiones AIDX soportadas'),
          ('parametros integracion','OAG_IMPORT_CRON','0 3 * * *','Programación de importación OAG (UC-08)'),
          ('parametros integracion','API_DEFAULT_RATE_LIMIT_MIN','300','Rate limit por defecto de API REST (req/min) (IE-007)'),
          ('parametros integracion','CHANNEL_HEARTBEAT_TIMEOUT_SEG','120','Segundos sin heartbeat para marcar un canal como offline'),
          -- parametros seguridad
          ('parametros seguridad','PWD_MIN_LENGTH','12','Longitud mínima de contraseña (SC-002)'),
          ('parametros seguridad','PWD_REQUIRE_UPPER','true','Exige mayúsculas'),
          ('parametros seguridad','PWD_REQUIRE_LOWER','true','Exige minúsculas'),
          ('parametros seguridad','PWD_REQUIRE_DIGIT','true','Exige dígitos'),
          ('parametros seguridad','PWD_REQUIRE_SPECIAL','true','Exige caracteres especiales'),
          ('parametros seguridad','PWD_EXPIRY_DAYS','90','Caducidad de contraseña en días'),
          ('parametros seguridad','PWD_HISTORY_COUNT','5','Contraseñas anteriores que no pueden reutilizarse'),
          ('parametros seguridad','MAX_FAILED_LOGINS','5','Intentos fallidos antes de bloquear la cuenta (UC-29)'),
          ('parametros seguridad','LOCKOUT_MIN','15','Minutos de bloqueo de cuenta'),
          ('parametros seguridad','SESSION_TIMEOUT_DEFAULT_MIN','30','Timeout de sesión por defecto si el rol no define uno (SC-007)'),
          ('parametros seguridad','MFA_TOTP_ISSUER','FIDS AAP','Emisor mostrado en la app TOTP'),
          ('parametros seguridad','AUDIT_RETENTION_DAYS','365','Retención mínima del log de auditoría (UC-30)'),
          -- parametros monitoreo
          ('parametros monitoreo','LOG_LEVEL','INFO','Nivel mínimo de log del sistema (MO-005)'),
          ('parametros monitoreo','SLA_TARGET_PCT','99.9','Target de disponibilidad anual (MO-006)'),
          ('parametros monitoreo','SLA_WARNING_PCT','99.95','Umbral de advertencia previo al incumplimiento de SLA'),
          ('parametros monitoreo','DISPLAY_LATENCY_MAX_SEG','3','Latencia máxima cambio → pantalla (NF-002)'),
          ('parametros monitoreo','SYSTEM_LOG_RETENTION_DAYS','180','Retención del log de eventos del sistema'),
          ('parametros monitoreo','BACKUP_RETENTION_DAYS','30','Retención mínima de backups (NF-006)'),
          -- parametros visualizacion
          ('parametros visualizacion','DEFAULT_LANGUAGES','es,en','Idiomas de presentación por defecto (PL-003)'),
          ('parametros visualizacion','LANGUAGE_ROTATION_SEG','8','Segundos de alternancia de idioma'),
          ('parametros visualizacion','PAGE_DURATION_SEG','8','Segundos por página de vuelos'),
          ('parametros visualizacion','MIXED_ALTERNATE_SEG','20','Segundos de alternancia salidas/llegadas (grupo 3)'),
          ('parametros visualizacion','OFFLINE_INDICATOR','true','Mostrar indicador visual de modo offline (UC-16)')
     ) AS v(group_name, abbreviation, feature_value, description)
         INNER JOIN "public"."feature_group" fg ON trim(lower(fg.name)) = trim(lower(v.group_name))
WHERE NOT EXISTS (SELECT 1
                  FROM "public"."feature" f
                  WHERE f.feature_group_id = fg.id
                    AND upper(trim(f.abbreviation)) = upper(trim(v.abbreviation)));

-- Equivalencias operacionales (sección 6.3): OFB ≡ GCL, ONB ≡ LAN
UPDATE "public"."feature" f
SET parent_id = public.fn_get_feature_id('estados vuelo fids', 'GCL'), modified_by = 'script_fids', modified_date = CURRENT_TIMESTAMP
WHERE f.id = public.fn_get_feature_id('estados vuelo fids', 'OFB') AND f.parent_id IS NULL;

UPDATE "public"."feature" f
SET parent_id = public.fn_get_feature_id('estados vuelo fids', 'LAN'), modified_by = 'script_fids', modified_date = CURRENT_TIMESTAMP
WHERE f.id = public.fn_get_feature_id('estados vuelo fids', 'ONB') AND f.parent_id IS NULL;

    
    
