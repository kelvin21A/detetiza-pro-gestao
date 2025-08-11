const APP_VERSION = '1.0.0'; // Deve ser atualizado a cada nova versão
const CACHE_NAME = `detetiza-pro-gestao-v${APP_VERSION}`;
const CACHE_EXPIRY_DAYS = 7; // Cache data for 7 days
const API_CACHE_NAME = `api-cache-v${APP_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

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
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  // CSS e JS principais serão adicionados automaticamente pelo processo de build
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
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests with network-first strategy
  if (API_ENDPOINTS_TO_CACHE.some(endpoint => event.request.url.includes(endpoint))) {
    event.respondWith(networkFirstWithCache(event.request));
    return;
  }

  // For all other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache valid responses for future use
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  // Add timestamp header for cache expiry
                  const headers = new Headers(responseToCache.headers);
                  headers.append('sw-cache-timestamp', Date.now().toString());
                  
                  // Create new response with timestamp
                  const timestampedResponse = new Response(responseToCache.body, {
                    status: responseToCache.status,
                    statusText: responseToCache.statusText,
                    headers: headers
                  });
                  
                  cache.put(event.request, timestampedResponse);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('Fetch failed:', error);
            // For navigation requests, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            // For image requests, return a placeholder
            if (event.request.destination === 'image') {
              return caches.match('/placeholder.svg');
            }
            // For other resources, just fail
            return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
          });
      })
  );
});

// Network-first strategy with cache fallback for API requests
async function networkFirstWithCache(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      // Clone response to cache it
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(API_CACHE_NAME);
      
      // Add timestamp header for cache expiry
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cache-timestamp', Date.now().toString());
      
      // Create new response with timestamp
      const timestampedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, timestampedResponse);
      return networkResponse;
    }
    throw new Error('Network response not valid');
  } catch (error) {
    console.log('Network request failed, falling back to cache', error);
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // If nothing in cache, return offline JSON for API
    return new Response(JSON.stringify({ error: 'Você está offline. Os dados não estão disponíveis.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
// O código abaixo foi substituído pela implementação acima
/* self.addEventListener('fetch', (event) => {
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
