/* Service worker – app shell offline, dáta rieši app.js (localStorage). */
const VERSION = 'v3';
const STATIC = `karty-static-${VERSION}`;
const PAGES = 'karty-pages';
const LOGOS = 'karty-logos';

// Súbory bez verzie v URL – uložia sa pri inštalácii.
const ASSETS = [
  '/vendor/jsbarcode.min.js',
  '/vendor/qrcode.js',
  '/vendor/zxing.min.js',
  '/fonts/manrope-latin.woff2',
  '/fonts/manrope-latin-ext.woff2',
  '/icons/logo.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.webmanifest',
];
// app.js a styles.css sa načítavajú s ?v=<verzia>; každá verzia má vlastný záznam v cache.
const VERSIONED = ['/app.js', '/styles.css'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('karty-static-') && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // vždy sieť

  // Stránky: najprv sieť, offline posledná uložená verzia aplikácie.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (url.pathname === '/' && res.ok && !res.redirected && res.type === 'basic') {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(async () => (await caches.match('/', { cacheName: PAGES })) || offlinePage()),
    );
    return;
  }

  // Verziované súbory: presná URL z cache, inak zo siete (staré verzie sa zmažú).
  if (VERSIONED.includes(url.pathname)) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) {
            const old = await cache.matchAll(url.pathname, { ignoreSearch: true });
            if (old.length) {
              const keys = await cache.keys(url.pathname, { ignoreSearch: true });
              await Promise.all(keys.map((k) => cache.delete(k)));
            }
            await cache.put(request, res.clone());
          }
          return res;
        } catch {
          return (await cache.match(url.pathname, { ignoreSearch: true })) || Response.error();
        }
      }),
    );
    return;
  }

  // Logá obchodov: z cache, pri prvom použití sa uložia (offline ostanú).
  if (url.pathname.startsWith('/logos/')) {
    event.respondWith(
      caches.open(LOGOS).then(async (cache) => {
        const cached = await cache.match(url.pathname);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(url.pathname, res.clone());
        return res;
      }),
    );
    return;
  }

  // Ostatné statické súbory: z cache, na pozadí aktualizovať.
  if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const cached = await cache.match(url.pathname);
        const network = fetch(request)
          .then((res) => { if (res.ok) cache.put(url.pathname, res.clone()); return res; })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

function offlinePage() {
  return new Response(
    '<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Offline</title><body style="font-family:system-ui;background:#F3F2EE;color:#17171A;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">' +
    '<div><h1>Ste offline</h1><p>Aplikáciu otvorte aspoň raz online, potom bude fungovať aj bez internetu.</p></div></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
