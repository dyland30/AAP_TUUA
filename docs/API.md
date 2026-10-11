# Referencia de la API

[Volver al inicio](../README.md)

## Convenciones

- Base local con el perfil HTTPS: `https://localhost:7120/api`.
- Base con el contenedor documentado: `http://localhost:8282/api`.
- Cuerpos de solicitud JSON: `Content-Type: application/json`.
- Las rutas conservan los nombres de acción definidos en los controladores, como `GetAll`, `Add` y `Update`.
- Los IDs de usuarios, roles, recursos y aerolíneas son UUID. Los IDs de grupos, features y permisos son enteros.
- Las operaciones administrativas utilizan `[AuthFilter]` y reciben `Authorization: Bearer <TOKEN>`.
- El login es público. El atributo de autorización por permisos existe, pero no está aplicado a los endpoints listados.

El contrato generado por ASP.NET Core puede consultarse en `https://localhost:7120/openapi/v1.json` al ejecutar en Development. La API no configura Swagger UI.

## Autenticación

### `POST /api/Authentication/authenticate`

Cuerpo:

```json
{
  "email": "operador@example.com",
  "password": "<PASSWORD>"
}
```

Respuesta `200 OK`:

```json
{
  "user_id": "11111111-1111-4111-8111-111111111111",
  "email": "operador@example.com",
  "token": "<JWT>",
  "expires_in": 28800,
  "token_type": "bearer"
}
```

`expires_in` está expresado en segundos y equivale a ocho horas. Una solicitud sin datos válidos o con credenciales incorrectas devuelve `400` con el texto `Incorrect Username or Password`. Una excepción interna devuelve `500` con `There was an unexpected error, please try again`.

No existen endpoints de refresh, logout, registro público o recuperación de contraseña. El logout del frontend borra la sesión local.

## Usuarios

Prefijo: `/api/LocalUser`.

| Método | Ruta relativa | Entrada | Resultado de éxito |
| --- | --- | --- | --- |
| GET | `/GetAll` | Sin cuerpo | Lista de usuarios con sus roles. |
| GET | `/GetById/{id}` | UUID de usuario | Usuario con roles, recursos y permisos; `404` si no existe. |
| POST | `/Add` | `LocalUser` | `200` sin cuerpo. |
| POST | `/AddUserRole` | `UserRole` | `200` sin cuerpo. |
| PUT | `/Update` | `LocalUser` con ID | `200` sin cuerpo. |
| DELETE | `/Delete/{id}` | UUID de usuario | `200` sin cuerpo; baja lógica. |
| GET | `/GetUsersByRoleId/{roleId}` | UUID de rol | Lista de usuarios asignados. |
| GET | `/GetUsersByPermissionAndResource/{permissionName}/{resourcePath}` | Nombre de permiso y ruta del recurso | Lista de usuarios que coinciden con la consulta de permiso/recurso. |

### Crear un usuario

Ejemplo de cuerpo para `/Add`:

```json
{
  "name": "Operador de ejemplo",
  "email": "operador@example.com",
  "password": "<PASSWORD>",
  "confirm_password": "<PASSWORD>",
  "roles": [
    { "id": "22222222-2222-4222-8222-222222222222" }
  ]
}
```

Nombre y correo son obligatorios, el correo debe tener formato válido y la contraseña debe coincidir con su confirmación. La creación rechaza correos existentes. El ID del rol debe corresponder a un registro real; la creación de usuarios omite roles no encontrados. La API genera el UUID del usuario, la auditoría y los datos de contraseña, pero este endpoint no devuelve el usuario creado.

### Actualizar un usuario

Envía `id`, `name` y `email`, además de las propiedades que quieras actualizar. Para cambiar la contraseña, incluye `password` y `confirm_password`; si no envías una contraseña nueva, se conserva la anterior.

- `roles: null` u omitir `roles`: conserva las asignaciones actuales.
- `roles: []`: elimina las asignaciones actuales.
- `roles` con IDs: sincroniza las asignaciones con esa lista.

La actualización conserva los estados existentes del usuario; no copia los indicadores de actividad o verificación del cuerpo recibido.

### Asignar un rol

Cuerpo para `/AddUserRole`:

```json
{
  "user_id": "11111111-1111-4111-8111-111111111111",
  "role_id": "22222222-2222-4222-8222-222222222222"
}
```

Esta operación valida que ambos registros existan. No hay endpoint directo de `RemoveUserRole`; para quitar asignaciones usa `/Update` con la lista de roles deseada.

`resourcePath` en la consulta por permiso/recurso es un solo segmento de la URL. Las rutas que contienen `/` requieren revisar cómo las procesa el servidor o proxy; no hay un parámetro catch-all en el controlador.

## Roles y asignación de accesos

Prefijo: `/api/Role`.

| Método | Ruta relativa | Entrada | Resultado de éxito |
| --- | --- | --- | --- |
| GET | `/GetAll` | Sin cuerpo | Lista de roles. |
| GET | `/GetById/{id}` | UUID de rol | Rol con sus recursos y permisos. |
| POST | `/Add` | `Role` | Rol creado. |
| PUT | `/Update` | `Role` con ID | `200` sin cuerpo. |
| DELETE | `/Delete/{id}` | UUID de rol | `200` sin cuerpo; desactiva el rol. |
| POST | `/AddRoleResource` | `RoleResource` | Asociación rol-recurso. |
| DELETE | `/RemoveRoleResource` | `RoleResource` en el cuerpo | `200` sin cuerpo. |
| POST | `/AddRoleResourcePermission` | `RoleResourcePermissions` | `200` sin cuerpo. |
| DELETE | `/RemoveRoleResourcePermission` | `RoleResourcePermissions` en el cuerpo | `200` sin cuerpo. |
| GET | `/GetPermissionsByRoleIdAndResourceId/{roleId}/{resourceId}` | UUID de rol y recurso | Lista de permisos asignados. |
| GET | `/GetRoleResourcePermissionByIds/{roleId}/{resourceId}/{permissionId}` | UUID de rol/recurso e ID entero del permiso | Asociación de permiso consultada. |

### Crear o actualizar un rol

Crear:

```json
{
  "name": "Operador"
}
```

Actualizar:

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "name": "Operador actualizado",
  "is_active": true
}
```

El nombre es obligatorio. La creación establece el estado activo. En Update incluye el estado que quieres conservar, porque la actualización utiliza el objeto recibido.

### Asociar un recurso

Cuerpo para agregar o quitar un recurso:

```json
{
  "role_id": "22222222-2222-4222-8222-222222222222",
  "resource_id": "33333333-3333-4333-8333-333333333333"
}
```

### Asociar un permiso

Cuerpo para agregar un permiso:

```json
{
  "role_id": "22222222-2222-4222-8222-222222222222",
  "resource_id": "33333333-3333-4333-8333-333333333333",
  "permission_id": 1,
  "is_active": true
}
```

`permission_id` identifica un feature existente. Agrega primero la asociación rol-recurso. Para eliminar el permiso, envía los tres IDs a `/RemoveRoleResourcePermission`; quita los permisos antes de quitar su recurso asociado.

Ambas operaciones DELETE de asociaciones reciben JSON en el cuerpo. El cliente o proxy debe preservar ese cuerpo, tal como hace `RoleService` en Angular.

## Recursos

Prefijo: `/api/Resource`.

| Método | Ruta relativa | Entrada | Resultado de éxito |
| --- | --- | --- | --- |
| GET | `/GetAll` | Sin cuerpo | Lista desde `view_resource_expanded`. |
| GET | `/GetById/{id}` | UUID de recurso | Recurso consultado. |
| POST | `/Add` | `Resource` | Recurso creado. |
| PUT | `/Update` | `Resource` con ID | Objeto recibido por la operación. |

Ejemplo de creación de un recurso de navegación:

```json
{
  "name": "Aerolíneas",
  "description": "Mantenimiento de aerolíneas",
  "type": "UI",
  "path": "/airlines",
  "method": "GET",
  "parent_id": null,
  "weight": 10,
  "icon": "flight",
  "is_active": true
}
```

Nombre, ruta y tipo son obligatorios. La interfaz ofrece `GROUP` y `UI`; el validador del backend no restringe el tipo a esa lista.

No hay endpoint DELETE. Para una baja lógica, consulta el recurso y envía sus datos a `/Update` con `is_active: false`.

La implementación de Update conserva el `type`, `weight` y `parent_id` del registro previo; los nuevos valores recibidos para esas propiedades no se persisten. Su respuesta devuelve el objeto recibido, por lo que una consulta posterior representa mejor el estado guardado.

## Catálogos: grupos y features

Prefijo: `/api/Feature`.

| Método | Ruta relativa | Entrada | Resultado de éxito |
| --- | --- | --- | --- |
| GET | `/GetAllFeatureGroups` | Sin cuerpo | Lista de grupos; no carga sus elementos automáticamente. |
| GET | `/GetFeaturesByGroup/{groupId}` | ID entero del grupo | Lista de features del grupo. |
| POST | `/AddFeatureGroup` | `FeatureGroup` | Grupo creado con ID. |
| PUT | `/UpdateFeatureGroup` | `FeatureGroup` con ID | Grupo actualizado. |
| POST | `/AddFeature` | `Feature` | Feature creado con ID. |
| PUT | `/UpdateFeature` | `Feature` con ID | Feature actualizado. |

Crear un grupo:

```json
{
  "name": "permisos",
  "description": "Permisos disponibles para los recursos"
}
```

Crear un feature, sustituyendo `feature_group_id` por el ID real del grupo:

```json
{
  "description": "Leer",
  "abbreviation": "R",
  "feature_value": "R",
  "is_active": true,
  "parent_id": null,
  "feature_group_id": 1
}
```

Un grupo requiere nombre. Un feature requiere descripción y valor; incluye el grupo y el estado en el cuerpo. La base genera los IDs de creación. Para editar, añade el ID correspondiente. La desactivación de un feature utiliza `/UpdateFeature` con `is_active: false`. No hay endpoints de eliminación de grupos o features.

## Aerolíneas

Prefijo: `/api/Airline`.

| Método | Ruta relativa | Entrada | Resultado de éxito |
| --- | --- | --- | --- |
| GET | `/GetAll` | Sin cuerpo | Lista ordenada por `company_name`, incluidos registros inactivos. |
| GET | `/GetById/{id}` | UUID de aerolínea | Aerolínea consultada. |
| POST | `/Add` | `Airline` | Aerolínea creada con ID. |
| PUT | `/Update` | `Airline` con ID | Aerolínea actualizada. |
| DELETE | `/Delete/{id}` | UUID de aerolínea | `200` sin cuerpo; desactiva la aerolínea. |

Ejemplo de creación:

```json
{
  "company_name": "Aerolínea de ejemplo",
  "ruc": "12345678901",
  "cod_sap": "SAP001",
  "oaci_code": "ABC",
  "iata_code": "AB",
  "is_active": true
}
```

| Campo | Regla de validación |
| --- | --- |
| `company_name` | Obligatorio; máximo 100 caracteres. |
| `ruc` | Opcional; máximo 30 caracteres. |
| `cod_sap` | Opcional; máximo 100 caracteres. |
| `oaci_code` | Opcional; máximo 5 caracteres. |
| `iata_code` | Opcional; máximo 5 caracteres. |

La creación fuerza `is_active=true`. Para actualizar, incluye el UUID y el estado que debe quedar guardado. El controlador no implementa una validación específica de existencia en Update.

## Respuestas y errores

| Código | Comportamiento implementado |
| --- | --- |
| `200` | Lectura o escritura correcta. Varias escrituras usan `Ok()` sin cuerpo. |
| `204` | Puede aparecer cuando una acción devuelve `Ok(null)`, por el tratamiento estándar de valores nulos de ASP.NET Core. |
| `400` | Credenciales incorrectas en login; también puede producirse por validación automática del contrato HTTP con `[ApiController]`. |
| `401` | Cabecera/token inválido o fallo durante la resolución en los filtros de autenticación. |
| `404` | Se devuelve explícitamente al consultar un usuario inexistente con `LocalUser/GetById`. |
| `500` | Excepciones capturadas por los controladores, incluidas muchas validaciones de negocio. |

Los controladores administrativos suelen devolver `e.Message` como cuerpo del `500`; no hay un formato de error propio uniforme. Por ejemplo, una contraseña no coincidente o un nombre obligatorio ausente puede llegar como `500` si la validación se ejecuta en Business. Las consultas individuales de otros módulos devuelven `Ok(resultado)` sin una comprobación explícita de `404`.

`RequirePermissionAttribute` puede generar `403`, pero ese filtro no está aplicado a los endpoints actuales. Consulta [Arquitectura y datos](ARQUITECTURA.md) para el detalle de los filtros.

## Ejemplo de consumo con PowerShell

Con la API local ejecutándose y el certificado de desarrollo confiable:

```powershell
$baseUrl = 'https://localhost:7120/api'
$credentials = @{
    email = 'operador@example.com'
    password = '<PASSWORD>'
} | ConvertTo-Json

$session = Invoke-RestMethod -Method Post -Uri "$baseUrl/Authentication/authenticate" -ContentType 'application/json' -Body $credentials
$headers = @{ Authorization = "Bearer $($session.token)" }

Invoke-RestMethod -Method Get -Uri "$baseUrl/Airline/GetAll" -Headers $headers
Invoke-RestMethod -Method Get -Uri "$baseUrl/LocalUser/GetById/$($session.user_id)" -Headers $headers
```

El correo, contraseña e identificadores de los ejemplos deben sustituirse por datos reales de tu entorno.
