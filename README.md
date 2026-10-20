# Kardo

*Your cards. Already there.*


PWA aplikácia na klubové a vernostné kartičky – naskenuješ kartu kamerou mobilu a pri pokladni ju ukážeš ako čiarový alebo QR kód. Funguje aj offline.

- **Backend:** Laravel 13 + MySQL (účty používateľov, každý vidí len svoje karty)
- **Frontend:** čisté JS bez build kroku (`public/app.js`, `public/styles.css`), service worker `public/sw.js`
- **Kódy:** [JsBarcode](https://github.com/lindell/JsBarcode) (EAN-13/8, UPC-A, Code 128/39, ITF), [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
- **Skenovanie:** natívne `BarcodeDetector` (Android/Chrome), inak [ZXing](https://github.com/zxing-js/library) (iPhone/Safari)

## Funkcie

- funguje aj bez registrácie – prvá karta založí hosťovský účet v tomto zariadení
- registrácia / prihlásenie e-mailom a heslom; karty pridané bez účtu sa pri registrácii či prihlásení pripoja k účtu
- pridanie karty skenovaním kamerou, z fotky alebo ručne (typ kódu sa rozpozná automaticky)
- detail karty s čiarovým / QR kódom, displej počas zobrazenia nezhasne (Wake Lock)
- „Naposledy použitá“ karta navrchu, vyhľadávanie
- úprava farby, poznámky, majiteľa karty
- export zálohy do JSON a obnova zo zálohy
- offline režim – karty sa držia v prehliadači, aplikácia sa načíta aj bez internetu

## Lokálny vývoj

```bash
composer install
cp .env.example .env
php artisan key:generate
# pre rýchly lokálny štart stačí SQLite: v .env nastav DB_CONNECTION=sqlite
php artisan migrate
php artisan serve
```

Otvor http://localhost:8000 (kamera funguje aj na `localhost`).

Testy: `php artisan test`

## Nasadenie na server

Požiadavky: PHP 8.3+, Composer, MySQL 8 (alebo MariaDB 10.6+), webserver (nginx/Apache), **HTTPS** – bez neho nefunguje inštalácia PWA ani kamera.

```bash
git clone https://github.com/mirodre/klubove-karticky.git
cd klubove-karticky
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

V `.env` nastav:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://karty.tvoja-domena.sk

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=karty
DB_USERNAME=karty
DB_PASSWORD=...

SESSION_SECURE_COOKIE=true
```

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Document root webservera musí smerovať do priečinka `public/`. Zapisovať musí vedieť do `storage/` a `bootstrap/cache/`.

Príklad pre nginx:

```nginx
server {
    server_name karty.tvoja-domena.sk;
    root /var/www/klubove-karticky/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # service worker sa nesmie dlho cachovať
    location = /sw.js {
        add_header Cache-Control "no-cache";
    }
}
```

### Aktualizácia

```bash
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

`app.js` a `styles.css` sa načítavajú s `?v=<hash>` podľa času zmeny súboru, takže po nasadení si mobily stiahnu novú verziu automaticky. Pri zmene súborov v `public/vendor`, `public/fonts` alebo `public/icons` zvýš `VERSION` v `public/sw.js`.

## Inštalácia na mobil

- **Android (Chrome):** otvor stránku → Nastavenia (ozubené koliesko) → *Nainštalovať aplikáciu*, alebo menu prehliadača → *Inštalovať aplikáciu*.
- **iPhone (Safari):** otvor stránku → *Zdieľať* → *Pridať na plochu*.

## Licencie

Písmo Manrope je pod licenciou SIL Open Font License 1.1. JsBarcode a ZXing (MIT / Apache 2.0) a qrcode-generator (MIT) sú v `public/vendor`.
