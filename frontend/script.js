import { playLevelUpSound, playVictorySound } from './sounds.js';
import { skillEmojis, formatCurrency, getToken, getUsername } from './data.js';

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
// Check authentication using shared helper functions
async function checkAuth() {
    // Get token and username using helper functions
    const token = getToken();
    const username = getUsername();
    
    // If we don't have valid credentials, redirect to login
    if (!token || !username) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'same-origin', // Include cookies in the request
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) {
            console.warn('Authentication check failed (401 Unauthorized)');
            
            // Don't clear the registered_users or registered_user entries
            // as we want to remember registrations across token expirations
            
            // Clear auth tokens but preserve registration record
            const registeredUsers = localStorage.getItem('registered_users');
            
            // Clear auth tokens
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('username');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            document.cookie = 'username=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            
            // Check if the username exists in our records
            // to help handle the expired token more gracefully
            if (registeredUsers) {
                try {
                    const users = JSON.parse(registeredUsers);
                    if (users.includes(username)) {
                        console.log('User was previously registered, redirecting to login for token refresh');
                        // Preserve the username in session to prefill the login form
                        sessionStorage.setItem('last_username', username);
                    }
                } catch (e) {
                    console.error('Error parsing registered users:', e);
                }
            }
            
            window.location.href = 'login.html';
            return false;
        }
        
        // Don't try to re-save tokens during auth check, as this can cause race conditions
        // Just verify they exist - they're already stored properly during login
        // Instead, we'll just update the UI with the username
        
        document.querySelector('.user-info').textContent = `👤 ${username}`;
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        // Only redirect if it's an AbortError (timeout) or the token is definitely invalid
        // This prevents race conditions where we aggressively redirect for network glitches
        if (error.name === 'AbortError' || !token) {
            window.location.href = 'login.html';
            return false;
        }
        // For other errors (like network issues), allow the page to keep trying
        return false;
    }
}

// Check if we have cached data to display
function hasCachedData() {
    const cachedGoals = localStorage.getItem('cached_goals');
    if (!cachedGoals) return false;
    
    try {
        const parsedGoals = JSON.parse(cachedGoals);
        const hasSkills = Array.isArray(parsedGoals.skills) && parsedGoals.skills.length > 0;
        const hasFinancial = Array.isArray(parsedGoals.financial) && parsedGoals.financial.length > 0;
        return hasSkills || hasFinancial;
    } catch (e) {
        return false;
    }
}

// Load goals from cache immediately for faster display
function loadCachedGoals() {
    console.log('Attempting to load goals from cache...');
    const cachedGoals = localStorage.getItem('cached_goals');
    if (!cachedGoals) {
        console.log('No cached goals found');
        return false;
    }
    
    try {
        const parsedGoals = JSON.parse(cachedGoals);
        window.skills = parsedGoals.skills || [];
        window.financialGoals = parsedGoals.financial || [];
        console.log('Loaded from cache:', 
            `${window.skills.length} skills, ${window.financialGoals.length} financial goals`);
        
        // Display a subtle indicator that we're using cached data
        const cacheTimestamp = localStorage.getItem('goals_cache_timestamp');
        if (cacheTimestamp) {
            const cacheDate = new Date(parseInt(cacheTimestamp));
            console.log('Cache timestamp:', cacheDate.toLocaleString());
        }
        
        // Render what we have from cache
        renderAll();
        return true;
    } catch (e) {
        console.warn('Failed to parse cached goals:', e);
        return false;
    }
}

// Show offline notice when we can't connect to server
function showOfflineNotice() {
    const notice = document.createElement('div');
    notice.className = 'offline-notice';
    notice.innerHTML = `
        <div class="offline-content">
            <h3>⚠️ Offline Mode</h3>
            <p>You're viewing cached data. Some features may be limited.</p>
            <button class="btn">Reconnect</button>
        </div>
    `;
    document.body.appendChild(notice);
    
    notice.querySelector('.btn').addEventListener('click', () => {
        location.reload();
    });
}

// Load goals from API with enhanced error handling and offline support
export async function loadGoals() {
    console.log('Loading goals from server...');
    
    // First try loading from permanent username-based storage
    try {
        // Dynamic import to avoid circular dependencies
        const dataModule = await import('./data.js');
        const userData = dataModule.loadUserDataLocally();
        
        if (userData && userData.skills && userData.financialGoals) {
            console.log('Loaded user data from permanent storage');
            window.skills = userData.skills;
            window.financialGoals = userData.financialGoals;
            renderAll();
        }
    } catch (e) {
        console.warn('Failed to load data from permanent storage:', e);
    }
    
    try {
        const token = getToken();
        if (!token) {
            console.warn('No auth token found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        // Try loading from session cache if needed
        if (!window.skills?.length && !window.financialGoals?.length) {
            loadCachedGoals();
        }
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        console.log('Fetching goals from API...');
        const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include', // Include cookies
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('API response status:', response.status);
        
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
    }
}

// Placeholder for imported sound functions

// formatCurrency is now imported from data.js

// Calculate level based on progress
function calculateLevel(current, target) {
    return Math.floor((current / target) * 10) + 1;
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

// Calculate time remaining and prediction
function calculatePrediction(item) {
    const history = item.history;
    
    // Need at least 2 history entries
    if (!history || history.length < 2) return null;

    // Calculate daily rate based on history
    const firstEntry = history[0];
    const lastEntry = history[history.length - 1];
    
    // Calculate days between first and last entry
    const daysDiff = (new Date(lastEntry.date) - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24);
    
    // Need at least 1 day difference for meaningful prediction
    if (daysDiff < 1) return null;
    
    // Also need value change for meaningful prediction
    const valueChange = lastEntry.value - firstEntry.value;
    if (valueChange <= 0) return null;

    // Calculate progress rate (value change per day)
    const progressRate = valueChange / daysDiff;
    
    // Calculate remaining days needed
    const remaining = item.target - item.current;
    const daysNeeded = remaining / progressRate;
    
    // Calculate predicted completion date
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysNeeded);

    return predictedDate;
}

// Format date for display
function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Calculate days until deadline
function getDaysUntilDeadline(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const days = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    return days;
}

// Get timeline status
function getTimelineStatus(item) {
    const prediction = calculatePrediction(item);
    
    // Check if the goal has been achieved
    if (isMastered(item.current, item.target)) {
        return { status: 'completed', color: 'var(--ff-gold)' };
    }
    
    // Check if we have enough data for prediction
    if (!prediction) {
        return { status: 'no-data', color: 'var(--ff-text)' };
    }
    
    // If no deadline, just show 'in progress' status
    // SIMPLE DEADLINE LOGIC: Always show ANY deadline
    // A deadline is valid if it simply exists and is not empty
    const hasDeadline = item.deadline && 
                       item.deadline !== null && 
                       item.deadline !== '';
    
    console.log('Deadline for ' + item.name + ':', item.deadline, 'Will show:', hasDeadline);
    if (!hasDeadline) {
        return { status: 'in-progress', color: 'var(--ff-crystal)' };
    }
    
    // If deadline exists, calculate status based on prediction vs deadline
    const daysLeft = getDaysUntilDeadline(item.deadline);
    const daysUntilPredicted = Math.ceil((prediction - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilPredicted > daysLeft) {
        return { status: 'behind', color: '#ff4444' };
    } else if (daysUntilPredicted > daysLeft * 0.8) {
        return { status: 'at-risk', color: '#ffaa44' };
    } else {
        return { status: 'on-track', color: '#44ff44' };
    }
}

// Helper function to generate timeline HTML
function generateTimelineHTML(item, hasDeadline, hasSufficientData, prediction, timelineStatus, daysLeft) {
    if (!hasDeadline && (!hasSufficientData || prediction === null)) {
        return '';
    }
    
    return `
        <div class="timeline-info">
            ${hasDeadline ? `<span>⏰ Deadline: ${formatDate(item.deadline)} (${daysLeft} days)</span>` : ''}
            ${(hasSufficientData && prediction !== null) ? `
                <span style="color: ${timelineStatus.color}">🎯 Predicted: ${formatDate(prediction)}</span>
                <span style="color: ${timelineStatus.color}">📊 Status: ${timelineStatus.status.replace('-', ' ').toUpperCase()}</span>
            ` : ''}
        </div>
    `;
}

// Render progress bars with FF-style
function renderProgressBar(container, item, isFinancial = false) {
    // Calculate progress percentage
    const percentage = (item.current / item.target) * 100;
    const mastered = isMastered(item.current, item.target);
    
    // Get previous progress if element exists
    const existingElement = container.querySelector(`[data-goal-id="${item.id}"]`);
    const previousPercentage = existingElement ? 
        (existingElement.querySelector('.progress-fill')?.style.width || '0%') :
        '0%';
    
    const div = document.createElement('div');
    div.className = 'progress-container' + (mastered ? ' mastered' : '');
    div.dataset.goalId = item.id;
    
    const value = isFinancial ? 
        `${formatCurrency(item.current)}/${formatCurrency(item.target)}` :
        `${item.current}/${item.target} hrs`;

    const timelineStatus = getTimelineStatus(item);
    const daysLeft = getDaysUntilDeadline(item.deadline);
    const prediction = calculatePrediction(item);

    const emoji = !isFinancial ? skillEmojis[item.name] || '🎯' : '💰';
    // Parse previous percentage for milestone detection
    const prevPercentage = parseFloat(previousPercentage) || 0;

    // Check if we have sufficient data for prediction and status
    // We now have much stricter requirements:
    // 1. Must have at least 2 history entries
    // 2. Entries must be at least 1 day apart
    // 3. Must show real progress between entries
    // 4. Must be able to actually calculate a meaningful prediction
    
    // First check if we have enough history entries
    const hasHistory = item.history && Array.isArray(item.history) && item.history.length >= 2;
    let hasSufficientData = false;
    
    if (hasHistory) {
        // Calculate time difference between first and last entry
        const firstEntry = item.history[0];
        const lastEntry = item.history[item.history.length - 1];
        
        // Make sure dates exist
        if (firstEntry.date && lastEntry.date) {
            const daysDiff = (new Date(lastEntry.date) - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24);
            const valueChange = lastEntry.value - firstEntry.value;
            
            // Now require at least 1 full day AND positive progress
            hasSufficientData = daysDiff >= 1 && valueChange > 0;
        }
    }
    
    // SIMPLE DEADLINE LOGIC: Always show ANY deadline
    // A deadline is valid if it simply exists and is not empty
    const hasDeadline = item.deadline && 
                       item.deadline !== null && 
                       item.deadline !== '';
    
    console.log('Deadline for ' + item.name + ':', item.deadline, 'Will show:', hasDeadline);
    
    // Only include prediction and status if we have a valid prediction - not just valid history entries
    const hasPrediction = prediction !== null && prediction !== undefined;
    
    div.innerHTML = `
        <div class="progress-label">
            <span>${emoji} ${item.name}<span class="level-display">(Lv. ${item.level})</span></span>
            <span>${value}</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
        ${generateTimelineHTML(item, hasDeadline, hasSufficientData, prediction, timelineStatus, daysLeft)}
    `;

    // Play celebration sound if reaching 100%, but only when updating
    if (percentage >= 100 && prevPercentage < 100 && window.justUpdated && !window.suppressFunFacts) {
        playVictorySound().catch(e => console.warn('Could not play victory sound:', e));
        showFunFact(item.name, 'Congratulations! You\'ve mastered this skill! 🏆', 100, isFinancial);
    }

    // Show fun fact at certain milestones (25%, 50%, 75%, 100%) but only when updating
    const milestones = [25, 50, 75];
    const crossedMilestone = milestones.find(m => percentage >= m && prevPercentage < m);

    if (crossedMilestone && window.justUpdated && !window.suppressFunFacts) {
        let fact;
        if (isFinancial) {
            fact = FINANCIAL_FACTS[Math.floor(Math.random() * FINANCIAL_FACTS.length)];
        } else {
            const facts = SKILL_FACTS[item.name] || GENERIC_SKILL_FACTS;
            fact = facts[Math.floor(Math.random() * facts.length)];
        }
        showFunFact(item.name, fact, crossedMilestone, isFinancial);
        // Play level up sound for non-100% milestones
        playLevelUpSound().catch(e => console.warn('Could not play level up sound:', e));
    }

    // Add click handler to edit
    div.addEventListener('click', (event) => {
        showEditForm(item, isFinancial ? 'financial' : 'skill', event);
    });

    container.appendChild(div);
}

// Render all progress bars without showing fun facts
function renderAll() {
    const skillsContainer = document.getElementById('skills-container');
    const financialContainer = document.getElementById('financial-container');
    
    skillsContainer.innerHTML = '';
    financialContainer.innerHTML = '';
    
    // Suppress fun facts when rendering from login or refresh
    window.suppressFunFacts = true;
    
    window.skills?.forEach(skill => renderProgressBar(skillsContainer, skill));
    window.financialGoals?.forEach(goal => renderProgressBar(financialContainer, goal, true));
    
    // Reset the flag after rendering
    window.suppressFunFacts = false;
}

// Show add/edit form
export function showAddForm(type) {
    console.log('showAddForm called with type:', type);
    const modal = document.getElementById('goalModal');
    const modalTitle = document.getElementById('modalTitle');
    const typeInput = document.getElementById('goal-type');
    const nameInput = document.getElementById('goal-name');
    const targetInput = document.getElementById('goal-target');
    const currentInput = document.getElementById('goal-current');
    const deadlineInput = document.getElementById('goal-deadline');
    const deleteButton = document.getElementById('delete-button');
    const goalForm = document.getElementById('goalForm');
    
    // Clear any existing goal ID when adding a new goal
    goalForm.dataset.goalId = '';
    
    modalTitle.textContent = type === 'skill' ? '🗡️ New Skill' : '💰 New Financial Goal';
    typeInput.value = type;
    nameInput.value = '';
    targetInput.value = '';
    currentInput.value = '';
    deadlineInput.value = '';
    
    // Enable name field for new items
    nameInput.readOnly = false;
    
    // Hide delete button for new items
    if (deleteButton) {
        deleteButton.style.display = 'none';
    }
    
    modal.style.display = 'block';
    nameInput.focus();
}

// skillEmojis now imported from data.js

// Show edit form
function showEditForm(item, type, event) {
    const modal = document.getElementById('goalModal');
    const modalTitle = document.getElementById('modalTitle');
    const typeInput = document.getElementById('goal-type');
    const nameInput = document.getElementById('goal-name');
    const targetInput = document.getElementById('goal-target');
    const currentInput = document.getElementById('goal-current');
    const deadlineInput = document.getElementById('goal-deadline');
    const deleteButton = document.getElementById('delete-button');
    const goalForm = document.getElementById('goalForm');
    
    modalTitle.textContent = `Edit ${item.name}`;
    typeInput.value = type;
    nameInput.value = item.name;
    targetInput.value = item.target;
    currentInput.value = item.current;
    deadlineInput.value = item.deadline;
    
    // Store the goal ID in the form for editing
    goalForm.dataset.goalId = item.id;
    
    // Name is editable in edit mode
    nameInput.readOnly = false;
    
    // Show delete button for edits and set the item ID
    if (deleteButton) {
        deleteButton.style.display = 'block';
        deleteButton.dataset.id = item.id;
        deleteButton.dataset.type = type;
    }
    
    // Position modal based on screen size
    const rect = event ? event.currentTarget.getBoundingClientRect() : { top: window.innerHeight / 2 };
    modal.style.position = 'fixed';
    
    if (window.innerWidth <= 768) {
        // Center modal on mobile
        modal.style.left = '50%';
        modal.style.top = '45%';
        modal.style.transform = 'translate(-50%, -50%)';
    } else {
        // Position on the left side for desktop
        modal.style.left = '20px';
        modal.style.top = `${Math.max(20, Math.min(rect.top, window.innerHeight - 400))}px`;
        modal.style.transform = 'none';
    }
    
    modal.style.display = 'block';
}

// Hide modal
export function hideModal() {
    document.getElementById('goalModal').style.display = 'none';
}

// Delete a goal
export async function deleteGoal(goalId, type) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        return;
    }
    
    try {
        console.log(`Deleting goal with ID: ${goalId}`);
        
        // Try local server first, then fall back to production
        let apiUrl = `http://localhost:5001/api/goals/${goalId}`;
        let response;
        
        try {
            console.log('Attempting to delete using local development server...');
            response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            // If local server gives an error, fall back to production
            if (!response.ok) {
                console.log(`Local server returned error: ${response.status}. Falling back to production.`);
                throw new Error('Local server error');
            }
        } catch (err) {
            console.log('Using production API instead:', err.message);
            // Use timeout for delete request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            apiUrl = `https://experience-points-backend.onrender.com/api/goals/${goalId}`;
            response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete item');
            }
        }
        
        // If we got here, the request was successful with either local or production server
        
        // Remove from local arrays
        const list = type === 'skill' ? window.skills : window.financialGoals;
        const index = list.findIndex(item => item.id === parseInt(goalId));
        if (index > -1) {
            list.splice(index, 1);
        }
        
        // Update UI with fun facts enabled for updates
        window.justUpdated = true;
        renderAll();
        window.justUpdated = false;
        hideModal();
        
    } catch (error) {
        console.error('Error deleting goal:', error);
        alert(error.message || 'Failed to delete item. Please try again.');
    }
}

// Add progress history entry
function addHistoryEntry(item, value) {
    const today = new Date().toISOString().split('T')[0];
    item.history.push({ date: today, value });
    
    // Keep only last 30 entries
    if (item.history.length > 30) {
        item.history.shift();
    }
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
        
        // Use timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        // Send to backend using getToken helper
        const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save goal');
        }
        
        // Update local state
        if (existingIndex >= 0) {
            // Record value change in history if actual progress was made
            if (oldValue !== current) {
                // Make sure history array exists
                if (!Array.isArray(list[existingIndex].history)) {
                    list[existingIndex].history = [];
                }
                
                // Add entry for this update
                list[existingIndex].history.push({
                    date: new Date().toISOString(),
                    value: current
                });
                
                // Print history to console for debugging
                console.log(`Updated history for ${name}:`, list[existingIndex].history);
            }
            
            // Update existing goal
            list[existingIndex] = {
                ...data,
                // Keep the updated history
                history: list[existingIndex].history || []
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
                    const container = document.querySelector(`.progress-container[data-name="${name}"]`);
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
                
                if (hitMilestone) {
                    // Fetch dynamic fact based on skill/goal name
                    const searchTerm = type === 'skill' ? 
                        `${name} activity benefits statistics research` : 
                        'debt repayment financial advice research';
                    
                    try {
                        // Add timeout for facts API call
                        const factsController = new AbortController();
                        const factsTimeoutId = setTimeout(() => factsController.abort(), 8000); // Shorter timeout for facts
                        
                        const response = await fetch('https://experience-points-backend.onrender.com/api/facts', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${getToken()}`
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
                        console.error('Failed to fetch fact:', error);
                    }
                }
            }
        } else {
            // Add new goal with initial history entry
            const now = new Date().toISOString();
            list.push({
                ...data,
                history: [
                    { date: now, value: current }
                ]
            });
            
            // Don't add an automatic second entry - we want at least 1 day
            // difference before we start showing predictions
        }
        
        // Update display and close modal
        renderAll();
        hideModal();
        
        // Reset the update flag after rendering
        window.justUpdated = false;
    } catch (error) {
        console.error('Error saving goal:', error);
        alert(error.message || 'Failed to save goal. Please try again.');
        return;
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
        await fetch('https://experience-points-backend.onrender.com/api/logout', {
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
document.addEventListener('DOMContentLoaded', async () => {
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
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Confirm logout to prevent accidental data loss
            if (confirm('Are you sure you want to log out? Your progress will be saved for when you return.')) {
                logout();
            }
        });
    }
    
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
    
    // Add proper logout function that preserves registration and user data
    async function logout() {
        console.log('Logging out...');
        const token = getToken();
        const username = getUsername();
        
        // Cache user's data before logout for quick restoration on next login
        try {
            // Save current skills and goals to permanent storage
            if (window.skills?.length > 0 || window.financialGoals?.length > 0) {
                const dataModule = await import('./data.js');
                dataModule.saveUserDataLocally(window.skills || [], window.financialGoals || []);
                console.log('Saved user data to permanent storage before logout');
            }
            
            // Store the username we're logging out from
            if (username) {
                localStorage.setItem('last_logged_out_user', username);
                sessionStorage.setItem('last_username', username); // For login form auto-fill
                console.log('Remembered username for next login:', username);
            }
        } catch (e) {
            console.warn('Failed to prepare cache for logout:', e);
        }
        
        // Send logout request to API
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // Short timeout for logout
            
            await fetch('https://experience-points-backend.onrender.com/api/logout', {
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
});
