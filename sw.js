// FOOax Service Worker v1.1
// Permite que la app funcione sin internet
const CACHE_NAME = 'fooax-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
];
// Instalación — guarda los archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('FOOax SW: Error en caché inicial', err);
      });
    })
  );
  self.skipWaiting();
});
// Activación — limpia cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});
// Fetch — sirve desde caché cuando no hay internet
self.addEventListener('fetch', event => {
  // Solo manejar requests GET
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Guardar en caché si es una respuesta válida
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Sin internet — devolver la app principal
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
    body: data.body || '¡Hora de registrar tus números de hoy!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'fooax-recordatorio',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
// Click en notificación — abre la app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('fooax') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
