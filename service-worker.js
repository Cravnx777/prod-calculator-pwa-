// service-worker.js
const CACHE_NAME = 'prod-calculator-cache-v2'; // Tingkatkan versi cache setiap kali Anda mengubah SW
const urlsToCache = [
  '/', // Cache index.html
  //'index.html', // Sudah termasuk di '/'

  // Stylesheets
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',

  // JavaScript files
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/i18next/21.8.14/i18next.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/i18next-browser-languagedetector/7.1.0/i18nextBrowserLanguageDetector.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/i18next-http-backend/2.2.1/i18nextHTTPBackend.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',

  // Google Fonts (Cache the stylesheet - adapt URL if needed)
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' // Sesuaikan URL jika perlu
];

// Install Event
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache', error);
      })
  );
  self.skipWaiting(); // Aktifkan SW baru segera
});

// Activate Event
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Kendalikan semua klien segera
});

// Fetch Event
self.addEventListener('fetch', event => {
  // Tangani permintaan Google Fonts secara terpisah (CORS)
  if (event.request.url.startsWith('https://fonts.googleapis.com') ||
      event.request.url.startsWith('https://fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          // Periksa apakah response valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone respons karena response stream hanya dapat dibaca sekali
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
    );
  } else {
    // Tangani permintaan lainnya
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - kembalikan response dari cache
          if (response) {
            return response;
          }

          // Jika tidak ada di cache, fetch dari jaringan
          return fetch(event.request).catch(function() {
            // Jika gagal fetch dari jaringan, mungkin offline
            console.log('Service Worker: Network request failed. Serving offline page');

            // PERIKSA:  Sesuaikan path ke halaman offline Anda jika berbeda
            return caches.match('/offline.html'); // Coba tampilkan halaman offline
          });
        })
    );
  }
});
