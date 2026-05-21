const CACHE_NAME = 'jeevananthan-offline-v12';
const OFFLINE_URL = 'offline.html';

// Critical core assets to pre-cache on service worker install
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css?v=10',
    './sections/projects_v2.css?v=7',
    './script.js?v=10',
    './section-loader.js?v=7',
    './offline.html',
    './favicon.ico'
];

// Install event - Cache the offline page and core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS).catch(err => {
                console.warn('Failed to pre-cache some core assets during install:', err);
                // Fallback: at least cache the offline fallback URL
                return cache.addAll([OFFLINE_URL]);
            });
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

// Cache database connection helper
let cachePromise;
function getCache() {
    if (!cachePromise) {
        cachePromise = caches.open(CACHE_NAME);
    }
    return cachePromise;
}

// Fetch event - Intercept requests and serve offline page if network fails
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const isLocal = url.origin === self.location.origin;

    // Handle navigation requests (page loads)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cache = await getCache();
                const cachedResponse = await cache.match(OFFLINE_URL);
                return cachedResponse || new Response('Offline and no fallback available.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
        );
        return;
    }

    // 1. Cache-first strategy for Cyberfiction images (very fast 3D sequence rendering)
    if (url.pathname.includes('/CYBERFICTION-IMAGES/')) {
        event.respondWith(
            getCache().then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // 2. Stale-while-revalidate for local core assets (HTML sections, CSS, JS) to guarantee instant loads
    if (isLocal && (
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.html') ||
        url.pathname.includes('/sections/')
    )) {
        event.respondWith(
            getCache().then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => null); // Fail silently on network errors for background fetch
                    
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Default network-first strategy for other assets (CDNs, external scripts)
    event.respondWith(
        fetch(event.request).catch(async () => {
            const cachedResponse = await caches.match(event.request);
            return cachedResponse || new Response(null, { status: 404 });
        })
    );
});
