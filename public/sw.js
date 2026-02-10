const CACHE_NAME = 'savr-v4';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
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
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the new SW takes control immediately
  self.clients.claim();
});

// Fetch event - Proxy requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  // 2. DO NOT cache Firebase/Firestore calls (googleapis.com, firebaseio.com, identitytoolkit)
  if (
    request.method !== 'GET' || 
    url.hostname.includes('googleapis.com') || 
    url.hostname.includes('firebase')
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      // Return cached response if found, otherwise fetch from network
      return response || fetch(request).then((fetchResponse) => {
        // Optionally cache new static assets on the fly (not used here to keep it minimal)
        return fetchResponse;
      }).catch(() => {
        // Fallback for offline mode if asset is not in cache
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Listen for the SKIP_WAITING message from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});