# AAP_TUUA_FRONTEND

Interfaz de la plataforma TUUA, desarrollada con Angular 22.2, Angular Material y componentes standalone.

La [documentación principal](../README.md) explica la instalación de la API y la base de datos. Consulta también la [guía de usuario](../docs/GUIA_USUARIO.md), la [arquitectura](../docs/ARQUITECTURA.md) y la [referencia de API](../docs/API.md).

## Requisitos y ejecución

- Node.js compatible con `^22.22.3 || ^24.15.0 || >=26.0.0`, según el lockfile.
- npm; `package.json` declara `npm@11.19.0`.
- API disponible en la dirección configurada en el archivo de entorno.

Ejecuta desde esta carpeta:

```powershell
npm ci
npm start
```

El servidor de desarrollo publica `http://localhost:4200` y recarga la aplicación al cambiar el código. Sin una sesión válida, el acceso al shell redirige a `/login`.

## Configuración de la API

| Archivo | Configuración | `apiUrl` actual |
| --- | --- | --- |
| `src/environments/environment.development.ts` | Desarrollo | `https://localhost:7120/api` |
| `src/environments/environment.ts` | Producción | `https://tuua-api.tudominio.com/api` |

`angular.json` sustituye el archivo de producción por el de desarrollo al compilar con esa configuración. La URL de producción es de ejemplo y debe actualizarse antes de publicar. Los valores se integran durante la compilación; no hay un archivo de configuración HTTP cargado en tiempo de ejecución.

## Comandos

| Comando | Función |
| --- | --- |
| `npm ci` | Instala las dependencias del lockfile. |
| `npm start` | Inicia Angular en desarrollo. |
| `npm run build` | Genera el build de producción en `dist/`. |
| `npm run build -- --configuration development` | Genera un build de desarrollo. |
| `npm run watch` | Compila continuamente en desarrollo. |
| `npm test -- --watch=false` | Ejecuta las pruebas con el runner configurado por Angular/Vitest. |
| `npm run ng -- generate component nombre` | Genera un componente con el CLI local. |

La producción configura hash de salida y presupuestos de tamaño: bundle inicial de 500 kB para advertencia y 1 MB para error; estilos por componente de 8 kB y 16 kB respectivamente.

## Organización

```text
src/
├── main.ts                  # Arranque de Angular
├── environments/            # URL de API por configuración
├── material-theme.scss      # Tema Material
├── styles.css               # Estilos globales
└── app/
    ├── app.config.ts        # Router, HttpClient e interceptor
    ├── app.routes.ts        # Rutas con carga diferida
    ├── models/              # Interfaces de los contratos HTTP
    ├── services/            # Acceso a API y almacenamiento de sesión
    ├── guards/              # Control de acceso por sesión
    ├── layout/shell/        # Estructura autenticada
    ├── menu/                # Menú jerárquico obtenido desde la API
    ├── login/               # Inicio de sesión
    ├── home/                # Bienvenida
    ├── users/               # Usuarios y roles
    ├── roles/               # Roles
    ├── assign-resources/    # Recursos y permisos de un rol
    ├── features/            # Grupos y features
    ├── resources/           # Recursos de navegación
    └── airlines/            # Aerolíneas
```

La sesión se guarda en `localStorage` bajo `tuua.auth`. El interceptor añade el token Bearer y los guards revisan la sesión y su expiración. El menú usa recursos activos del listado general, sin filtrarlos por rol.

## Pruebas y publicación

El repositorio contiene `src/app/app.spec.ts`; su expectativa de un encabezado del template inicial no corresponde al `router-outlet` actual y necesita revisión. No hay pruebas end-to-end configuradas.

Publica los artefactos del build con un servidor de archivos estáticos y configura fallback a `index.html` para permitir la recarga de rutas como `/users` o `/roles`. El `Dockerfile` de la raíz publica la API; el frontend necesita su propio alojamiento.
