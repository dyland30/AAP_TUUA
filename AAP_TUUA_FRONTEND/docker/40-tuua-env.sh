#!/bin/sh
# Reemplaza los marcadores __TUUA_*__ de los bundles con las variables de entorno del contenedor.
set -e

: "${TUUA_API_URL:?Debe definir TUUA_API_URL}"

for file in /usr/share/nginx/html/*.js; do
  sed -i \
    -e "s|__TUUA_API_URL__|${TUUA_API_URL}|g" \
    -e "s|__TUUA_ENTRA_CLIENT_ID__|${TUUA_ENTRA_CLIENT_ID:-}|g" \
    -e "s|__TUUA_ENTRA_TENANT_ID__|${TUUA_ENTRA_TENANT_ID:-}|g" \
    -e "s|__TUUA_ENTRA_API_SCOPE__|${TUUA_ENTRA_API_SCOPE:-}|g" \
    "$file"
done

echo "tuua-env: configuración aplicada (api: ${TUUA_API_URL})"
