# syntax=docker/dockerfile:1
# Frontend AAP_TUUA (Angular servido con nginx)
#   docker build . -t aap_tuua_frontend:latest
#   docker run -d --name aap_tuua_frontend -p 8080:8080 \
#     -e TUUA_API_URL=https://tuua-api.dominio.com/api \
#     -e TUUA_ENTRA_CLIENT_ID=... -e TUUA_ENTRA_TENANT_ID=... \
#     -e TUUA_ENTRA_API_SCOPE=api://.../access_as_user \
#     aap_tuua_frontend:latest

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Los valores del ambiente se inyectan al iniciar el contenedor (docker/40-tuua-env.sh),
# así la misma imagen sirve para desarrollo, QA y producción.
RUN cat > src/environments/environment.ts <<'EOF'
export const environment = {
  production: true,
  apiUrl: '__TUUA_API_URL__',
  entra: {
    clientId: '__TUUA_ENTRA_CLIENT_ID__',
    tenantId: '__TUUA_ENTRA_TENANT_ID__',
    apiScope: '__TUUA_ENTRA_API_SCOPE__',
  },
};
EOF

RUN npx ng build --configuration production


FROM nginx:1.29-alpine AS final

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 docker/40-tuua-env.sh /docker-entrypoint.d/40-tuua-env.sh
COPY --from=build /app/dist/AAP_TUUA_FRONTEND/browser /usr/share/nginx/html

# nginx sin root: los archivos se reescriben al iniciar, por eso pertenecen al usuario nginx
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 8080
