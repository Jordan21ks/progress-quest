// This file provides a direct authentication bypass to fix the persistent login loop issue

// Save the registration data with a reliable identification method
function saveDirectRegistration(username, userData) {
    console.log('Storing direct registration data for:', username);
    try {
        // Store critical authentication data
        localStorage.setItem('direct_auth_username', username);
        localStorage.setItem('direct_auth_timestamp', Date.now().toString());
        localStorage.setItem('direct_auth_active', 'true');
        
        // Store user profile data
        if (userData) {
            localStorage.setItem('direct_auth_user_data', JSON.stringify(userData));
        }
        
        // Set a cookie as backup authentication
        document.cookie = `direct_auth=${username}; path=/; max-age=${60*60*24*30}`; // 30 days
        
        return true;
    } catch (error) {
        console.error('Failed to store direct registration:', error);
        return false;
    }
}

// Check if a user is authenticated using our direct method
function isDirectlyAuthenticated() {
    // Check for our direct authentication markers
    const username = localStorage.getItem('direct_auth_username');
    const active = localStorage.getItem('direct_auth_active') === 'true';
    const hasCookie = document.cookie.includes('direct_auth=');
    
    console.log('Direct auth check:', username ? 'Username found' : 'No username', 
                active ? 'Active' : 'Not active',
                hasCookie ? 'Cookie found' : 'No cookie');
    
    return username && active;
}

// Get the authenticated username
function getDirectUsername() {
    return localStorage.getItem('direct_auth_username');
}

// Clear direct authentication 
function clearDirectAuthentication() {
    localStorage.removeItem('direct_auth_username');
    localStorage.removeItem('direct_auth_timestamp');
    localStorage.removeItem('direct_auth_active');
    localStorage.removeItem('direct_auth_user_data');
    
    // Remove cookie
    document.cookie = 'direct_auth=; path=/; max-age=0';
}

// Initialize default skills and financial goals for a new user
function initializeDefaultGoals(username) {
    const skills = [
        { name: "Tennis", target: 15, current: 7, level: 1, type: 'skill' },
        { name: "BJJ", target: 15, current: 1, level: 1, type: 'skill' },
        { name: "Cycling", target: 10, current: 0, level: 1, type: 'skill' },
        { name: "Skiing", target: 8, current: 2, level: 1, type: 'skill' },
        { name: "Padel", target: 10, current: 2, level: 1, type: 'skill' },
        { name: "Spanish", target: 15, current: 1, level: 1, type: 'skill' },
        { name: "Pilates", target: 10, current: 0, level: 1, type: 'skill' },
        { name: "Cooking", target: 10, current: 0, level: 1, type: 'skill' }
    ];
    
    const financial = [
        { name: "Debt Repayment", target: 27000, current: 0, level: 1, type: 'financial' },
        { name: "Emergency Fund", target: 5000, current: 0, level: 1, type: 'financial' }
    ];
    
    // Store goals for this user
    try {
        localStorage.setItem(`goals_${username}_skills`, JSON.stringify(skills));
        localStorage.setItem(`goals_${username}_financial`, JSON.stringify(financial));
        
        // Also store globally for immediate access
        window.skills = skills;
        window.financialGoals = financial;
        
        return true;
    } catch (error) {
        console.error('Failed to initialize default goals:', error);
        return false;
    }
}

// Load goals for the authenticated user
function loadDirectGoals() {
    const username = getDirectUsername();
    if (!username) return false;
    
    try {
        // Load skills
        const skillsJSON = localStorage.getItem(`goals_${username}_skills`);
        const skills = skillsJSON ? JSON.parse(skillsJSON) : [];
        
        // Load financial goals
        const financialJSON = localStorage.getItem(`goals_${username}_financial`);
        const financial = financialJSON ? JSON.parse(financialJSON) : [];
        
        // Store globally
        window.skills = skills;
        window.financialGoals = financial;
        
        console.log(`Loaded direct goals for ${username}: ${skills.length} skills, ${financial.length} financial goals`);
        return true;
    } catch (error) {
        console.error('Failed to load direct goals:', error);
        return false;
    }
}

// Export functions for use in other modules
export {
    saveDirectRegistration,
    isDirectlyAuthenticated,
    getDirectUsername,
    clearDirectAuthentication,
    initializeDefaultGoals,
    loadDirectGoals
};
