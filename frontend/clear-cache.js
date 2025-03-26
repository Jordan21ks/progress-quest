// Script to force clear caches and refresh the page content

// Immediately clear caches when this script loads
if ('caches' in window) {
  console.log('Clearing all caches to refresh content...');
  
  // First, try to unregister any existing service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('Service worker unregistered');
      }
    });
  }
  
  // Then clear all caches
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(() => {
    console.log('All caches cleared successfully');
    
    // Add small delay before reload to ensure caches are cleared
    setTimeout(() => {
      // Force hard refresh with cache bypass
      window.location.reload(true);
    }, 500);
  });
}
