// Shared data file for the application

// Skill emojis mapping
export const skillEmojis = {
    // Sports
    'Tennis': '🏨',
    'BJJ': '🥋',
    'Cycling': '🚴',
    'Skiing': '⛷',
    'Padel': '🎾',
    'Squash': '🎾',
    'Badminton': '🏸',
    'Hyrox Training': '🏃',
    
    // Cardio
    '1km Running': '🏃',
    'Skierg': '⛷',
    'Row': '🚣',
    'Sled Push': '💪',
    'Burpee Broad Jumps': '🤸',
    'Sandbag Lunges': '🏋',
    'Sled Pull': '💪',
    'Wall Balls': '🏐',
    'Farmers Carry': '🏋',
    
    // Languages
    'Spanish': '🇪🇸',
    'French': '🇫🇷',
    'Japanese': '🇯🇵',
    
    // Other
    'Pilates': '🧘',
    'Reformer Pilates': '🧘',
    'Cooking': '🍳'
};

// Format functions
export function formatCurrency(value) {
    return new Intl.NumberFormat('en-GB', { 
        style: 'currency', 
        currency: 'GBP',
        notation: value >= 1000 ? 'compact' : 'standard',
        maximumFractionDigits: 0
    }).format(value);
}

// Auth helper functions
// Track failed login attempts to help diagnose password issues
let failedLoginAttempts = 0;

// Token management
const TOKEN_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes in milliseconds

export function getAuthTokens() {
    return {
        accessToken: localStorage.getItem('access_token') || sessionStorage.getItem('access_token'),
        refreshToken: localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token'),
        tokenExpiry: localStorage.getItem('token_expiry') ? parseInt(localStorage.getItem('token_expiry')) : null
    };
}

export function storeAuthTokens(accessToken, refreshToken, expiresIn) {
    try {
        // Store tokens in localStorage for persistence
        localStorage.setItem('access_token', accessToken);
        
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
        
        if (expiresIn) {
            const expiryTime = Date.now() + (expiresIn * 1000);
            localStorage.setItem('token_expiry', expiryTime.toString());
        }
        
        // Also store in sessionStorage for redundancy but faster access
        sessionStorage.setItem('access_token', accessToken);
        
        if (refreshToken) {
            sessionStorage.setItem('refresh_token', refreshToken);
        }
        
        // Reset failed login attempts
        failedLoginAttempts = 0;
        
        return true;
    } catch (e) {
        console.error('Failed to store auth tokens:', e);
        return false;
    }
}

export function clearAuthTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Get the access token, refreshing if necessary
export async function getToken() {
    const { accessToken, refreshToken, tokenExpiry } = getAuthTokens();
    
    // If we have a valid access token that's not near expiration, return it
    if (accessToken && tokenExpiry && (tokenExpiry - Date.now() > TOKEN_REFRESH_THRESHOLD)) {
        return accessToken;
    }
    
    // If we have a refresh token, try to get a new access token
    if (refreshToken) {
        try {
            const response = await fetch('/api/token/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                storeAuthTokens(
                    data.access_token,
                    data.refresh_token, // May be undefined if not rotating
                    data.expires_in
                );
                
                return data.access_token;
            } else {
                // If refresh failed, clear tokens and return null
                clearAuthTokens();
                return null;
            }
        } catch (e) {
            console.error('Error refreshing token:', e);
            
            // If there's an error but we still have an access token, return it as a last resort
            if (accessToken) {
                return accessToken;
            }
            
            return null;
        }
    }
    
    // No tokens available
    return null;
}

// Save user data to permanent local storage with enhanced backup
export function saveUserDataLocally(skills, financialGoals, specificUsername) {
    try {
        // Use provided username or get from auth
        const username = specificUsername || getUsername();
        if (!username) return false;
        
        const userData = {
            username,
            skills,
            financialGoals,
            savedAt: new Date().toISOString(),
            version: 2  // Track data version for migrations
        };
        
        // First save to primary storage
        localStorage.setItem(`user_data_${username}`, JSON.stringify(userData));
        
        // Create additional backup with timestamp for redundancy
        const backupKey = `user_data_backup_${username}_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(userData));
        
        // Keep only the 3 most recent backups to avoid storage overflow
        try {
            const backupKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`user_data_backup_${username}_`)) {
                    backupKeys.push(key);
                }
            }
            
            // Sort by timestamp (newest first) and remove old backups
            backupKeys.sort().reverse();
            if (backupKeys.length > 3) {
                for (let i = 3; i < backupKeys.length; i++) {
                    localStorage.removeItem(backupKeys[i]);
                }
            }
        } catch (backupError) {
            console.warn('Error managing data backups:', backupError);
        }
        
        console.log(`Saved user data locally for ${username} with backup`);
        return true;
    } catch (e) {
        console.error('Failed to save user data locally:', e);
        
        // Try with a simplified payload as last resort
        try {
            const emergencyData = {
                username: specificUsername || getUsername(),
                skills: skills?.slice(0, 20) || [], // Limit data size
                financialGoals: financialGoals?.slice(0, 5) || [],
                savedAt: new Date().toISOString(),
                isEmergencySave: true
            };
            localStorage.setItem(`emergency_data_${emergencyData.username}`, 
                                JSON.stringify(emergencyData));
            console.log('Saved emergency fallback data');
        } catch (emergencyError) {
            console.error('Complete failure saving any data:', emergencyError);
        }
        
        return false;
    }
}

// Load user data from permanent local storage with support for specific username
export function loadUserDataLocally(specificUsername) {
    try {
        // Use provided username or get from auth
        const username = specificUsername || getUsername();
        if (!username) return null;
        
        // Try localStorage first
        let userDataJson = localStorage.getItem(`user_data_${username}`);
        
        // If no data in localStorage, check for any other stored variants of the username
        // This helps with case sensitivity issues and minor typos
        if (!userDataJson) {
            // Check all localStorage keys for similar username patterns
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('user_data_')) {
                    const storedUsername = key.replace('user_data_', '');
                    // Check for case-insensitive match
                    if (storedUsername.toLowerCase() === username.toLowerCase()) {
                        userDataJson = localStorage.getItem(key);
                        console.log(`Found data with slight username variation: ${storedUsername}`);
                        break;
                    }
                }
            }
        }
        
        // Still no data found
        if (!userDataJson) {
            console.log(`No local data found for user: ${username}`);
            return null;
        }
        
        const userData = JSON.parse(userDataJson);
        console.log(`Loaded local data for ${username} from ${userData.savedAt}`);
        return userData;
    } catch (e) {
        console.error('Failed to load user data from local storage:', e);
        return null;
    }
}

// Track login failure for diagnostic purposes
export function recordLoginFailure(username, error) {
    failedLoginAttempts++;
    
    console.warn(`Login failure #${failedLoginAttempts} for ${username}: ${error?.toString() || 'Unknown error'}`);
    
    // If we have multiple failures, try recovery steps
    if (failedLoginAttempts >= 3) {
        console.warn('Multiple login failures detected, clearing possible corrupted tokens');
        // Clear tokens but preserve user data
        clearAuthTokens();
    }
    
    return failedLoginAttempts;
}

// User information management
export function getCurrentUser() {
    try {
        const userJson = localStorage.getItem('current_user');
        if (userJson) {
            return JSON.parse(userJson);
        }
    } catch (e) {
        console.error('Error parsing current user:', e);
    }
    
    return null;
}

export function storeCurrentUser(user) {
    if (!user || !user.username) return false;
    
    try {
        localStorage.setItem('current_user', JSON.stringify(user));
        sessionStorage.setItem('current_user', JSON.stringify(user));
        
        // For backward compatibility
        localStorage.setItem('username', user.username);
        sessionStorage.setItem('username', user.username);
        
        return true;
    } catch (e) {
        console.error('Failed to store current user:', e);
        return false;
    }
}

export function clearCurrentUser() {
    localStorage.removeItem('current_user');
    sessionStorage.removeItem('current_user');
    localStorage.removeItem('username');
    sessionStorage.removeItem('username');
}

export function getUsername() {
    // First try to get from current user object
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username) {
        return currentUser.username;
    }
    
    // Fall back to traditional storage methods
    let username = localStorage.getItem('username') || sessionStorage.getItem('username');
    
    // If not found in storage, try cookies as a last resort
    if (!username) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'username' || name === 'registered_user') {
                username = value;
                break;
            }
        }
    }
    
    // If we found a username, store it properly
    if (username) {
        storeCurrentUser({ username });
    }
    
    return username;
}
