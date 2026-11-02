const CACHE_NAME = "startingxi-v85";
const APP_SHELL = [
  "./startelf_check.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-192-maskable.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png",
  "./fonts/anton-400.woff2",
  "./fonts/oswald-variable.woff2",
  "./vendor/supabase-js-2.118.0.umd.js",
  "./vendor/qrcode-generator-2.0.4.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Fremde Adressen (Supabase-API, Anmeldung) nie cachen und nie anfassen - sonst bekaeme man veraltete Konto-Antworten (Prompt K2b)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Rueckkehr von der Anmeldung (?code=...): normal laden, aber nicht in den Cache schreiben
  const authReturn = /[?&](code|error|error_description)=/.test(url.search);

  // HTML-/Navigations-Anfragen: network-first, damit eine neue Version sofort
  // ankommt, sobald online - ohne dass CACHE_NAME manuell hochgezaehlt werden
  // muss. Offline faellt das auf die zuletzt gecachte Version zurueck.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!authReturn) { const clone = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)); }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./startelf_check.html")))
    );
    return;
  }

  // Alles andere (Icons, Fonts, manifest.json - alles same-origin seit die
  // Schriften lokal eingebunden sind): cache-first, wie bisher.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
    )
  );
});
