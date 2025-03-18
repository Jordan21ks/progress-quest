import { playLevelUpSound, playVictorySound } from './sounds.js';

// Fun facts and progression milestones for skills
const SKILL_FACTS = {
    // Sports
    'Tennis': [
        'Did you know? Just 1 hour of tennis can burn up to 600 calories!',
        'Playing tennis for 3 hours a week reduces the risk of heart disease by 56%.',
        'Tennis players make around 4 decisions per second during points.',
        'You\'re developing great hand-eye coordination and reflexes!',
        'Your footwork and agility are noticeably improving!'
    ],
    'BJJ': [
        'BJJ was developed by the Gracie family in Brazil in the early 20th century.',
        'One hour of BJJ can burn between 400-800 calories!',
        'Regular BJJ practice improves flexibility, balance, and core strength.',
        'Your understanding of leverage and body mechanics is growing!',
        'You\'re building both physical and mental resilience!'
    ],
    'Cycling': [
        'Cycling for 30 minutes a day can reduce your risk of heart disease by 50%!',
        'Regular cyclists typically have the fitness level of someone 10 years younger.',
        'Cycling is one of the most efficient forms of human-powered transportation.',
        'Your cardiovascular endurance is steadily improving!',
        'You\'re building sustainable, low-impact fitness habits!'
    ],
    'Skiing': [
        'Skiing can burn up to 400 calories per hour!',
        'Skiing improves balance, core strength, and proprioception.',
        'Regular skiing strengthens all major muscle groups.',
        'Your balance and coordination are getting better!',
        'You\'re mastering the art of reading terrain!'
    ],
    'Padel': [
        'Padel is one of the fastest-growing sports worldwide!',
        'Padel combines elements of tennis and squash for a unique workout.',
        'A typical padel match can burn 400-600 calories.',
        'Your strategic thinking in enclosed spaces is improving!',
        'Your wall play technique is getting sharper!'
    ],
    'Spanish': [
        'Spanish is the world\'s second-most spoken language by native speakers!',
        'Learning a new language can delay the onset of dementia by up to 4.5 years.',
        'Being bilingual improves decision-making skills and multitasking abilities.',
        'Your vocabulary and grammar understanding are expanding!',
        'You\'re developing natural language patterns!'
    ],
    'Pilates': [
        'Pilates was developed by Joseph Pilates during World War I.',
        'Regular Pilates practice can significantly improve posture and core strength.',
        'Pilates helps prevent injuries by improving muscle balance.',
        'Your core strength and stability are increasing!',
        'Your posture and body awareness are improving!'
    ],
    'Cooking': [
        'Cooking at home can reduce calorie consumption by 50-70%!',
        'People who cook at home consume less sugar and processed foods.',
        'Cooking skills are associated with better dietary quality.',
        'Your knife skills and timing are getting better!',
        'You\'re developing a refined palate!'
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
let skills = [];
let financialGoals = [];

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'login.html';
            return false;
        }
        
        document.querySelector('.user-info').textContent = `👤 ${username}`;
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// Load goals from API
async function loadGoals() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load your goals');
        }
        
        // Update global arrays with defaults
        skills = data.skills || [];
        financialGoals = data.financial || [];
        
        // Render progress bars
        renderAll();
    } catch (error) {
        console.error('Error loading goals:', error);
        // Only show alert if we have no goals loaded
        if (!skills.length && !financialGoals.length) {
            alert(error.message);
        }
    }
}

// Placeholder for imported sound functions

// Format currency
function formatCurrency(amount) {
    if (amount >= 1000) {
        return `£${(amount / 1000).toFixed(0)}k`;
    }
    return `£${amount}`;
}

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
    if (history.length < 2) return null;

    // Calculate daily rate based on history
    const firstEntry = history[0];
    const lastEntry = history[history.length - 1];
    const daysDiff = (new Date(lastEntry.date) - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24);
    if (daysDiff === 0) return null;

    const progressRate = (lastEntry.value - firstEntry.value) / daysDiff;
    if (progressRate <= 0) return null;

    // Calculate days needed
    const remaining = item.target - item.current;
    const daysNeeded = remaining / progressRate;
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
    const daysLeft = getDaysUntilDeadline(item.deadline);
    const prediction = calculatePrediction(item);
    
    if (isMastered(item.current, item.target)) {
        return { status: 'completed', color: 'var(--ff-gold)' };
    }
    
    if (!prediction) {
        return { status: 'no-data', color: 'var(--ff-text)' };
    }
    
    const daysUntilPredicted = Math.ceil((prediction - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilPredicted > daysLeft) {
        return { status: 'behind', color: '#ff4444' };
    } else if (daysUntilPredicted > daysLeft * 0.8) {
        return { status: 'at-risk', color: '#ffaa44' };
    } else {
        return { status: 'on-track', color: '#44ff44' };
    }
}

// Render progress bars with FF-style
function renderProgressBar(container, item, isFinancial = false) {
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

    div.innerHTML = `
        <div class="progress-label">
            <span>${emoji} ${item.name} (Lv. ${item.level})</span>
            <span>${value}</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
        <div class="timeline-info" style="color: ${timelineStatus.color}">
            <span>⏰ Deadline: ${formatDate(item.deadline)} (${daysLeft} days)</span>
            <span>🎯 Predicted: ${prediction ? formatDate(prediction) : 'Insufficient data'}</span>
            <span>📊 Status: ${timelineStatus.status.replace('-', ' ').toUpperCase()}</span>
        </div>
    `;

    // Play celebration sound if reaching 100%
    if (percentage >= 100 && prevPercentage < 100) {
        playVictorySound().catch(e => console.warn('Could not play victory sound:', e));
        showFunFact(item.name, 'Congratulations! You\'ve mastered this skill! 🏆', 100, isFinancial);
    }

    // Show fun fact at certain milestones (25%, 50%, 75%, 100%)
    const milestones = [25, 50, 75];
    const crossedMilestone = milestones.find(m => percentage >= m && prevPercentage < m);

    if (crossedMilestone) {
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

// Render all progress bars
function renderAll() {
    const skillsContainer = document.getElementById('skills-container');
    const financialContainer = document.getElementById('financial-container');
    
    skillsContainer.innerHTML = '';
    financialContainer.innerHTML = '';
    
    skills.forEach(skill => renderProgressBar(skillsContainer, skill));
    financialGoals.forEach(goal => renderProgressBar(financialContainer, goal, true));
}

// Show add/edit form
export function showAddForm(type) {
    console.log('showAddForm called with type:', type);
    playMenuSound();
    const modal = document.getElementById('goalModal');
    const modalTitle = document.getElementById('modalTitle');
    const typeInput = document.getElementById('goal-type');
    const nameInput = document.getElementById('goal-name');
    const targetInput = document.getElementById('goal-target');
    const currentInput = document.getElementById('goal-current');
    
    modalTitle.textContent = type === 'skill' ? '🗡️ New Skill' : '💰 New Financial Goal';
    typeInput.value = type;
    nameInput.value = '';
    targetInput.value = '';
    currentInput.value = '';
    
    // Enable name field for new items
    nameInput.readOnly = false;
    
    modal.style.display = 'block';
}

// Skill emojis mapping
const skillEmojis = {
    // Sports
    'Tennis': '🎾',
    'BJJ': '🥋',
    'Cycling': '🚴',
    'Skiing': '⛷️',
    'Padel': '🏸',
    'Pilates': '🧘',
    
    // Languages
    'Spanish': '🗣️',
    'French': '🇫🇷',
    'Japanese': '🇯🇵',
    
    // Hyrox
    '1km Running': '🏃',
    'Skierg': '🎿',
    'Row': '🚣',
    'Sled Push': '🛷',
    'Burpee Broad Jumps': '💪',
    'Sandbag Lunges': '🏋️',
    'Sled Pull': '🛷',
    'Wall Balls': '🏀',
    'Farmers Carry': '🏋️',
    
    // Others
    'Cooking': '👨‍🍳',
    'Hyrox Training': '🏃',
    'Reformer Pilates': '🧘'
};

// Show edit form
function showEditForm(item, type, event) {
    const modal = document.getElementById('goalModal');
    const modalTitle = document.getElementById('modalTitle');
    const typeInput = document.getElementById('goal-type');
    const nameInput = document.getElementById('goal-name');
    const targetInput = document.getElementById('goal-target');
    const currentInput = document.getElementById('goal-current');
    const deadlineInput = document.getElementById('goal-deadline');
    
    modalTitle.textContent = `Edit ${item.name}`;
    typeInput.value = type;
    nameInput.value = item.name;
    targetInput.value = item.target;
    currentInput.value = item.current;
    deadlineInput.value = item.deadline;
    
    // Make name field readonly for edits
    nameInput.readOnly = true;
    
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
        const type = document.getElementById('goal-type').value;
        const name = document.getElementById('goal-name').value;
        const target = parseFloat(document.getElementById('goal-target').value);
        const current = parseFloat(document.getElementById('goal-current').value);
        const deadline = document.getElementById('goal-deadline').value || null;
        
        if (isNaN(target) || isNaN(current)) {
            alert('Please enter valid numbers');
            return;
        }
        
        const list = type === 'skill' ? skills : financialGoals;
        const existingIndex = list.findIndex(item => item.name === name);
        if (existingIndex >= 0) {
            // Update existing item
            const oldValue = list[existingIndex].current;
            const oldLevel = list[existingIndex].level;
            const oldHistory = list[existingIndex].history;
            
            // Send update to backend
            const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    id: list[existingIndex].id,
                    name,
                    current,
                    target,
                    deadline,
                    type
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update goal');
            }
            
            const updatedGoal = await response.json();
            
            // Update local state
            list[existingIndex] = updatedGoal;
            
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
                    playLevelUpSound();
                    const container = document.querySelector(`.progress-container[data-name="${name}"]`);
                    if (container) {
                        container.classList.add('level-up');
                        setTimeout(() => container.classList.remove('level-up'), 2000);
                    }
                }
            }
        } else {
            // Create new goal
            const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name,
                    current,
                    target,
                    deadline,
                    type
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create goal');
            }
            
            const newGoal = await response.json();
            list.push(newGoal);
        }
        
        // Refresh display
        renderAll();
        hideModal();
        // Update the display
        renderAll();
        
        // Close the modal
        hideModal();
    } catch (error) {
        console.error('Error updating goal:', error);
        alert(error.message || 'Failed to save goal. Please try again.');
    }
}

// Handle logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Show fun fact popup
function showFunFact(name, fact, milestone, isFinancial = false) {
    // Remove any existing popups
    const existingPopups = document.querySelectorAll('.fun-fact-popup');
    existingPopups.forEach(popup => popup.remove());
    
    const popup = document.createElement('div');
    popup.className = 'fun-fact-popup';
    
    // Get appropriate emoji based on type and milestone
    let emoji = '🎉';
    if (milestone >= 100) {
        emoji = '🏆';
    } else if (milestone >= 75) {
        emoji = '🌟';
    } else if (milestone >= 50) {
        emoji = '💪';
    } else if (milestone >= 25) {
        emoji = '🎯';
    }
    
    popup.innerHTML = `
        <div class="fun-fact-content">
            <h3>${emoji} ${name} Progress! (${milestone}% Complete)</h3>
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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) return;
    
    // Load goals
    loadGoals();
    
    // Set up form handlers
    document.getElementById('goalForm').addEventListener('submit', handleFormSubmit);
    
    // Set up logout handler
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Set up add buttons
    const addSkillBtn = document.getElementById('addSkillBtn');
    addSkillBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAddForm('skill');
    });
    
    const addFinancialBtn = document.getElementById('addFinancialBtn');
    addFinancialBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAddForm('financial');
    });
    
    // Set up cancel button
    document.getElementById('cancelBtn').addEventListener('click', (e) => {
        e.preventDefault();
        hideModal();
    });
    
    // Close modal on outside click
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('goalModal');
        if (event.target === modal) {
            hideModal();
        }
    });
    

});
