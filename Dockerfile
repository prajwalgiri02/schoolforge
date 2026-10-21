# Production image for SchoolForge Studio. compose.yaml runs the full stack:
# Studio, its queue worker and scheduler, and Caddy for HTTPS (Studio and every
# published school's domain).

FROM composer:2 AS vendor
WORKDIR /app
COPY . .
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader

FROM node:22-bookworm-slim AS assets
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
COPY --from=vendor /app/vendor ./vendor
RUN npm run build

FROM serversideup/php:8.3-fpm-nginx AS web
USER root
# Generating schools runs the generator (node), and installs packages for
# Laravel schools (composer, npm) and can commit them (git).
RUN install-php-extensions gd exif intl \
    && apt-get update && apt-get install -y --no-install-recommends git unzip && rm -rf /var/lib/apt/lists/*
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/html
COPY --chown=www-data:www-data . .
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build
COPY --from=assets --chown=www-data:www-data /app/bootstrap/ssr ./bootstrap/ssr
# The theme/component registry lives in a volume so themes and components made
# in Studio survive upgrades; on start, built-in ones added by an upgrade are
# copied in without overwriting anything already there.
RUN cp -r generator/registry /opt/registry-dist \
    && printf '#!/bin/sh\ncp -rn /opt/registry-dist/. /var/www/html/generator/registry/\n' > /etc/entrypoint.d/60-schoolforge-registry.sh \
    && chmod +x /etc/entrypoint.d/60-schoolforge-registry.sh \
    && mkdir -p database/data && touch database/data/database.sqlite && chown -R www-data:www-data database/data
USER www-data
ENV AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_MIGRATION=true \
    AUTORUN_LARAVEL_STORAGE_LINK=true \
    PHP_OPCACHE_ENABLE=1
EXPOSE 8080
