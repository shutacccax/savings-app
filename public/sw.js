
const CACHE_NAME = 'savr-v10';
const LIBS_CACHE = 'savr-libs-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon-32.png'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== LIBS_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and Firestore/Auth sync endpoints
  if (
    request.method !== 'GET' || 
    url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts') || 
    url.hostname.includes('firebaseio.com')
  ) {
    return;
  }

  // Navigation requests - always serve index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Caching strategy for libraries and assets
  const isLib = ['esm.sh', 'www.gstatic.com', 'cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].some(h => url.hostname.includes(h));
  const cacheToUse = isLib ? LIBS_CACHE : CACHE_NAME;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(cacheToUse).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for SKIP_WAITING
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
