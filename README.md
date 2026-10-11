# AAP_TUUA

Aplicación web de la plataforma TUUA con un frontend Angular y una API ASP.NET Core. El código actual implementa administración de usuarios, roles, recursos de navegación, permisos, catálogos y aerolíneas.

## Documentación

| Documento | Contenido |
| --- | --- |
| [Arquitectura y datos](docs/ARQUITECTURA.md) | Capas, componentes, modelo de datos, autenticación y comportamiento de la implementación. |
| [Referencia de la API](docs/API.md) | Endpoints, cuerpos de solicitud, respuestas y ejemplos de consumo. |
| [Guía de usuario](docs/GUIA_USUARIO.md) | Acceso y operación de los módulos de la interfaz. |
| [Frontend](AAP_TUUA_FRONTEND/README.md) | Comandos y organización de la aplicación Angular. |

## Tecnologías

Versiones declaradas en los archivos de proyecto; `package-lock.json` fija las dependencias del frontend.

| Componente | Tecnología |
| --- | --- |
| API y bibliotecas | .NET 10 / C#, ASP.NET Core |
| Autenticación | JWT Bearer, `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.12 |
| Contrato HTTP | `Microsoft.AspNetCore.OpenApi` 10.0.11 |
| Reglas de validación | FluentValidation 12.1.1 |
| Acceso a datos | Dapper 2.1.89 y Npgsql 10.0.3 |
| Base de datos | PostgreSQL |
| Interfaz | Angular 22.2, Angular Material y CDK 22.2 |
| Lenguaje del frontend | TypeScript ~6.0.2 |
| Programación reactiva | RxJS ~7.8.0 y signals de Angular |
| Pruebas del frontend | Vitest ^5.0.0 y jsdom ^30.0.0 |
| Contenedor de la API | Imágenes oficiales de .NET SDK y ASP.NET 10.0 |

## Estructura del repositorio

```text
AAP_TUUA/
├── AAP_TUUA.slnx             # Solución de los cuatro proyectos .NET
├── AAP_TUUA.API/             # Controladores HTTP, filtros y configuración
├── AAP_TUUA.Business/        # Lógica de negocio, validadores y DTO
├── AAP_TUUA.Dao/             # Consultas SQL con Dapper y Npgsql
├── AAP_TUUA.Entidades/       # Entidades compartidas por las capas del backend
├── AAP_TUUA_FRONTEND/        # Aplicación Angular independiente
├── docs/                    # Documentación técnica y funcional
└── Dockerfile               # Construcción y ejecución de la API
```

El frontend se instala y compila por separado; no forma parte de `AAP_TUUA.slnx`.

## Requisitos

- SDK de .NET 10.
- Node.js compatible con el lockfile: `^22.22.3 || ^24.15.0 || >=26.0.0`.
- npm; el proyecto declara `npm@11.19.0` como gestor de paquetes.
- Una base PostgreSQL con el esquema esperado y un usuario de aplicación existente.
- Docker, si se va a ejecutar la API en un contenedor.

El repositorio no incluye migraciones, scripts SQL de creación ni un proceso de carga inicial de usuarios. Para un entorno nuevo se necesita obtener el esquema y los datos iniciales del responsable de la base. Las tablas y vistas requeridas están descritas en [Arquitectura y datos](docs/ARQUITECTURA.md).

## Configuración

### Backend

La API utiliza la configuración estándar de ASP.NET Core: `appsettings.json`, el archivo del entorno y variables de entorno, entre otras fuentes. `appsettings.Development.json` únicamente ajusta el nivel de registro.

| Clave | Variable de entorno | Uso |
| --- | --- | --- |
| `connectionString` | `connectionString` | Conexión a PostgreSQL. |
| `secretKey` | `secretKey` | Clave simétrica para emitir y validar JWT con HS256. |
| `Jwt:Issuer` | `Jwt__Issuer` | Emisor esperado del token. |
| `Jwt:Audience` | `Jwt__Audience` | Audiencia esperada del token. |
| Entorno de ASP.NET Core | `ASPNETCORE_ENVIRONMENT` | Activa la configuración del entorno y OpenAPI en Development. |
| URLs de escucha | `ASPNETCORE_URLS` | Direcciones de la API cuando no se usan las del perfil de lanzamiento. |

Para definir la configuración en una terminal PowerShell, sustituye estos valores de ejemplo por los del entorno:

```powershell
$env:connectionString = 'Host=localhost;Port=5432;Database=tuua;Username=tuua_app;Password=<PASSWORD>'
$env:secretKey = '<CLAVE_ALEATORIA_DE_AL_MENOS_32_BYTES>'
$env:Jwt__Issuer = 'TUUA'
$env:Jwt__Audience = 'TUUA'
```

Las variables de entorno sobrescriben las claves del JSON para ese proceso. Los ejemplos de esta documentación usan marcadores de posición para las credenciales y la clave de firma.

### Frontend

La URL de la API se configura durante la compilación:

| Archivo | Uso | Valor actual de `apiUrl` |
| --- | --- | --- |
| `AAP_TUUA_FRONTEND/src/environments/environment.development.ts` | Desarrollo | `https://localhost:7120/api` |
| `AAP_TUUA_FRONTEND/src/environments/environment.ts` | Producción | `https://tuua-api.tudominio.com/api` |

La URL de producción es un valor de ejemplo. Cámbiala por la dirección real antes de generar el build. Mantén el sufijo `/api`; los servicios añaden el nombre del controlador y la operación.

## Ejecución local

### 1. API

Ejecuta desde la raíz del repositorio, en la terminal donde definiste las variables de configuración:

```powershell
dotnet restore AAP_TUUA.slnx
dotnet build AAP_TUUA.slnx
dotnet dev-certs https --trust
dotnet run --project AAP_TUUA.API/AAP_TUUA.API.csproj --launch-profile https
```

El perfil `https` configura el entorno Development y publica:

- HTTPS: `https://localhost:7120`.
- HTTP: `http://localhost:5034`.
- Contrato OpenAPI: `https://localhost:7120/openapi/v1.json`.

La API registra redirección a HTTPS. El frontend de desarrollo utiliza el puerto HTTPS del perfil. El contrato OpenAPI está disponible únicamente en Development; no hay una interfaz Swagger UI configurada.

### 2. Frontend

Abre otra terminal en `AAP_TUUA_FRONTEND` y ejecuta:

```powershell
npm ci
npm start
```

Accede a `http://localhost:4200`. La pantalla de inicio de sesión está en `/login`.

### 3. Acceso inicial

Usa el correo y la contraseña de un usuario ya provisionado en PostgreSQL. La creación de usuarios mediante la API requiere un token, por lo que no sustituye la provisión del primer usuario. No hay credenciales de acceso inicial documentadas ni un endpoint de registro público.

## Compilación y pruebas

Desde la raíz del repositorio:

```powershell
dotnet build AAP_TUUA.slnx --configuration Release
```

Desde `AAP_TUUA_FRONTEND`:

```powershell
npm run build
npm test -- --watch=false
```

- `npm run build` usa la configuración de producción de `angular.json` y genera artefactos en `dist/`.
- `npm run watch` compila continuamente con configuración de desarrollo.
- El backend no incluye proyectos de pruebas en la solución.
- El frontend contiene `src/app/app.spec.ts`. Una de sus pruebas conserva una expectativa del template inicial (`Hello, AAP_TUUA_FRONTEND`), mientras que `app.html` actualmente contiene un `router-outlet`. La suite requiere revisar esa expectativa para representar la interfaz actual.
- No hay un ejecutor de pruebas end-to-end configurado.

## Ejecución con Docker

El `Dockerfile` compila los proyectos .NET en una etapa SDK y publica la API en una imagen ASP.NET 10.0. El contenedor escucha en el puerto `8080`, usa el entorno Production y ejecuta con `USER $APP_UID`.

Desde la raíz del repositorio:

```powershell
docker build -t aap_tuua_api:latest .
docker run -d --name aap_tuua_api -p 8282:8080 --env connectionString --env secretKey --env Jwt__Issuer --env Jwt__Audience aap_tuua_api:latest
```

El comando de ejecución toma las cuatro variables de la terminal; deben estar definidas antes de lanzarlo. La dirección publicada es `http://localhost:8282/api`.

```powershell
docker logs aap_tuua_api
docker stop aap_tuua_api
docker start aap_tuua_api
```

La imagen contiene la API. PostgreSQL y el frontend necesitan ejecución independiente. Para usar esta API desde Angular, ajusta `apiUrl` y vuelve a compilar o reinicia el servidor de desarrollo. En contenedores, `localhost` en la cadena de conexión apunta al propio contenedor; usa un host PostgreSQL accesible desde él.

El contenedor expone HTTP y la aplicación incluye `UseHttpsRedirection()`. Cuando se publica detrás de una infraestructura HTTPS, la terminación TLS, las cabeceras reenviadas y la redirección deben corresponder a esa infraestructura. OpenAPI no se publica con el entorno Production predeterminado de la imagen.

## Solución de problemas

| Síntoma | Comprobación |
| --- | --- |
| Angular informa que Node.js no es compatible | Comprueba `node --version` y los rangos indicados en Requisitos. |
| El frontend no puede conectar con el servidor | Revisa que la API esté ejecutándose y que `apiUrl` coincida con protocolo, puerto y sufijo `/api`. |
| Error de certificado en desarrollo | Ejecuta `dotnet dev-certs https --trust` y comprueba el acceso a `https://localhost:7120/openapi/v1.json`. |
| Error de conexión a PostgreSQL | Revisa host, puerto, credenciales, acceso de red y opciones de conexión requeridas por tu servidor. |
| Error de relación o vista inexistente | Verifica las tablas y vistas descritas en la documentación de arquitectura. |
| El login rechaza las credenciales | Comprueba el correo y que el hash y el salt del usuario sean compatibles con `Security.cs`. |
| Respuesta `401` en operaciones de la API | Envía `Authorization: Bearer <TOKEN>` y revisa expiración, clave, emisor y audiencia. |
| El menú está vacío | Revisa `Resource/GetAll`, recursos activos y sus relaciones padre-hijo. |
| No aparecen permisos para asignar | Comprueba el grupo de features llamado `permisos` y sus elementos activos; la interfaz usa el ID `1` si no encuentra ese nombre. |

## Mantenimiento

Al modificar un módulo, actualiza su entidad y modelo TypeScript, las consultas DAO, las reglas de negocio, el controlador, el servicio Angular y la pantalla que corresponda. Documenta también cambios de rutas, requisitos de base de datos o configuración. Consulta el [recorrido de una operación](docs/ARQUITECTURA.md#recorrido-de-una-operación) para localizar esas piezas.
