const VERSION = "1.2.1"; // tăng khi đổi danh sách precache hoặc chiến lược cache
const CACHE_NAME = `zve10-pwa-${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/colors",
  "/search",
  "/wiki",
  "/blog",
  "/blog/kien-thuc",
  "/manifest.webmanifest",
  "/dat/zve10-base-pal.dat",
  "/dat/zve10-base-ntsc.dat",
  "/dat/zve10-pal-m1.dat",
  "/dat/zve10-pal-m2.dat",
  "/dat/zve10-pal-m3.dat",
  "/dat/zve10-pal-m4.dat",
  "/dat/zve10-ntsc-m1.dat",
  "/dat/zve10-ntsc-m2.dat",
  "/dat/zve10-ntsc-m3.dat",
  "/dat/zve10-ntsc-m4.dat",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/apple-icon.png",
  "/fonts/noto-sans-latin.woff2",
  "/fonts/noto-sans-vietnamese.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n !== CACHE_NAME)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from this origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Trang và dữ liệu quản trị (/admin/decode/data) không lưu vào cache, để người khác dùng chung máy không đọc được offline
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return;

  // Navigations (HTML): network-first, cache successful responses, fallback to cached copy or /
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp.ok) {
            const copy = resp.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(url.pathname, copy)));
          }
          return resp;
        })
        .catch(() => caches.match(url.pathname))
        .then((resp) => resp || caches.match("/"))
    );
    return;
  }

  // Static assets, DAT files, images, fonts: cache-first then network and update
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/dat/") ||
    url.pathname.startsWith("/img/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((cached) => {
          const fetched = fetch(request)
            .then((resp) => {
              if (resp.ok) {
                caches.open(CACHE_NAME).then((c) => c.put(request, resp.clone()));
              }
              return resp;
            })
            .catch(() => cached);
          return cached || fetched;
        })
    );
    return;
  }

  // Everything else: network, fallback to cache
  event.respondWith(
    fetch(request)
      .then((resp) => {
        if (resp.ok) {
          caches.open(CACHE_NAME).then((c) => c.put(request, resp.clone()));
        }
        return resp;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "cache-urls") {
    const urls = event.data.urls.filter(
      (u) =>
        new URL(u, self.location.origin).origin === self.location.origin
    );
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) => Promise.all(urls.map((u) => cache.add(u).catch(() => {}))))
    );
  }
});
