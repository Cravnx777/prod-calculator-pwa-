const cacheName = 'prod-calculator-cache-v2';
const cacheAssets = [
    'index.html',
    'css/tailwind.min.css',
    'css/font-awesome.min.css',
    'js/jquery.min.js',
    'js/chart.js',
    'js/i18next.min.js',
    'js/i18nextBrowserLanguageDetector.min.js',
    'js/i18nextHTTPBackend.min.js',
    'js/FileSaver.min.js',
    'fonts/roboto-regular.woff2', // Pastikan font Roboto diunduh dan diletakkan secara lokal
    'fonts/roboto-regular.woff',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap', //Tambahkan fonts API
    'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css' // Tambahkan CSS toastr dari CDN
];

// Call Install Event
self.addEventListener('install', e => {
    console.log('Service Worker: Installed');

    e.waitUntil(
        caches.open(cacheName)
            .then(cache => {
                console.log('Service Worker: Caching Files');
                return cache.addAll(cacheAssets);
            })
            .then(() => self.skipWaiting())
    );
});

// Call Activate Event
self.addEventListener('activate', e => {
    console.log('Service Worker: Activated');
    // Remove unwanted caches
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== cacheName) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Call Fetch Event
self.addEventListener('fetch', e => {
    console.log('Service Worker: Fetching', e.request.url);
    e.respondWith(
        caches.match(e.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    console.log('Service Worker: Found in cache', e.request.url);
                    return response;
                }

                // Not in cache - return fetch request
                console.log('Service Worker: Not in cache, fetching from network', e.request.url);
                return fetch(e.request).catch(() => {
                    // Jika permintaan adalah untuk dokumen HTML, tampilkan halaman offline khusus
                    if (e.request.mode === 'navigate' && e.request.destination === 'document') {
                        return caches.match('offline.html'); // Buat halaman 'offline.html' khusus
                    }
                });
            })
    );
});
