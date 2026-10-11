# Guía de usuario

[Volver al inicio](../README.md)

## Acceso a la plataforma

1. Abre la dirección del frontend; en desarrollo es `http://localhost:4200`.
2. Introduce el correo y la contraseña de tu usuario en `/login`.
3. Después de autenticarte, la plataforma muestra una bienvenida y el menú lateral.
4. Usa el menú para entrar a los módulos disponibles o las rutas indicadas en esta guía.
5. Para salir, utiliza la acción de cierre de sesión del shell. Esto elimina la sesión guardada en el navegador.

La sesión emitida por la API dura ocho horas. El acceso inicial requiere un usuario provisionado previamente; la interfaz no ofrece registro público ni recuperación de contraseña.

El menú se obtiene del catálogo de recursos activos, se organiza por padre y se ordena por peso y nombre. Sus entradas dependen de los datos registrados en PostgreSQL.

## Usuarios — `/users`

La pantalla permite consultar, crear, editar y dar de baja usuarios, además de seleccionar sus roles.

### Crear

1. Inicia la creación de un usuario.
2. Completa nombre y correo.
3. Introduce la contraseña y repítela en la confirmación.
4. Selecciona los roles que deseas asignar.
5. Guarda el formulario.

El correo debe tener formato válido y no estar registrado. Los roles disponibles para seleccionar excluyen los que están explícitamente inactivos.

### Editar

Selecciona un usuario y modifica nombre, correo o roles. Deja la contraseña vacía para conservarla; si la cambias, completa también su confirmación. Al guardar, la lista de roles seleccionada sustituye las asignaciones anteriores.

### Dar de baja

Selecciona la acción de eliminación y confirma. La operación marca el usuario como eliminado e inactivo; la pantalla deja de mostrarlo.

## Roles — `/roles`

1. Crea un rol indicando un nombre.
2. Edita un rol para cambiar su nombre.
3. Usa la acción de asignación de recursos para administrar sus accesos.
4. La eliminación confirmada desactiva el rol; no borra físicamente el registro.

El listado puede incluir roles inactivos. La pantalla de usuarios solo ofrece los roles activos para nuevas selecciones.

## Recursos y permisos de un rol — `/roles/:roleId/resources`

1. Entra desde el rol correspondiente.
2. Marca los recursos que deseas asociar.
3. Abre el diálogo de permisos de cada recurso.
4. Selecciona los permisos y confirma el diálogo.
5. Guarda los cambios en la pantalla principal.

Abrir el diálogo de permisos selecciona automáticamente el recurso si todavía no estaba marcado. Confirmar el diálogo modifica la selección local; la persistencia ocurre al guardar en la pantalla principal.

Los permisos disponibles son features activos del grupo llamado `permisos`. Si no se encuentra ese grupo, la aplicación consulta el ID `1`.

Al guardar, la aplicación retira permisos y recursos que ya no están seleccionados y agrega las nuevas asociaciones. Si se produce un error durante el proceso, recarga la pantalla para revisar qué cambios quedaron guardados.

## Catálogos — `/features`

La pantalla administra grupos de catálogo y sus elementos, llamados features.

### Grupos

- Crea un grupo con nombre y descripción opcional.
- Selecciona un grupo para consultar sus elementos.
- Edita el nombre o la descripción de un grupo existente.

### Features

Dentro del grupo seleccionado:

1. Crea un elemento con descripción y valor.
2. Añade abreviatura, estado y padre opcional cuando corresponda.
3. Edita sus datos para modificarlos.
4. La eliminación confirmada lo desactiva mediante una actualización.

Para administrar los permisos que ofrece la pantalla de roles, usa el grupo `permisos`. Descripciones como `Leer`, `Modificar`, `Eliminar` y `Aprobar`, o valores `R`, `M`, `D` y `A`, reciben estilos visuales diferenciados en esa pantalla; son ejemplos reconocidos por la interfaz, no una carga inicial incluida en el repositorio.

## Recursos de navegación — `/resources`

Los recursos definen las entradas y agrupaciones del menú.

| Campo | Uso |
| --- | --- |
| Nombre | Etiqueta del recurso. |
| Descripción | Texto descriptivo opcional. |
| Tipo | `GROUP` para agrupación o `UI` para una entrada de interfaz. |
| Ruta | Dirección Angular que abrirá la entrada, por ejemplo `/airlines`. |
| Método | Metadato HTTP; el formulario ofrece GET, POST, PUT, PATCH y DELETE. |
| Padre | Recurso bajo el que se agrupa la entrada. |
| Peso | Orden relativo dentro del menú; se ordena de menor a mayor. |
| Icono | Nombre del icono que representa la entrada. |
| Activo | Determina si el menú incluye el recurso. |

Nombre, tipo y ruta son obligatorios. Registrar una ruta aquí no implementa una pantalla nueva: debe existir también en la aplicación Angular.

La creación guarda tipo, padre y peso. En la edición actual, la API conserva esos tres valores anteriores aunque el formulario permita cambiarlos. Los demás campos copiados por la lógica de negocio sí se actualizan. La eliminación desactiva el recurso; al volver a cargar el menú deja de aparecer.

## Aerolíneas — `/airlines`

El módulo permite consultar, crear, editar y desactivar aerolíneas.

| Campo | Obligatorio | Longitud máxima |
| --- | --- | --- |
| Razón social (`company_name`) | Sí | 100 |
| RUC | No | 30 |
| Código SAP | No | 100 |
| Código OACI | No | 5 |
| Código IATA | No | 5 |

Completa el formulario y guarda. La creación establece la aerolínea activa. Al editar puedes cambiar sus datos y estado. La eliminación confirmada es una baja lógica; los registros inactivos pueden seguir apareciendo en el listado.

## Mensajes y carga de datos

- Mientras se carga o guarda una operación, la pantalla muestra el estado de procesamiento.
- Si un formulario tiene campos obligatorios incompletos, corrígelos antes de guardar.
- Cuando una operación falla, la pantalla puede mostrar el mensaje enviado por la API.
- Un error de conexión puede deberse a que la API no está disponible o a una URL/certificado de desarrollo incorrecto.

La interfaz actual controla el acceso por sesión. El menú y las rutas no se filtran por permisos específicos del rol; la asignación de permisos administra los datos de acceso, pero su comprobación por acción todavía no está conectada a los controladores existentes.
