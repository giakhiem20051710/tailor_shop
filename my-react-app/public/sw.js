// Service Worker for PWA
const CACHE_NAME = "my-hien-tailor-v2"; // Updated version to clear old cache
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
  // Ignore non-GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Bỏ qua Vite HMR WebSocket và dev server requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return; // Let WebSocket connections pass through
  }

  // Bỏ qua Vite client requests (HMR)
  if (url.pathname.includes('/@vite/') || url.pathname.includes('/@react-refresh')) {
    return; // Let Vite HMR requests pass through
  }

  // Bỏ qua các request đến placeholder services và external images
  if (url.hostname.includes('via.placeholder.com') ||
    url.hostname.includes('placeholder.com')) {
    // Không xử lý placeholder requests - để browser tự xử lý
    return;
  }

  // Bỏ qua data URI và blob URL
  if (event.request.url.startsWith('data:') || event.request.url.startsWith('blob:')) {
    return;
  }

  // KHÔNG cache API requests - luôn fetch từ network
  if (url.pathname.startsWith('/api/') || url.hostname.includes('localhost:8083')) {
    // API requests: network only, không cache
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response("Network error", { status: 408 });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }

      return fetch(event.request).then((networkResponse) => {
        // Chỉ cache successful responses cho static assets (HTML, CSS, JS, images)
        // KHÔNG cache API responses
        if (networkResponse && networkResponse.status === 200 && 
            !url.pathname.startsWith('/api/') && 
            !url.hostname.includes('localhost:8083')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If both fail, return offline page for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/offline.html");
        }
        // For other requests, return a simple error response
        return new Response("Network error", { status: 408 });
      });
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

