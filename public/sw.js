const CACHE_NAME = 'inwentaryzacja-v1';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching core assets');
      // Using cache.addAll with a map/catch to ensure failure of one optional file doesn't break installation
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`SW: Failed to cache static asset: ${url}`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Clearing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network First, fallback to cache)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Avoid caching browser extensions or hot reload connections (ws://)
  if (url.protocol.startsWith('ws') || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle local assets and API routing separately if needed, but prioritize caching for app shell
  if (url.origin === self.location.origin) {
    // For API calls, let them always go to the network
    if (url.pathname.startsWith('/api/')) {
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If response is valid, clone and save to cache
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try to serve from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If the request is a navigation request (page refresh/navigation), serve index.html
            if (event.request.mode === 'navigate') {
              return caches.match('index.html');
            }
          });
        })
    );
  }
});
