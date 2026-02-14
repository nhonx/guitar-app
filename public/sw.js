const CACHE_NAME = 'pocket-guitar-v2'; // Bump version to force update
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './events.js',
  './ui-config.js',
  './audio-engine.js',
  './manifest.json'
  // Add your icons here if created:
  // './icon-192.png',
  // './icon-512.png'
];

// 1. Install: Cache everything
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force this SW to become active immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activate: Clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim(); // Take control of all pages immediately
});

// 3. Fetch: The Safari Fix
self.addEventListener('fetch', (e) => {
  e.respondWith(
    (async () => {
      const req = e.request;

      // SAFARI FIX: 
      // If it's a navigation request (opening the app), always serve index.html.
      // This prevents the "Response served by service worker has redirections" error
      // which happens if the server redirects '/' to '/index.html'.
      if (req.mode === 'navigate') {
        const cachedIndex = await caches.match('./index.html');
        if (cachedIndex) return cachedIndex;
      }

      // Standard Cache-First Strategy for everything else
      const cachedResponse = await caches.match(req);
      if (cachedResponse) return cachedResponse;

      // Fallback to Network
      return fetch(req);
    })()
  );
});