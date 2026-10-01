// Network-first so new lessons show up as soon as you're online; cache is the offline fallback.
const CACHE = "learning-hub-v3";
const SHELL = [
  "./", "index.html", "styles.css", "app.js", "topics.json", "manifest.webmanifest", "icons/icon.svg",
  "fonts/bricolage-latin.woff2", "fonts/newsreader-latin.woff2", "fonts/newsreader-italic-latin.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
