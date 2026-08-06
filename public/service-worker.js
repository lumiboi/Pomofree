const IS_LOCALHOST = ['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname);
const CACHE = 'pomofree-shell-v4';
const SHELL = ['/', '/index.html', '/manifest.json', '/logo192.png', '/logo512.png'];

self.addEventListener('install', event => {
  if (!IS_LOCALHOST) {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  }
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => IS_LOCALHOST ? self.registration.unregister() : self.clients.claim())
      .then(() => IS_LOCALHOST ? self.clients.matchAll() : [])
      .then(clients => Promise.all(clients.map(client => client.navigate(client.url))))
  );
});

self.addEventListener('fetch', event => {
  if (IS_LOCALHOST) return;

  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'SHOW_NOTIFICATION') return;
  event.waitUntil(self.registration.showNotification(event.data.title || 'Pomofree', {
    body: event.data.body || '',
    icon: '/logo192.png'
  }));
});
