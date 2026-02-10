
const VERSION = 'v13';
const CACHE_NAME = `savr-shell-${VERSION}`;
const LIBS_CACHE = `savr-libs-${VERSION}`;

// Essential files for the app to boot the JS engine and render the shell
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

// Install event - Cache static shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll is atomic - if any file fails, the SW won't install, preventing partial shells
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event - Clean up old caches to prevent version conflicts
self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(VERSION)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - The engine for offline functionality
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Filter: Skip non-GET and Firestore/Auth sync traffic (handled by Firebase SDK internally)
  if (
    request.method !== 'GET' || 
    url.hostname.includes('firebaseio.com') ||
    (url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts')) ||
    url.pathname.includes('/__/auth')
  ) {
    return;
  }

  // 2. Navigation Strategy: Network-First with Cache-Fallback
  // This is what allows the app to open the shell even if the device is offline at launch
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 3. Asset Strategy: Stale-While-Revalidate
  // Return from cache immediately for speed, but update the cache in the background.
  // This automatically captures all imported .tsx/.ts files during the first online run.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Only cache successful standard responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          
          // Separate libraries (rarely change) from app code
          const isLib = ['esm.sh', 'www.gstatic.com', 'cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].some(h => url.hostname.includes(h));
          const targetCache = isLib ? LIBS_CACHE : CACHE_NAME;
          
          caches.open(targetCache).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If network fails and it's not in cache, we just fail gracefully
        return null;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for SKIP_WAITING to allow immediate app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
