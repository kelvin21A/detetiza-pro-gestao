const CACHE_NAME = 'detetiza-pro-gestao-v1';
const CACHE_EXPIRY_DAYS = 7; // Cache data for 7 days
const API_CACHE_NAME = 'api-cache-v1';

const API_ENDPOINTS_TO_CACHE = [
  '/api/service-calls',
  '/api/clients',
  '/api/teams'
];

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        }).filter(Boolean)
      );
    })
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and non-http(s) requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (API_ENDPOINTS_TO_CACHE.some(endpoint => url.pathname.startsWith(endpoint))) {
    event.respondWith(
      fetchAndCache(request).catch(() => {
        return caches.match(request).then(response => {
          return response || new Response(JSON.stringify({ error: 'No internet connection and no cache available' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }

  // For static assets, use cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetchAndCache(request);
      })
    );
    return;
  }

  // For all other requests, try network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // If the response is good, clone it and store it in the cache
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to get it from the cache
        return caches.match(request);
      })
  );
});

// Helper function to fetch and cache API responses
async function fetchAndCache(request) {
  const cache = await caches.open(API_CACHE_NAME);
  try {
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response.status === 200) {
      // Clone the response because it can only be consumed once
      const responseToCache = response.clone();
      
      // Add a timestamp to the cached response
      const cachedResponse = new Response(responseToCache.body, responseToCache);
      cachedResponse.headers.append('sw-cache-timestamp', Date.now().toString());
      
      // Store the response in the cache
      await cache.put(request, cachedResponse);
      
      // Clean up old cache entries
      await cleanupOldCacheEntries(cache);
    }
    
    return response;
  } catch (error) {
    // If fetch fails, try to get it from the cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Clean up old cache entries
async function cleanupOldCacheEntries(cache) {
  const cacheKeys = await cache.keys();
  const now = Date.now();
  const cacheExpiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  
  for (const request of cacheKeys) {
    const response = await cache.match(request);
    if (!response) continue;
    
    const cacheTimestamp = response.headers.get('sw-cache-timestamp');
    if (!cacheTimestamp) continue;
    
    const cacheAge = now - parseInt(cacheTimestamp, 10);
    if (cacheAge > cacheExpiryMs) {
      await cache.delete(request);
    }
  }
}

// Handle background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-service-calls') {
    console.log('Background sync for service calls');
    // Implement background sync logic here if needed
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  const title = data?.title || 'Detetiza Pro Gestão';
  const options = {
    body: data?.body || 'Você tem uma nova notificação',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: data?.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle the notification click
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        const urlToOpen = new URL('/', self.location.origin).href;
        
        // Check if there's already a window/tab open with the app
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
