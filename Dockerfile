FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

FROM php:8.4-apache

RUN docker-php-ext-install pdo_mysql opcache \
    && a2enmod rewrite headers \
    # Debian Apache má globálny Alias /icons/ → prekrýva public/icons
    && sed -ri 's!^(\s*Alias /icons/)!#\1!' /etc/apache2/mods-available/alias.conf \
    && sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
    && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf \
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# service worker sa nesmie dlho cachovať
RUN printf '<Files "sw.js">\n  Header set Cache-Control "no-cache"\n</Files>\n' > /etc/apache2/conf-enabled/sw-nocache.conf

WORKDIR /var/www/html
COPY --from=vendor /app /var/www/html
RUN rm -f .env bootstrap/cache/*.php \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

EXPOSE 80
ENTRYPOINT ["entrypoint"]
CMD ["apache2-foreground"]
