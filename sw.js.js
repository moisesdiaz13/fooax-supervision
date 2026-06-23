// FOOax Service Worker v2.0
// Red primero — siempre descarga la versión más nueva
const CACHE_NAME = 'fooax-sup-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
];

// Instalación
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('FOOax SW: Error en caché inicial', err);
      });
    })
  );
});

// Activación — limpia cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('FOOax SW: eliminando caché vieja', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — RED PRIMERO, caché como respaldo
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(response => {
      // Guardar respuesta fresca en caché
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // Sin internet — usar caché
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Notificaciones push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🌸 FOOax';
  const options = {
    body: data.body || '¡Supervisión pendiente!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'fooax-supervision',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Click en notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
