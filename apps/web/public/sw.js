// apps/web/public/sw.js
const CACHE_NAME = 'workpulse-v2' // Bumped version to force an update
const OFFLINE_URL = '/offline'

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return
  
  // Do not intercept API calls or Supabase requests
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('supabase.co')
  ) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful page loads and static assets
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // If network fails, try the cache, then fallback to offline page
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        })
      })
  )
})