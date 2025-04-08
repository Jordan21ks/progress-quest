import { playLevelUpSound, playVictorySound } from './sounds.js';
import { skillEmojis, formatCurrency, getToken, getUsername, storeCurrentUser } from './data.js';
import * as Storage from './storage.js';
import * as Sync from './sync.js';
import { isDirectlyAuthenticated, getDirectUsername, loadDirectGoals } from './bypass.js';

// Fun facts and progression milestones for skills
const SKILL_FACTS = {
    // Default facts for any skill
    'Default': [
        'Consistent practice is key to mastery. Small improvements compound over time.',
        'Research shows that deliberate practice is crucial for skill development.',
        'The journey of mastery is as rewarding as the destination.'
    ],
    // Financial Wisdom
    'Debt Repayment': [
        'Warren Buffett: "The most important thing to do if you find yourself in a hole is to stop digging." Studies show that prioritizing high-interest debt can save thousands in interest payments.',
        'Charlie Munger: "All I want to know is where I\'m going to die, so I\'ll never go there." Avoiding bad financial decisions is often more important than making good ones.',
        'Morgan Housel: "Your personal experiences with money make up maybe 0.00000001% of what\'s happened in the world, but maybe 80% of how you think the world works." Behavioral finance research shows personal biases significantly impact financial decisions.',
        'Warren Buffett: "Someone\'s sitting in the shade today because someone planted a tree a long time ago." Data shows that starting debt repayment early can reduce total interest by over 50%.',
        'Charlie Munger: "The first rule of compounding is to never interrupt it unnecessarily." Research indicates that consistent debt payments can reduce repayment time by years.'
    ],
    // Sports & Activities
    'Tennis': [
        'Research shows that tennis players have a 9.7 year increase in life expectancy compared to sedentary individuals.',
        'Studies indicate tennis improves bone density by 3-7% annually when played regularly.',
        'Data shows tennis players make approximately 4 decisions per second during points, enhancing cognitive function.',
        'Research in the British Journal of Sports Medicine shows tennis reduces cardiovascular disease risk by 56%.',
        'Studies show tennis improves reaction times by up to 25% with regular practice.'
    ],
    'BJJ': [
        'Studies show BJJ practitioners burn 400-800 calories per hour, more than most cardio activities.',
        'Research indicates BJJ improves bone density by 1-3% annually through resistance training.',
        'Clinical studies show BJJ reduces stress levels by up to 25% through mindful practice.',
        'Data shows BJJ improves core strength by 40% within the first year of training.',
        'Research indicates BJJ enhances problem-solving abilities by 15-20%.'
    ],
    'Cycling': [
        'Studies show cycling 30 minutes daily reduces heart disease risk by 50%.',
        'Research indicates cyclists have the cardiovascular fitness of someone 10 years younger.',
        'Data shows cycling burns 400-600 calories per hour, even at moderate intensity.',
        'Studies show cycling improves joint mobility by 20-30% without high impact.',
        'Research indicates cycling reduces carbon emissions by 5kg CO2 per 10km compared to driving.'
    ],
    'Skiing': [
        'Research shows skiing burns 400-600 calories per hour while building core strength.',
        'Studies indicate skiing improves balance and coordination by 20-30%.',
        'Clinical data shows skiing engages 95% of major muscle groups simultaneously.',
        'Research shows skiing improves proprioception by 15-25% over a season.',
        'Studies indicate skiing enhances mental focus and decision-making by 10-15%.'
    ],
    'Padel': [
        'Studies show padel improves agility and reaction time by 15-20%.',
        'Research indicates padel burns 400-600 calories per hour.',
        'Clinical data shows padel enhances hand-eye coordination by 25-30%.',
        'Studies show padel improves spatial awareness by 20-25%.',
        'Research indicates padel reduces stress levels by up to 30%.'
    ],
    'Spanish': [
        'Research shows bilingual individuals have 4-5 years delayed onset of cognitive decline.',
        'Studies indicate language learning improves memory capacity by 15-20%.',
        'Data shows bilingual speakers earn 5-20% more in the job market.',
        'Research shows Spanish fluency opens access to 22 countries and 500+ million speakers.',
        'Studies indicate bilingualism enhances problem-solving abilities by 15-18%.'
    ],
    'Pilates': [
        'Clinical studies show Pilates reduces chronic back pain by 36% on average.',
        'Research indicates Pilates improves core strength by 20-30% within 12 weeks.',
        'Studies show Pilates enhances flexibility by 15-20% in major muscle groups.',
        'Data shows Pilates improves posture-related issues by 25-30%.',
        'Research indicates Pilates reduces risk of injury by up to 40%.'
    ],
    'Cooking': [
        'Studies show home cooking reduces food expenses by 50-60% compared to dining out.',
        'Research indicates home-cooked meals contain 60% less sodium and 50% less calories.',
        'Data shows cooking skills correlate with 20-30% higher diet quality scores.',
        'Studies show meal planning reduces food waste by 25-30%.',
        'Research indicates home cooking improves family relationships by 40%.'
    ]
};

// Generic facts for any new skills
const GENERIC_SKILL_FACTS = [
    'Consistent practice is key to mastery!',
    'It takes about 10,000 hours to become an expert in any field.',
    'Learning new skills strengthens neural connections in your brain.',
    'You\'re making great progress!',
    'Keep up the momentum - you\'re doing great!'
];

// Financial goal facts
const FINANCIAL_FACTS = [
    'Regular saving is a key habit of financially successful people.',
    'Every step toward financial freedom counts!',
    'You\'re building strong financial habits!',
    'Financial discipline is a valuable life skill.',
    'You\'re getting closer to your financial goals!'
];

// Data storage
// Check authentication using our new direct authentication system first
// and falling back to the previous token-based systems if needed
async function checkAuth() {
    console.log('Running authentication check...');
    
    // DIRECT AUTH CHECK - our new reliable system
    if (isDirectlyAuthenticated()) {
        console.log('✅ User authenticated via direct system!');
        
        // Load goals using the direct system
        const goalsLoaded = loadDirectGoals();
        console.log('Direct goals loaded:', goalsLoaded ? 'Success' : 'No goals found');
        
        // Initialize the sync system
        Sync.setupAutoSync();
        return true;
    }
    
    // Special URL parameter handling
    if (window.location.search.includes('direct_auth=success')) {
        console.log('Direct auth success parameter detected, considering authenticated');
        // Remove the query parameter
        if (window.history && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('direct_auth');
            window.history.replaceState({}, document.title, url.toString());
        }
        return true;
    }
    
    // LEGACY CHECKS - try all previously used authentication methods as fallback
    console.log('Direct auth not found, trying legacy methods...');
    
    // Check token storage directly
    const hasToken = localStorage.getItem('access_token') || 
                    sessionStorage.getItem('access_token') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('token');
    
    // Check username
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    
    // Try centralized token function
    let token = null;
    try {
        token = await getToken();
    } catch (error) {
        console.warn('Error getting token:', error);
    }
    
    if (hasToken || token || username) {
        console.log('Legacy auth found:', hasToken ? 'Direct token' : '', token ? 'Function token' : '', username ? 'Username' : '');
        Sync.setupAutoSync();
        return true;
    }
    
    // No authentication found, redirect to login
    console.log('❌ No authentication method succeeded, redirecting to login');
    window.location.href = 'login.html';
    return false;
}

// Check if we have cached data to display
async function hasCachedData() {
    try {
        const username = getUsername();
        if (!username) return false;
        
        // Use our new IndexedDB storage
        const { skills, financial } = await Storage.getGoals(username);
        
        return (skills && skills.length > 0) || (financial && financial.length > 0);
    } catch (e) {
        console.warn('Error checking cached data:', e);
        return false;
    }
}

// Load goals from cache immediately for faster display
async function loadCachedGoals() {
    try {
        const username = getUsername();
        if (!username) {
            window.skills = [];
            window.financialGoals = [];
            return false;
        }
        
        // Use our new IndexedDB storage
        const { skills, financial } = await Storage.getGoals(username);
        
        // Update window objects for compatibility with existing code
        window.skills = skills || [];
        window.financialGoals = financial || [];
        
        if (window.skills.length > 0 || window.financialGoals.length > 0) {
            renderAll();
            console.log('Displayed cached data:', 
                        `${window.skills.length} skills, ${window.financialGoals.length} financial goals`);
        }
        
        return (window.skills.length > 0 || window.financialGoals.length > 0);
    } catch (error) {
        console.error('Error loading cached goals:', error);
        window.skills = [];
        window.financialGoals = [];
        return false;
    }
}

// Variables to track event listener registration
let onlineHandlerRegistered = false;
let offlineHandlerRegistered = false;

// Show offline notice when we can't connect to server
function showOfflineNotice() {
    const offlineNotice = document.getElementById('offline-notice');
    if (!offlineNotice) return;
    
    // Clear existing event listeners to prevent duplicates
    const oldSyncButton = document.getElementById('sync-now-btn');
    const oldCloseButton = document.getElementById('close-offline-notice');
    const oldRetryButton = document.getElementById('retry-sync-btn');
    
    if (oldSyncButton) {
        const newSyncButton = oldSyncButton.cloneNode(true);
        oldSyncButton.parentNode.replaceChild(newSyncButton, oldSyncButton);
    }
    
    if (oldCloseButton) {
        const newCloseButton = oldCloseButton.cloneNode(true);
        oldCloseButton.parentNode.replaceChild(newCloseButton, oldCloseButton);
    }
    
    if (oldRetryButton) {
        const newRetryButton = oldRetryButton.cloneNode(true);
        oldRetryButton.parentNode.replaceChild(newRetryButton, oldRetryButton);
    }
    
    // Set appropriate content based on online status
    if (!navigator.onLine) {
        offlineNotice.style.display = 'block';
        offlineNotice.innerHTML = `
            <p>📶 You're currently offline. Your progress is safely stored and will automatically sync when you reconnect.</p>
            <button id="sync-now-btn" style="display:none;">Sync Now</button>
            <button id="close-offline-notice">Dismiss</button>
        `;
        
        document.getElementById('close-offline-notice')?.addEventListener('click', () => {
            offlineNotice.style.display = 'none';
        });
    } else {
        // Online but show sync button
        offlineNotice.style.display = 'block';
        offlineNotice.innerHTML = `
            <p>✅ You're online. Any offline changes will automatically sync.</p>
            <button id="sync-now-btn">Sync Now</button>
            <button id="close-offline-notice">Dismiss</button>
        `;
        
        document.getElementById('sync-now-btn')?.addEventListener('click', async () => {
            try {
                // Show syncing message without recreating buttons
                const messageEl = offlineNotice.querySelector('p');
                if (messageEl) messageEl.textContent = 'Syncing data...';
                
                // Disable buttons during sync
                const syncBtn = document.getElementById('sync-now-btn');
                const closeBtn = document.getElementById('close-offline-notice');
                if (syncBtn) syncBtn.disabled = true;
                if (closeBtn) closeBtn.disabled = true;
                
                const result = await Sync.forceSynchronization();
                
                if (result.success) {
                    offlineNotice.innerHTML = `
                        <p>✅ Sync successful! Updated ${result.updated || 0} items, created ${result.created || 0} items.</p>
                        <button id="close-offline-notice">Dismiss</button>
                    `;
                    // Reload the data
                    await loadCachedGoals();
                } else {
                    offlineNotice.innerHTML = `
                        <p>⚠️ Sync incomplete: ${result.error || 'Unknown error'}</p>
                        <button id="retry-sync-btn">Retry</button>
                        <button id="close-offline-notice">Dismiss</button>
                    `;
                    
                    document.getElementById('retry-sync-btn')?.addEventListener('click', () => {
                        showOfflineNotice(); // Restart the sync process
                    });
                }
                
                document.getElementById('close-offline-notice')?.addEventListener('click', () => {
                    offlineNotice.style.display = 'none';
                });
            } catch (e) {
                console.error('Error during manual sync:', e);
                offlineNotice.innerHTML = `
                    <p>⚠️ Sync error: ${e.message}</p>
                    <button id="close-offline-notice">Dismiss</button>
                `;
                
                document.getElementById('close-offline-notice')?.addEventListener('click', () => {
                    offlineNotice.style.display = 'none';
                });
            }
        });
        
        document.getElementById('close-offline-notice')?.addEventListener('click', () => {
            offlineNotice.style.display = 'none';
        });
    }
    
    // Only register the event listeners once
    if (!onlineHandlerRegistered) {
        window.addEventListener('online', () => {
            showOfflineNotice();
            // Try to sync when coming back online
            if (navigator.onLine) {
                Sync.synchronizeData();
            }
        });
        onlineHandlerRegistered = true;
    }
    
    if (!offlineHandlerRegistered) {
        window.addEventListener('offline', showOfflineNotice);
        offlineHandlerRegistered = true;
    }
}

export async function loadGoals() {
    console.log('Loading goals from server...');
    
    // First try loading from permanent username-based storage
    try {
        // Dynamic import to avoid circular dependencies
        const dataModule = await import('./data.js');
        
        try {
            // First try to display cached data instantly for better user experience
            const hasCached = await loadCachedGoals();
            if (hasCached) {
                console.log('Using cached data while fetching from server');
            }
        
        // Only continue with server fetch if we're online
        if (!navigator.onLine) {
            console.log('Device is offline, using cached data only');
            document.getElementById('loading-indicator')?.classList.remove('visible');
            showOfflineNotice();
            return hasCached;
        }
        
        // Get token using the helper function
        const token = await getToken();
        
        if (!token) {
            console.error('No authentication token found');
            window.location.href = 'login.html';
            return false;
        }
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('/api/goals', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include', // Include cookies
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) {
            console.warn('Authentication failed (401 Unauthorized)');
            
            // Don't clear all storage - this causes the app to forget registrations
            // Just remove the token but keep the username and registration info
            const username = getUsername(); // Save username before clearing tokens
            const registeredUsers = localStorage.getItem('registered_users');
            
            // Clear only auth tokens
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            
            // Remember the username for login form
            if (username) {
                sessionStorage.setItem('last_username', username);
                console.log('Saved username for login form:', username);
            }
            
            window.location.href = 'login.html';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            console.warn('Server responded with error:', data.error || 'Unknown error');
            // Try to load from cache if server request failed
            if (loadCachedGoals()) {
                console.log('Successfully loaded data from cache as fallback');
                showOfflineNotice();
                return; // Skip the error since we loaded from cache
            }
            
            throw new Error(data.error || 'Failed to load your goals');
        }
        
        // Initialize or update arrays
        window.skills = Array.isArray(data.skills) ? data.skills : [];
        window.financialGoals = Array.isArray(data.financial) ? data.financial : [];
        
        // Cache the goals data for offline access - both in session cache and permanent storage
        try {
            const goalsCache = {
                skills: window.skills,
                financial: window.financialGoals,
            };
            
            // Session cache for quick access
            localStorage.setItem('cached_goals', JSON.stringify(goalsCache));
            localStorage.setItem('goals_cache_timestamp', Date.now().toString());
            
            // Permanent storage tied to username
            import('./data.js').then(module => {
                module.saveUserDataLocally(window.skills, window.financialGoals);
            });
        } catch (e) {
            console.warn('Failed to cache goals:', e);
        }
        
        // Ensure history arrays exist
        window.skills.forEach(skill => {
            if (!Array.isArray(skill.history)) skill.history = [];
        });
        window.financialGoals.forEach(goal => {
            if (!Array.isArray(goal.history)) goal.history = [];
        });
        
        // Render progress bars
        renderAll();
    } catch (error) {
        console.error('Error loading goals:', error);
        // Only show alert if we have no goals
        if (!window.skills?.length && !window.financialGoals?.length) {
            alert(error.message || 'Failed to load goals');
        }
    } finally {
        document.getElementById('loading-indicator')?.classList.remove('visible');
    }
}

// Calculate level based on progress
function calculateLevel(current, target) {
    try {
        return Math.floor((current / target) * 10) + 1;
    } catch (error) {
        console.warn('Error calculating level:', error);
        return 1; // Default to level 1 on error
    }
}

// Check if skill is mastered (100% or more)
function isMastered(current, target) {
    return current >= target;
}

// Level up a skill
function levelUp(item) {
    item.level += 1;
    item.target = Math.round(item.target * 1.5); // Increase target by 50%
    playVictorySound();
    showLevelUpMessage(item);
}

// Show level up message
function showLevelUpMessage(item) {
    const message = document.createElement('div');
    message.className = 'level-up-message';
    message.innerHTML = `
        <h3>🎉 LEVEL UP! 🎉</h3>
        <p>${item.name} reached Level ${item.level}!</p>
        <p>New target: ${item.target} hours</p>
    `;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
}

// Handle form submission
export async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        // Set the update flag to trigger fun facts
        window.justUpdated = true;
        
        const type = document.getElementById('goal-type').value;
        const name = document.getElementById('goal-name').value;
        const target = parseFloat(document.getElementById('goal-target').value);
        const current = parseFloat(document.getElementById('goal-current').value);
        const deadline = document.getElementById('goal-deadline').value || null;
        
        if (!name) {
            throw new Error('Please enter a name');
        }
        
        if (isNaN(target) || isNaN(current)) {
            throw new Error('Please enter valid numbers');
        }
        
        const list = type === 'skill' ? window.skills : window.financialGoals;
        // When editing from the form, the goal ID is stored in the DOM
        const goalId = document.getElementById('goalForm').dataset.goalId;
        
        // If we have a goal ID, we're editing an existing goal
        const existingIndex = goalId ? 
            list?.findIndex(item => item.id === parseInt(goalId)) : 
            list?.findIndex(item => item.name === name) ?? -1;
        
        // Prepare request data
        const requestData = {
            name,
            current,
            target,
            // Only include deadline if it was explicitly set by the user
            // Set to null explicitly to ensure we don't get default deadlines
            deadline: deadline && deadline.trim() !== '' ? deadline : null,
            type
        };
        
        let oldValue = 0;
        if (existingIndex >= 0) {
            requestData.id = list[existingIndex].id;
            oldValue = list[existingIndex].current || 0;
        }
        
        // Always save locally first (offline-first approach)
        // This ensures the data is saved even if we're offline
        const now = new Date().toISOString();
        const itemForLocalStorage = {
            ...requestData,
            // Add basic metadata for history
            history: existingIndex >= 0 && list[existingIndex].history ? 
                     [...list[existingIndex].history, { date: now, value: current }] :
                     [{ date: now, value: current }]
        };
        
        // Save to IndexedDB
        await Sync.saveItemLocally(itemForLocalStorage, type);
        
        // Try to send to server if we're online
        let data = null;
        
        if (navigator.onLine) {
            try {
                // Use timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                // Send to backend using getToken helper
                const response = await fetch('/api/goals', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getToken()}`
                    },
                    body: JSON.stringify(requestData),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                data = await response.json();
                
                if (!response.ok) {
                    console.warn('Server save failed but local save succeeded:', data.error);
                    // Continue with local data since we already saved locally
                } else {
                    // Server save successful, update with server data
                    console.log('Server save successful');
                    
                    // Store updated data from server in local storage
                    const updatedItem = {
                        ...data,
                        history: itemForLocalStorage.history // Keep our history
                    };
                    await Sync.saveItemLocally(updatedItem, type);
                }
            } catch (serverError) {
                console.warn('Server save failed, will sync later:', serverError);
                // Continue with local data
                data = { ...itemForLocalStorage, id: itemForLocalStorage.id || Date.now() };
            }
        } else {
            console.log('Offline mode: Item saved locally, will sync when online');
            // Use the local data with a temporary ID if needed
            data = { ...itemForLocalStorage, id: itemForLocalStorage.id || Date.now() };
        }
        
        // Update the window arrays for immediate UI update
        if (existingIndex >= 0) {
            // Update existing goal in the window array
            list[existingIndex] = {
                ...data,
                history: data.history || []  // Use updated history
            };
            
            // Check for level up
            const wasMastered = isMastered(oldValue, target);
            const isMasteredNow = isMastered(current, target);
            
            if (!wasMastered && isMasteredNow) {
                levelUp(list[existingIndex]);
            } else {
                // Regular level progress
                const oldProgressLevel = calculateLevel(oldValue, target);
                const newProgressLevel = calculateLevel(current, target);
                if (newProgressLevel > oldProgressLevel) {
                    // Play sound and show animation
                    playLevelUpSound(); // No need to await or catch, function handles errors internally
                    const container = document.querySelector(`.progress-container[data-name="${name}"`);
                    if (container) {
                        container.classList.add('level-up');
                        setTimeout(() => container.classList.remove('level-up'), 2000);
                    }
                }
                
                // Calculate progress percentage
                const progressPercentage = Math.round((current / target) * 100);
                const oldProgressPercentage = Math.round((oldValue / target) * 100);
                
                // Show fun fact only after passing 25% and 75% milestones
                const milestones = [25, 75];
                const hitMilestone = milestones.find(milestone => 
                    progressPercentage > milestone && oldProgressPercentage <= milestone
                );
                
                if (hitMilestone && navigator.onLine) {
                    // Fetch dynamic fact based on skill/goal name
                    const searchTerm = type === 'skill' ? 
                        `${name} activity benefits statistics research` : 
                        'debt repayment financial advice research';
                    
                    try {
                        // Add timeout for facts API call
                        const factsController = new AbortController();
                        const factsTimeoutId = setTimeout(() => factsController.abort(), 8000); // Shorter timeout for facts
                        
                        const response = await fetch('/api/facts', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${await getToken()}`
                            },
                            body: JSON.stringify({ searchTerm }),
                            signal: factsController.signal
                        });
                        
                        clearTimeout(factsTimeoutId);
                        
                        if (response.ok) {
                            const { fact } = await response.json();
                            showFunFact(name, fact);
                        }
                    } catch (error) {
                        console.warn('Failed to fetch fact, using local fallback:', error);
                        // Use a local fallback fact if we can't reach the server
                        const facts = SKILL_FACTS[name] || SKILL_FACTS['Default'];
                        const fact = facts[Math.floor(Math.random() * facts.length)];
                        showFunFact(name, fact);
                    }
                }
            }
        } else {
            // Add new goal to window array
            list.push({
                ...data,
                history: data.history || []
            });
        }
        
        // Update display and close modal
        hideModal();
        renderAll();
        
        // Reset the update flag
        window.justUpdated = false;
        
        return true;
    } catch (error) {
        console.error('Error saving goal:', error);
        alert(error.message || 'Failed to save goal');
        return false;
    }
}

// Handle logout with improved persistence of registration data
async function logout() {
    console.log('Logging out...');
    const token = getToken();
    const username = getUsername();
    
    // Cache user's data before logout for quick restoration on next login
    try {
        // Save current skills and goals to permanent storage
        if (window.skills?.length > 0 || window.financialGoals?.length > 0) {
            // Dynamic import to avoid circular dependencies
            const dataModule = await import('./data.js');
            dataModule.saveUserDataLocally(window.skills || [], window.financialGoals || []);
            console.log('Saved user data to permanent storage before logout');
        }
        
        // Store the username we're logging out from for auto-login
        if (username) {
            localStorage.setItem('last_logged_out_user', username);
            sessionStorage.setItem('last_username', username); // For login form auto-fill
            console.log('Remembered username for next login:', username);
            
            // Save registration status
            let registeredUsers = [];
            try {
                const existing = localStorage.getItem('registered_users');
                if (existing) {
                    registeredUsers = JSON.parse(existing);
                }
            } catch (e) { /* ignore parsing errors */ }
            
            if (!registeredUsers.includes(username)) {
                registeredUsers.push(username);
                localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
                console.log('Added to registered users list:', username);
            }
        }
    } catch (e) {
        console.warn('Failed to prepare cache for logout:', e);
    }
    
    // Send logout request to API
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Short timeout for logout
        
        console.log('Sending logout request to server');
        await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
    } catch (error) {
        console.warn('Error during logout API call:', error);
        // Continue with client-side logout regardless of API response
    }
    
    // Clear only authentication tokens, NOT registration data
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    // For security, remove user data from window objects
    window.skills = [];
    window.financialGoals = [];
    
    console.log('Logout complete, redirecting to login page');
    // Redirect to login
    window.location.href = 'login.html';
}

// Show fun fact popup
function showFunFact(name, fact, isFinancial = false) {
    // Remove any existing popups
    const existingPopups = document.querySelectorAll('.fun-fact-popup');
    existingPopups.forEach(popup => popup.remove());
    
    const popup = document.createElement('div');
    popup.className = 'fun-fact-popup';
    
    popup.innerHTML = `
        <div class="fun-fact-content">
            <h3>🌟 ${name} Progress!</h3>
            <p>${fact}</p>
            <button class="btn" onclick="this.closest('.fun-fact-popup').remove()">Got it!</button>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Auto-remove after 10 seconds
    const timeoutId = setTimeout(() => {
        if (popup && document.body.contains(popup)) {
            popup.remove();
        }
    }, 10000);
    
    // Clear timeout if popup is manually closed
    popup.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            clearTimeout(timeoutId);
        }
    });
}

// Initialize window objects
window.skills = [];
window.financialGoals = [];

// Initialize with improved data persistence
document.addEventListener('DOMContentLoaded', async function() {
    console.log('App initializing...');
    
    // Always try to load cached data first for immediate display
    loadCachedGoals();
    
    // Check auth in parallel but don't block initial rendering
    const authPromise = checkAuth();
    
    // Display loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading your progress data...</p>
    `;
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.background = 'rgba(0, 0, 0, 0.8)';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.borderRadius = '10px';
    loadingIndicator.style.zIndex = '1000';
    document.body.appendChild(loadingIndicator);

    try {
        // Wait for auth check to complete
        if (!await authPromise) {
            console.log('Auth check failed, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        // Auth successful, now load goals from server
        await loadGoals();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // If we can't load from server but have cached data, show offline notice
        if (hasCachedData()) {
            showOfflineNotice();
        } else {
            window.location.href = 'login.html';
            return;
        }
    } finally {
        // Remove loading indicator
        if (loadingIndicator && document.body.contains(loadingIndicator)) {
            loadingIndicator.remove();
        }
    }
    
    // Set up form handlers
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Set up logout handler with improved data persistence
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Set up add buttons
    const addSkillBtn = document.getElementById('addSkillBtn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showAddForm('skill');
        });
    }
    
    const addFinancialBtn = document.getElementById('addFinancialBtn');
    if (addFinancialBtn) {
        addFinancialBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showAddForm('financial');
        });
    }
    
    // Set up cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal();
        });
    }
    
    // Close modal on outside click
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('goalModal');
        if (event.target === modal) {
            hideModal();
        }
    });
    
    // Set up the logout function to preserve user data during logout
    async function handleLogout() {
        console.log('Logging out...');
        const token = await getToken();
        const username = getUsername();
        
        // Ensure all data is synced before logout
        try {
            if (navigator.onLine) {
                console.log('Syncing data before logout...');
                await Sync.forceSynchronization();
            }
        } catch (syncError) {
            console.warn('Failed to sync before logout:', syncError);
        }
        
        // Send logout request to API
        if (navigator.onLine && token) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // Short timeout for logout
                
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    signal: controller.signal
                })
                });
                
                clearTimeout(timeoutId);
            } catch (error) {
                console.warn('Error during logout API call:', error);
                // Continue with client-side logout regardless of API response
            }
        }
        
        // Clear authentication tokens
        const dataModule = await import('./data.js');
        dataModule.clearAuthTokens();
        dataModule.clearCurrentUser();
        
        // For security, remove user data from window objects
        window.skills = [];
        window.financialGoals = [];
        
        console.log('Logout complete, redirecting to login page');
        // Redirect to login
        window.location.href = 'login.html';
    }
    
    // Attach the logout handler
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
            handleLogout();
        }
    });
});
