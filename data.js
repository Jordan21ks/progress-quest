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
export function getToken() {
    // Try localStorage first
    let token = localStorage.getItem('token');
    
    // If not in localStorage, try sessionStorage
    if (!token) {
        token = sessionStorage.getItem('token');
    }
    
    // If still not found, try cookies
    if (!token) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token') {
                token = value;
                break;
            }
        }
    }
    
    return token;
}

export function getUsername() {
    // Try localStorage first
    let username = localStorage.getItem('username');
    
    // If not in localStorage, try sessionStorage
    if (!username) {
        username = sessionStorage.getItem('username');
    }
    
    // If still not found, try cookies
    if (!username) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'username') {
                username = value;
                break;
            }
        }
    }
    
    return username;
}
