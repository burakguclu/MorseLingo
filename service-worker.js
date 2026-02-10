// service-worker.js
// Temel PWA offline cache desteği

const CACHE_NAME = "morselingo-v7";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/main.js",
  "/config.js",
  "/ui.js",
  "/lesson.js",
  "/audio.js",
  "/tap-input.js",
  "/auth.js",
  "/store.js",
  "/firebase.js",
  "/firebaseConfig.js",
  "/toast.js",
  "/settings.js",
  "/data.json",
  "/css/1-main.css",
  "/css/2-auth.css",
  "/css/3-menu.css",
  "/css/4-exercise.css",
  "/css/5-tap-module.css",
  "/css/6-mobile.css",
  "/css/7-animations.css",
  "/css/8-leaderboard.css",
  "/sounds/correct.mp3",
  "/sounds/wrong.mp3",
  "/sounds/complete.mp3",
  "/sounds/failed.mp3",
];

// Install: Cache tüm statik dosyaları
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()),
  );
});

// Activate: Eski cache'leri temizle
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: Önce ağı dene, başarısız olursa cache'den al
self.addEventListener("fetch", (event) => {
  // Firebase API çağrılarını cache'leme
  if (
    event.request.url.includes("firebaseio.com") ||
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("gstatic.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Başarılı yanıtı cache'e de kaydet
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Ağ başarısız → Cache'den döndür
        return caches.match(event.request);
      }),
  );
});
