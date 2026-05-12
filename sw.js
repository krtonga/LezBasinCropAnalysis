// sw.js: service worker for the Lez viewer (spec §4 Step 5).
//
// Strategy: runtime caching, no precache list.
// Every same-origin GET on first network success goes into the cache; future
// requests are served cache-first with a background refresh. This means:
//   - There is no PRECACHE_URLS list to keep in sync; adding a content/JS
//     file requires no change to this worker.
//   - First-visit-while-online populates the cache for every page the user
//     opens; offline access works on the second visit to that page.
//   - To force-update a release, bump CACHE_VERSION below; old caches are
//     dropped on activate.
//
// Lives at the viewer/ root (not src/) so its scope covers the entire site.

const CACHE_VERSION = "lez-viewer-2026-05-11-v22";

self.addEventListener("install", (event) => {
  // No precaching; go active immediately. The first navigation to any
  // page will populate the cache for that page's resources.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Range requests (used by the COG protocol for byte-range tile fetches)
  // return 206 Partial Content, which Cache.put() rejects. Let the browser
  // handle them directly; they don't benefit from full-response caching.
  if (req.headers.has("range")) return;

  const url = new URL(req.url);

  // Only handle same-origin requests; let the browser handle CDN scripts.
  if (url.origin !== self.location.origin) return;

  event.respondWith(cacheFirstWithRefresh(req));
});

async function cacheFirstWithRefresh(req) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req, { ignoreSearch: true });

  // Background refresh: don't block the response on the network update.
  // Skip 206 (Cache.put rejects partial responses) and swallow any put
  // errors so a cache hiccup never breaks the response chain.
  const refresh = fetch(req).then((res) => {
    if (res && res.ok && res.status !== 206) {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  }).catch(() => null);

  if (cached) return cached;

  // Cache miss → wait for the network. If both fail, fall back to the
  // story shell so the user sees something rather than a browser error.
  const fresh = await refresh;
  if (fresh) return fresh;
  const shell = await cache.match("index.html");
  if (shell) return shell;
  return Response.error();
}
