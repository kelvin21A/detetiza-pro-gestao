// Nomes de cache com timestamp para forçar atualizações
const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `detetizapro-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `detetizapro-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `detetizapro-dynamic-${CACHE_VERSION}`;

// Apenas arquivos estáticos essenciais para o funcionamento offline
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico'
];

// Assets que NUNCA devem ser cacheados
const EXCLUDE_FROM_CACHE = [
  '/index.html',
  '/src/',
  '/node_modules/',
  '/api/'
];

// Tipos de requisição que devem usar a estratégia 'Network First'
const NETWORK_FIRST_FOR = [
  'document',
  'script', 
  'style',
  'manifest'
];

// Tipos de requisição que devem usar a estratégia 'Cache First'
const CACHE_FIRST_FOR = [
  'font',
  'image',
  'media'
];

// URLs da API Supabase que devem ser cacheadas
const API_CACHE_PATTERNS = [
  /https:\/\/.*\.supabase\.co\/rest\/v1\//,
  /https:\/\/.*\.supabase\.co\/auth\/v1\//
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }
  
  // Ignora requisições POST, PUT, DELETE, etc.
  if (request.method !== 'GET') {
    return;
  }

  // Verifica se a URL deve ser excluída do cache
  const shouldExcludeFromCache = EXCLUDE_FROM_CACHE.some(pattern => {
    if (typeof pattern === 'string') {
      return url.pathname.startsWith(pattern);
    }
    return pattern.test(url.pathname);
  });

  // Se for um arquivo que não deve ser cacheados, busca apenas da rede
  if (shouldExcludeFromCache) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Estratégia Network First para HTML, CSS, JS e manifest
  if (NETWORK_FIRST_FOR.includes(request.destination)) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Atualiza o cache com a nova resposta
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Se a rede falhar, tenta buscar do cache
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || new Response('Sem conexão e sem cache disponível', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
    return;
  }
  
  // Estratégia Cache First para fontes, imagens e mídia
  if (CACHE_FIRST_FOR.includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        // Retorna do cache se disponível
        if (cachedResponse) {
          // Atualiza o cache em segundo plano
          fetch(request).then(response => {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
          });
          return cachedResponse;
        }
        
        // Se não estiver no cache, busca da rede
        return fetch(request).then(response => {
          // Não armazena respostas de erro no cache
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Armazena a resposta no cache
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(request, responseToCache));
            
          return response;
        });
      })
    );
    return;
  }
  
  // Para qualquer outro tipo de requisição, tenta buscar da rede primeiro
  event.respondWith(
    fetch(request)
      .then(response => {
        // Se for uma resposta válida, armazena no cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tenta buscar do cache
        return caches.match(request);
      })
  );

  // Estratégia para arquivos estáticos (Cache First)
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
              return response;
            });
        })
    );
    return;
  }

  // Estratégia para APIs Supabase (Network First com fallback para cache)
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se a requisição foi bem-sucedida, cache a resposta
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Se falhou (offline), tenta buscar no cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                // Adiciona header para indicar que veio do cache
                const headers = new Headers(cachedResponse.headers);
                headers.set('X-From-Cache', 'true');
                
                return new Response(cachedResponse.body, {
                  status: cachedResponse.status,
                  statusText: cachedResponse.statusText,
                  headers: headers
                });
              }
              
              // Se não tem no cache, retorna resposta offline
              return new Response(
                JSON.stringify({
                  error: 'Offline',
                  message: 'Você está offline. Alguns dados podem não estar atualizados.'
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Estratégia padrão para outras requisições (Network First)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache apenas respostas bem-sucedidas
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cachedResponse) => {
            return cachedResponse || new Response(
              'Você está offline',
              { status: 503, headers: { 'Content-Type': 'text/plain' } }
            );
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-supabase-data') {
    event.waitUntil(syncSupabaseData());
  }
});

// Função para sincronizar dados com Supabase quando voltar online
async function syncSupabaseData() {
  try {
    console.log('[SW] Syncing data with Supabase...');
    
    // Buscar dados pendentes no IndexedDB ou localStorage
    const pendingData = await getPendingData();
    
    if (pendingData && pendingData.length > 0) {
      // Enviar dados pendentes para Supabase
      for (const data of pendingData) {
        await syncDataToSupabase(data);
      }
      
      // Limpar dados pendentes após sincronização
      await clearPendingData();
      
      console.log('[SW] Data sync completed successfully');
    }
  } catch (error) {
    console.error('[SW] Error syncing data:', error);
  }
}

// Função auxiliar para buscar dados pendentes
async function getPendingData() {
  // Implementar lógica para buscar dados pendentes
  // Por exemplo, do IndexedDB ou localStorage
  return [];
}

// Função auxiliar para sincronizar dados com Supabase
async function syncDataToSupabase(data) {
  // Implementar lógica para enviar dados para Supabase
  console.log('[SW] Syncing data item:', data);
}

// Função auxiliar para limpar dados pendentes
async function clearPendingData() {
  // Implementar lógica para limpar dados pendentes após sincronização
  console.log('[SW] Clearing pending data');
}

// Notificar clientes sobre atualizações
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Detectar quando o usuário volta online
self.addEventListener('online', () => {
  console.log('[SW] User is back online');
  // Trigger sync
  self.registration.sync.register('sync-supabase-data');
});

console.log('[SW] Service Worker loaded successfully');
