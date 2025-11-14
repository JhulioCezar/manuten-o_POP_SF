// ===============================
//  SERVICE WORKER - VERSÃO FINAL
// ===============================

const VERSION = "v3.0.0";
const CACHE_NAME = "manutencao-pop-" + VERSION;

// Caminho base do seu GitHub Pages
const BASE = "/manuten-o_POP_SF/";

// Arquivos a serem cacheados
const urlsToCache = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "android-icon-192x192.png",
  BASE + "android-icon-512x512.png",
  BASE + "apple-touch-icon.png",
  BASE + "favicon.ico",
  BASE + "favicon-96x96.png",
  "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
  "https://i.imgur.com/SEr4lkm.png"
];

// ===============================
// INSTALL — instala o SW e já ativa a nova versão
// ===============================
self.addEventListener("install", event => {
  console.log("⬇️ Instalando nova versão do SW:", VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// ===============================
// ACTIVATE — remove caches antigos e ativa imediatamente
// ===============================
self.addEventListener("activate", event => {
  console.log("⚡ SW ativado:", VERSION);

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ Removendo cache antigo:", key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ===============================
// FETCH — Network first para index.html, cache-first para recursos
// ===============================
self.addEventListener("fetch", event => {

  const req = event.request;

  // Página principal -> Network first
  if (req.url === self.location.origin + BASE || req.url === self.location.origin + BASE + "index.html") {
    event.respondWith(
      fetch(req)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return response;
        })
        .catch(() => caches.match(BASE + "index.html"))
    );
    return;
  }

  // Outros arquivos -> Cache first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(response => {
          const clone = response.clone();
          if (response.status === 200 && req.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => {
          if (req.destination === "image") {
            return caches.match(BASE + "android-icon-192x192.png");
          }
        });
    })
  );
});

// ===============================
// UPDATE POPUP — permite que o site peça atualização
// ===============================
self.addEventListener("message", event => {
  if (event.data === "checkForUpdate") {
    console.log("🔄 Forçando atualização do SW…");
    self.skipWaiting();
  }
});
