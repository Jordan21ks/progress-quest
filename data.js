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

export function getToken() {
    // Try localStorage first - most reliable for persistence
    let token = localStorage.getItem('token');
    
    // If not in localStorage, try sessionStorage
    if (!token) {
        token = sessionStorage.getItem('token');
        
        // If found in sessionStorage but not localStorage, try to restore it to localStorage
        // This helps with cross-session persistence
        if (token) {
            try {
                localStorage.setItem('token', token);
                console.log('Restored token from sessionStorage to localStorage');
            } catch (e) {
                console.warn('Failed to restore token to localStorage:', e);
            }
        }
    }
    
    // If still not found, try cookies
    if (!token) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token') {
                token = value;
                
                // If found in cookies but not in storage, try to restore to both storage types
                try {
                    localStorage.setItem('token', token);
                    sessionStorage.setItem('token', token);
                    console.log('Restored token from cookies to storage');
                } catch (e) {
                    console.warn('Failed to restore token to storage:', e);
                }
                
                break;
            }
        }
    }
    
        // Reset failed login counter if we have a valid token
    if (token) {
        failedLoginAttempts = 0;
    }
    
    return token;
}

// Save user data to permanent local storage
export function saveUserDataLocally(skills, financialGoals) {
    try {
        const username = getUsername();
        if (!username) return false;
        
        const userData = {
            username,
            skills,
            financialGoals,
            savedAt: new Date().toISOString()
        };
        
        // Save to permanent storage with username key
        localStorage.setItem(`user_data_${username}`, JSON.stringify(userData));
        console.log(`Saved user data locally for ${username}`);
        return true;
    } catch (e) {
        console.error('Failed to save user data locally:', e);
        return false;
    }
}

// Load user data from permanent local storage
export function loadUserDataLocally() {
    try {
        const username = getUsername();
        if (!username) return null;
        
        const userDataJson = localStorage.getItem(`user_data_${username}`);
        if (!userDataJson) return null;
        
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
    
    // Store failure details for debugging
    try {
        const failureLog = JSON.parse(localStorage.getItem('login_failures') || '[]');
        failureLog.push({
            username,
            timestamp: new Date().toISOString(),
            error: error?.toString() || 'Unknown error',
            attemptCount: failedLoginAttempts
        });
        
        // Keep only the last 5 failures to avoid storage overflow
        while (failureLog.length > 5) {
            failureLog.shift();
        }
        
        localStorage.setItem('login_failures', JSON.stringify(failureLog));
        console.warn(`Login failure #${failedLoginAttempts} recorded for user: ${username}`);
        
        // If we have multiple failures, try some recovery steps
        if (failedLoginAttempts >= 2) {
            console.warn('Multiple login failures detected, attempting recovery...');
            // Clear any potentially corrupted tokens
            sessionStorage.removeItem('token');
            // But keep the username for login form
        }
    } catch (e) {
        console.error('Failed to record login failure:', e);
    }
}

export function getUsername() {
    // Try localStorage first - most reliable for persistence
    let username = localStorage.getItem('username');
    
    // If not in localStorage, try sessionStorage
    if (!username) {
        username = sessionStorage.getItem('username');
        
        // If found in sessionStorage but not localStorage, restore to localStorage
        if (username) {
            try {
                localStorage.setItem('username', username);
                console.log('Restored username from sessionStorage to localStorage');
            } catch (e) {
                console.warn('Failed to restore username to localStorage:', e);
            }
        }
    }
    
    // If still not found, try both cookie types
    if (!username) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'username' || name === 'registered_user') {
                username = value;
                
                // If found in cookies but not in storage, restore to both storage types
                try {
                    localStorage.setItem('username', username);
                    sessionStorage.setItem('username', username);
                    console.log('Restored username from cookies to storage');
                } catch (e) {
                    console.warn('Failed to restore username to storage:', e);
                }
                
                break;
            }
        }
    }
    
    // Last resort - check for registered users list
    if (!username) {
        try {
            const registeredUsers = localStorage.getItem('registered_users');
            if (registeredUsers) {
                const users = JSON.parse(registeredUsers);
                if (users.length > 0) {
                    // If we have registered users, use the most recent one
                    username = users[users.length - 1];
                    console.log('Using most recent registered user as fallback');
                }
            }
        } catch (e) {
            console.warn('Failed to parse registered users:', e);
        }
    }
    
    // If username found from any source, ensure it's saved in session storage at minimum
    if (username) {
        try {
            sessionStorage.setItem('last_username', username);
        } catch (e) {
            console.warn('Failed to save username to session storage:', e);
        }
    }
    
    return username;
}
