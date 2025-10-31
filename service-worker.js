const CACHE_NAME = 'manutencao-pop-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/android-icon-192x192.png',
  '/android-icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js',
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

// Estratégia: Cache First, depois Network
self.addEventListener('fetch', function(event) {
  // Ignorar requisições para o Google Apps Script
  if (event.request.url.includes('script.google.com') || 
      event.request.url.includes('script.googleusercontent.com')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Retorna do cache se encontrado
        if (response) {
          return response;
        }

        // Clona a requisição
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Verifica se a resposta é válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                // Não cachear requisições para APIs externas
                if (!event.request.url.includes('googleapis.com') &&
                    !event.request.url.includes('gstatic.com') &&
                    !event.request.url.includes('bootstrap') &&
                    !event.request.url.includes('fontawesome')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(function() {
          // Fallback para página offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          // Fallback para ícones
          if (event.request.destination === 'image') {
            return caches.match('/android-icon-192x192.png');
          }
        });
      }
    )
  );
});

// Mensagens do Service Worker
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronização em background
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('Sincronização em background iniciada');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Aqui você pode implementar sincronização de dados offline
  console.log('Executando sincronização em background...');
}
