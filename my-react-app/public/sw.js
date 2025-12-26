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
  const url = new URL(event.request.url);
  
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
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }
      
      return fetch(event.request).then((networkResponse) => {
        // Chỉ cache successful responses
        if (networkResponse && networkResponse.status === 200) {
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

