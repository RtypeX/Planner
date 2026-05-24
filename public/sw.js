// Dylan's HQ — minimal offline-first service worker.
//
// Strategy:
//   - HTML / navigation: network-first, fall back to cached / index.html.
//     Keeps you online-fresh, but loads the last good shell when offline.
//   - Static assets (JS/CSS/images/fonts): stale-while-revalidate. Instant
//     render from cache, refresh in the background.
//   - Cross-origin (Gemini, UPS proxy, fonts.googleapis): always network,
//     never cached. We don't want to serve stale API responses.

const CACHE_VERSION = 'hq-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Cross-origin: don't intercept — let the browser handle it normally.
  if (url.origin !== location.origin) return

  // Navigations: network-first, cache fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put(request, clone)).catch(() => {})
          return res
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached || (await caches.match('/index.html')) || new Response('Offline', { status: 503 })
        }),
    )
    return
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          // Don't cache non-OK or opaque responses.
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(request, clone)).catch(() => {})
          }
          return res
        })
        .catch(() => cached)
      return cached || fetchPromise
    }),
  )
})
