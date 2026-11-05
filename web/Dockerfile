# syntax=docker/dockerfile:1
# Web tier image (build context: repository root)
FROM node:20-alpine AS build
WORKDIR /site
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine
# Official image renders /etc/nginx/templates/*.template with envsubst at start-up
COPY web/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /site/dist /usr/share/nginx/html
ENV API_UPSTREAM=api:3000 DNS_RESOLVER=127.0.0.11
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
