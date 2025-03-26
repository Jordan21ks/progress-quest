// Script to force clear caches - with protection against refresh loops

// Only run cache clearing once per session
if (!sessionStorage.getItem('cache_cleared')) {
  console.log('First visit this session - checking if cache needs clearing');
  
  // Set flag immediately to prevent multiple executions even if async operations take time
  sessionStorage.setItem('cache_cleared', 'true');
  
  // Check if we need to clear by looking for cached versions
  let shouldClearCache = false;
  
  // Check if we're seeing the old version with 'remember me' text
  if (document.body.innerHTML.includes('Remember me for 30 days')) {
    console.log('Found outdated content - will clear cache');
    shouldClearCache = true;
  }
  
  if (shouldClearCache && 'caches' in window) {
    console.log('Clearing all caches to refresh content...');
    
    // First, try to unregister any existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
          console.log(`Found ${registrations.length} service worker(s) to unregister`);
          for (let registration of registrations) {
            registration.unregister();
            console.log('Service worker unregistered');
          }
        }
      });
    }
    
    // Then clear all caches
    caches.keys().then(cacheNames => {
      if (cacheNames.length > 0) {
        console.log(`Found ${cacheNames.length} cache(s) to clear`);
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }
      return Promise.resolve();
    }).then(() => {
      console.log('Cache clearing complete');
      
      // Only reload if we actually cleared something
      if (shouldClearCache) {
        console.log('Reloading page once to get fresh content');
        // Add a URL parameter to ensure we don't get a cached version
        window.location.href = window.location.href.split('?')[0] + 
          '?cache_bust=' + new Date().getTime();
      }
    });
  } else {
    console.log('Cache appears to be up-to-date, no clearing needed');
  }
} else {
  console.log('Cache already checked this session - no action needed');
}
