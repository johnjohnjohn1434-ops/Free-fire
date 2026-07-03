// Free Fire Fan Hub — Service Worker
// Cache-first for static shell, network-first for everything else (so Firestore data stays fresh).

const CACHE_NAME = "ff-hub-v1";
const APP_SHELL = [
  "index.html",
  "manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Never cache Firebase/Firestore/Auth calls — always go to network for live data.
  if (req.url.includes("firestore.googleapis.com") ||
      req.url.includes("identitytoolkit.googleapis.com") ||
      req.url.includes("firebaseapp.com") ||
      req.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("index.html")))
  );
});

