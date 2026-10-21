# Production image for this school website. See docker-compose.yml for the full
# stack (web, server-side rendering, scheduler and queue).

FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --no-autoloader
COPY . .
RUN composer dump-autoload --optimize --no-dev

FROM node:22-alpine AS assets
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
COPY --from=vendor /app/vendor ./vendor
RUN npm run build

# Server-side rendering: node plus the self-contained SSR bundle.
FROM node:22-alpine AS ssr
WORKDIR /app
COPY --from=assets /app/bootstrap/ssr ./bootstrap/ssr
USER node
EXPOSE 13714
CMD ["node", "bootstrap/ssr/app.js"]

# The website itself (default build target).
FROM serversideup/php:8.3-fpm-nginx AS web
USER root
RUN install-php-extensions gd exif intl
USER www-data
WORKDIR /var/www/html
COPY --chown=www-data:www-data . .
RUN mkdir -p database/data && touch database/data/database.sqlite
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build
COPY --from=assets --chown=www-data:www-data /app/bootstrap/ssr ./bootstrap/ssr
ENV AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_MIGRATION=true \
    AUTORUN_LARAVEL_STORAGE_LINK=true \
    PHP_OPCACHE_ENABLE=1
EXPOSE 8080
