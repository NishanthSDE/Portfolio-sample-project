const CACHE_NAME = 'jeevananthan-offline-v2';
const OFFLINE_URL = 'offline.html';

// Install event - Cache the offline page
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([OFFLINE_URL]);
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
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Intercept requests and serve offline page if network fails
self.addEventListener('fetch', (event) => {
    // Only handle navigation requests (page loads)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(OFFLINE_URL);
                return cachedResponse || new Response('Offline and no fallback available.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
        );
    } else {
        // For other assets (images, scripts), try network first
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cachedResponse = await caches.match(event.request);
                // Return cached asset or a simple 404 if offline and not in cache
                return cachedResponse || new Response(null, { status: 404 });
            })
        );
    }
});
