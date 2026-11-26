/* Keeps the app working offline once it has been opened. Bump VERSION when files change. */
const VERSION = 'senso-v4';
const FILES = ['./', 'index.html', 'css/app.css', 'js/core.js', 'js/seed.js', 'js/i18n.js', 'js/art.js', 'js/files.js', 'js/app.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/vazirmatn-arabic.woff2', 'fonts/vazirmatn-latin.woff2', 'fonts/lalezar-arabic.woff2', 'fonts/lalezar-latin.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) caches.open(VERSION).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});
