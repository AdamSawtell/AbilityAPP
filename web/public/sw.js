/* AbilityVua employee mobile PWA — minimal shell cache (Phase A). */
const CACHE = "abilityvua-mobile-v1";
const SHELL = ["/m/today", "/m/schedule", "/m/timesheets", "/m/tasks", "/m/more", "/manifest.webmanifest"];

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
  if (!url.pathname.startsWith("/m")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/m/today")))
  );
});

/* Push handler — subscription wired in Phase C */
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
