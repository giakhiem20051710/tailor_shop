// Service Worker for PWA
const CACHE_NAME = "my-hien-tailor-v1";
const urlsToCache = [
  "/",
  "/customer-home",
  "/products",
  "/fabrics",
  "/customer/dashboard",
  "/offline.html",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          // If both fail, return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html");
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-orders") {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Sync pending orders when online
  // Implementation depends on your backend
}

