// Service Worker for caching static assets
const CACHE_NAME = 'inventory-app-v1.0.0'; // Versionado
const STATIC_CACHE = 'inventory-static-v1.0.0';
const API_CACHE = 'inventory-api-v1.0.0';

// Solo cachear assets críticos
const STATIC_ASSETS = [
  '/favicon.ico',
  '/logo-lagranfamilia.png',
  // NO cachear CSS/JS - dejar que el navegador los maneje
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Función helper para determinar si es data sensible
  const isSensitiveData = (request) => {
    // No cachear requests de autenticación, usuarios, o datos personales
    return request.url.includes('/auth/') ||
           request.url.includes('/users') ||
           request.url.includes('/profiles');
  };

  // Estrategia: Network First para APIs (siempre datos frescos)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          // Solo cachear GET exitosos y no sensibles
          if (request.method === 'GET' && response.status === 200 && !isSensitiveData(request)) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request);
        })
    );
    return;
  }

  // Estrategia: Cache First para assets estáticos
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((res) => {
          // Cache the response
          const responseClone = res.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return res;
        });
      })
    );
    return;
  }

  // Default fetch for other requests (CSS, JS, etc.)
  event.respondWith(fetch(request));
});