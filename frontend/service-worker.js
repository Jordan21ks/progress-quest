// Service Worker for Experience Points Progressive Web App

const CACHE_NAME = 'exp-points-cache-v2'; // Incremented version to force refresh
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/styles.css',
  '/auth.js',
  '/script.js',
  '/data.js',
  '/sounds.js',
  '/favicon.svg',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  // Activate the SW immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Force delete ALL caches to ensure fresh content
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      ).then(() => {
        console.log('All caches cleared, will rebuild with fresh content');
      });
    })
  );
  
  // Immediately claim all clients and control them
  event.waitUntil(self.clients.claim());
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests except for the backend API
  if (event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('fonts.googleapis.com') || 
      event.request.url.includes('fonts.gstatic.com') ||
      event.request.url.includes('experience-points-backend.onrender.com')) {
    
    // For API requests, use network-first with offline caching
    if (event.request.url.includes('/api/')) {
      // Special handling for GET requests to goals endpoint - these contain user progress data
      if (event.request.url.includes('/api/goals') && event.request.method === 'GET') {
        event.respondWith(
          fetch(event.request.clone())
            .then(response => {
              // Clone the response to store in cache
              const responseToCache = response.clone();
              
              // Store the successful response in cache for offline use
              caches.open('api-goals-cache')
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // If network fails, try to get from cache
              return caches.match(event.request)
                .then(cachedResponse => {
                  if (cachedResponse) {
                    // Return cached goals data
                    return cachedResponse;
                  }
                  
                  // If no cached data, return error
                  return new Response(JSON.stringify({ 
                    error: 'You are offline. Your progress data will be synchronized when you reconnect.'
                  }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503
                  });
                });
            })
        );
      } else {
        // For other API requests, use network first with basic fallback
        event.respondWith(
          fetch(event.request)
            .then(response => {
              return response;
            })
            .catch(() => {
              // Check if we have a cached version
              return caches.match(event.request)
                .then(cachedResponse => {
                  if (cachedResponse) {
                    return cachedResponse;
                  }
                  
                  // If no cached version, return error response
                  return new Response(JSON.stringify({ 
                    error: 'You are offline. Please reconnect to update data.'
                  }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503
                  });
                });
            })
        );
      }
    } else {
      // For static assets, use cache first strategy
      event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return fetch(event.request)
              .then(response => {
                // Cache the fetched response
                if (response.status === 200) {
                  const responseToCache = response.clone();
                  caches.open(CACHE_NAME)
                    .then(cache => {
                      cache.put(event.request, responseToCache);
                    });
                }
                return response;
              })
              .catch(error => {
                console.error('Fetch failed:', error);
                // For HTML requests when offline, show a custom offline page
                if (event.request.headers.get('Accept').includes('text/html')) {
                  return caches.match('/offline.html');
                }
                // For other requests, just fail
                throw error;
              });
          })
      );
    }
  }
});

// Handle push notifications (optional future enhancement)
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'favicon.svg',
    badge: 'favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
