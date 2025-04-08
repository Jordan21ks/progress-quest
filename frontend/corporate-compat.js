/**
 * Enterprise Compatibility Module 
 * This script enables compatibility with corporate network environments
 * and enterprise-managed MacBooks.
 */

(function() {
    // Check if running in a corporate environment
    function isEnterpriseDevice() {
        const userAgent = navigator.userAgent;
        const isManaged = document.cookie.includes('managed_device') || 
                          userAgent.includes('CorporateProxy') || 
                          userAgent.includes('JAMF');
        return isManaged;
    }

    // Apply enterprise-specific adjustments
    function applyEnterpriseCompatibility() {
        console.log('Applying enterprise compatibility settings...');

        // Modify storage access for compatibility with corporate proxies
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            try {
                originalSetItem.call(this, key, value);
            } catch (e) {
                console.warn('Storage blocked by corporate policy, using fallback cookie storage:', e);
                // Use cookies as fallback
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 30);
                document.cookie = `${key}=${encodeURIComponent(value)};expires=${expiry.toUTCString()};path=/;SameSite=Strict`;
            }
        };

        // Add proxy detection for API calls
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            // Add headers for enterprise proxies if needed
            const newOptions = options || {};
            newOptions.headers = newOptions.headers || {};
            newOptions.headers['X-Enterprise-Compatible'] = 'true';
            
            // Increase timeouts for corporate environments
            newOptions.timeout = 30000; // 30 seconds
            
            return originalFetch.call(this, url, newOptions).catch(error => {
                console.warn('Network request failed, possibly due to corporate proxy:', error);
                // Return graceful error to be handled by application
                return new Response(JSON.stringify({
                    error: 'Corporate network connectivity issue',
                    offline: true,
                    timestamp: new Date().toISOString()
                }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            });
        };

        // Add trusted origins for corporate environments
        document.addEventListener('securitypolicyviolation', (e) => {
            console.warn('CSP violation occurred:', e.blockedURI);
        });

        console.log('Enterprise compatibility settings applied');
    }

    // Run on page load
    if (isEnterpriseDevice()) {
        applyEnterpriseCompatibility();
    } else {
        // Add detection for corporate proxies that might appear after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                // Check again after a delay in case corporate policies load later
                if (isEnterpriseDevice()) {
                    applyEnterpriseCompatibility();
                }
            }, 2000);
        });
    }
})();
