#!/bin/sh
set -e
cd /var/www/html

# storage je volume – pri prvom štarte je prázdne
mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
chown -R www-data:www-data storage bootstrap/cache

# počkaj na MySQL a spusti migrácie
i=0
until php artisan migrate --force --no-interaction; do
    i=$((i+1))
    [ "$i" -ge 30 ] && echo "Databáza nedostupná" && exit 1
    echo "Čakám na databázu ($i)…"; sleep 2
done

php artisan config:cache
php artisan route:cache
php artisan view:cache
chown -R www-data:www-data storage bootstrap/cache

exec "$@"
