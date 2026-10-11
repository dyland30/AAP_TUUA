Integración con Entra ID.
La aplicación actual con frontend angular 22 y backend .net 10, debe tener dos mecanismos de autenticación, usuarios de BD locales (campo is_external de local_user en true), y usuarios de Entra ID (campo is_external de local_user en false), a continuación defino los requerimientos:
1. En el componente login del frontend agrega otro boton: "Ingresa con tu cuenta corporativa", esto debe redirigir a la autenticación con Entra Id.
2. Se debe seguir utilizando la tabla local_user para el control de accesos, los roles se gestionan desde la aplicación, no en Entra ID, Entra ID es sólo para la autenticación. 
4. Elabora una guía de configuración para crear y configurar el/los appregistrations en Entra ID.
