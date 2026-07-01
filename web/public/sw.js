/* AbilityVua My Workplace mobile PWA — shell assets only (do not cache HTML — iOS keeps it too long). */
const CACHE = "abilityvua-mobile-v4";
const SHELL = ["/manifest.webmanifest", "/icons/icon-192.svg"];

function isCacheableAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname === "/manifest.webmanifest") return true;
  if (url.pathname.startsWith("/icons/")) return true;
  return SHELL.includes(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => undefined)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* Never cache navigations or RSC/HTML — fixes stale iPhone home-screen UI after deploy. */
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    return;
  }
  if (url.pathname.startsWith("/api/")) return;

  if (!isCacheableAsset(url) && !url.pathname.startsWith("/m")) return;

  if (!isCacheableAsset(url)) {
    /* /m/* non-asset requests: network only. */
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});

/* Push handler — subscription via /api/mobile/push/subscribe */
self.addEventListener("push", (event) => {
  const data = event.data?.json?.() ?? { title: "AbilityVua", body: "You have an update." };
  event.waitUntil(
    self.registration.showNotification(data.title ?? "AbilityVua", {
      body: data.body ?? "",
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/m/today";
  event.waitUntil(self.clients.openWindow(url));
});
