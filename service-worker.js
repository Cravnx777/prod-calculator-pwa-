const CACHE_NAME = 'prod-calculator-cache-v3'; // Update version to force refresh
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    '/js/app.js',
    'https://code.jquery.com/jquery-3.6.0.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/i18next/21.8.14/i18next.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/i18next-browser-languagedetector/7.1.0/i18nextBrowserLanguageDetector.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/i18next-http-backend/2.2.1/i18nextHTTPBackend.min.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Installation complete.');
                return self.skipWaiting(); // Activate immediately
            })
            .catch(error => {
                console.error('Service Worker: Installation failed:', error);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache ', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete.');
            return self.clients.claim(); // Take control of all clients
        }).catch(error => {
            console.error("Service Worker: Activate failed:", error);
        })
    );
});

// Fetch Resources
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    // console.log('Service Worker: Found in cache ', event.request.url);
                    return response;
                }

                // Not in cache - fetch and cache
                console.log('Service Worker: Fetching from network ', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            console.log('Service Worker: Invalid response from network.');
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two independent copies.
                        var responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function (cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(err => {
                        console.error("Service Worker: Fetch failed:", err);
                        // Optionally return a fallback page for navigation requests
                        if (event.request.mode === 'navigate') {
                            console.log("Service Worker: Returning offline page");
                            return caches.match('/offline.html'); // Requires you to have an offline.html
                        }
                    });
            })
    );
});
