// Apenas um service worker básico para registro
self.addEventListener('fetch', function(event) {
  // Isso não faz nada, apenas para satisfazer o requisito mínimo do PWA
});

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado.');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado.');
});