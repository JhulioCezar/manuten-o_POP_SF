const CACHE_NAME = 'manutencao-pop-v2.0.1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './android-icon-192x192.png',
  './android-icon-512x512.png',
  './apple-touch-icon.png',
  './favicon.ico',
  './favicon-96x96.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://i.imgur.com/SEr4lkm.png'
];

// Instalação do Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Todos os recursos cacheados');
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker ativado');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Estratégia: Network First para HTML, Cache First para recursos
self.addEventListener('fetch', function(event) {
  // Para a página principal, tenta network primeiro
  if (event.request.url === self.location.origin + '/' || 
      event.request.url === self.location.origin + '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualiza o cache com a nova versão
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Fallback para cache se offline
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Para outros recursos, cache first
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(function(fetchResponse) {
            // Cache apenas se for sucesso e não for API externa
            if (fetchResponse && fetchResponse.status === 200 && 
                !event.request.url.includes('script.google.com')) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });
            }
            return fetchResponse;
          })
          .catch(function() {
            // Fallback para ícones se offline
            if (event.request.destination === 'image') {
              return caches.match('./android-icon-192x192.png');
            }
          });
      })
  );
});
