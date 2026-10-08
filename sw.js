// Service Worker — La Aventura de la Capitana Karen
// Sube el número de versión si cambias archivos del "cascarón".
const CACHE = 'capitana-v1';
const SHELL = [
  './', './index.html', './manifest.json',
  './fondo.jpg', './pergamino.png', './cabecera.png', './mapa.jpg',
  './icon-192.png', './icon-512.png',
  './cinzel.ttf', './cinzel-sb.ttf', './libre.ttf', './libre-bold.ttf',
  './cormorant.ttf', './kaushan.ttf', './caveat.ttf'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  var url = new URL(req.url);

  // --- API del "cerebro" (Apps Script) ---
  if (url.hostname.indexOf('script.google.com') !== -1) {
    if (req.method === 'GET') {
      e.respondWith(
        fetch(req).then(function (res) {
          var copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
          return res;
        }).catch(function () { return caches.match(req); })
      );
    }
    // Escrituras: pasan directo; si fallan sin señal, la app las encola.
    return;
  }

  // --- Mismo origen (GitHub Pages) ---
  if (url.origin === location.origin) {
    var esHTML = (req.mode === 'navigate') || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
    if (esHTML) {
      // HTML: red primero (siempre lo último), caché de respaldo sin señal.
      e.respondWith(
        fetch(req).then(function (res) {
          var copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
          return res;
        }).catch(function () {
          return caches.match(req).then(function (c) { return c || caches.match('./index.html'); });
        })
      );
    } else {
      // Recursos (fuentes, imágenes): caché primero (rápido y offline).
      e.respondWith(
        caches.match(req).then(function (c) {
          return c || fetch(req).then(function (res) {
            var copia = res.clone();
            caches.open(CACHE).then(function (cc) { cc.put(req, copia); });
            return res;
          });
        })
      );
    }
  }
});
