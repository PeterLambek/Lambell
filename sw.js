/* Lambell service worker — v19 */
const CACHE = 'lambell-v35';
const SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './hero.png', './profile-hero-m.jpg', './profile-hero-f.jpg', './profile-hero-animal.jpg', './profile-hero-blank.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first for own GET requests (fresh when online, cached when offline).
   Non-GET (e.g. HEAD probes for videos) pass straight through.
   Videos are not cached — they'd bloat storage. */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  const isVideo = url.pathname.endsWith('.mp4');
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (!isVideo) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then(m => m || caches.match('./index.html')))
  );
});
