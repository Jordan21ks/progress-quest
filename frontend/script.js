import { playMenuSound, playLevelUpSound, playVictorySound } from './sounds.js';

// Data storage
let skills = [];
let financialGoals = [];

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
        window.location.href = '/login.html';
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
            window.location.href = '/login.html';
            return false;
        }
        
        document.querySelector('.user-info').textContent = `👤 ${username}`;
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Load goals from API
async function loadGoals() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        
        const data = await response.json();
        skills = data.skills;
        financialGoals = data.financial;
        renderAll();
    } catch (error) {
        console.error('Failed to load goals:', error);
        alert('Failed to load your goals. Please try again.');
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
    
    const div = document.createElement('div');
    div.className = 'progress-container' + (mastered ? ' mastered' : '');
    
    const value = isFinancial ? 
        `${formatCurrency(item.current)}/${formatCurrency(item.target)}` :
        `${item.current}/${item.target} hrs`;

    const timelineStatus = getTimelineStatus(item);
    const daysLeft = getDaysUntilDeadline(item.deadline);
    const prediction = calculatePrediction(item);

    const emoji = !isFinancial ? skillEmojis[item.name] || '🎯' : '💰';
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

    // Add click handler to edit
    div.addEventListener('click', (event) => {
        playMenuSound();
        showEditForm(item, isFinancial ? 'financial' : 'skill', event);
    });

    // Add hover effect
    div.addEventListener('mouseenter', playMenuSound);

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
    'Tennis': '🎾',
    'BJJ': '🥋',
    'Cycling': '🚴',
    'Skiing': '⛷️',
    'Padel': '🏸',
    'Spanish': '🗣️',
    'Pilates': '🧘',
    'Cooking': '👨‍🍳',
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
    
    // Position modal on the left side
    const rect = event ? event.currentTarget.getBoundingClientRect() : { top: window.innerHeight / 2 };
    modal.style.position = 'fixed';
    modal.style.left = '20px';
    modal.style.top = `${Math.max(20, Math.min(rect.top, window.innerHeight - 400))}px`;
    modal.style.transform = 'none';
    
    modal.style.display = 'block';
}

// Hide modal
export function hideModal() {
    playMenuSound();
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
    playMenuSound();
    
    const type = document.getElementById('goal-type').value;
    const name = document.getElementById('goal-name').value;
    const target = parseFloat(document.getElementById('goal-target').value);
    const current = parseFloat(document.getElementById('goal-current').value);
    const deadline = document.getElementById('goal-deadline').value;
    
    if (isNaN(target) || isNaN(current)) {
        alert('Please enter valid numbers');
        return;
    }
    
    if (!deadline) {
        alert('Please select a deadline');
        return;
    }
    
    try {
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
                },
                credentials: 'include',
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
                },
                credentials: 'include',
                body: JSON.stringify({ name, current, target, deadline, type })
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
    } catch (error) {
        console.error('Error updating goal:', error);
        alert(error.message || 'Failed to save goal. Please try again.');
    }
    
    // Update the display
    renderAll();
    
    // Close the modal
    hideModal();
}

// Handle logout
function logout() {
    fetch('http://localhost:5000/api/logout', {
        credentials: 'include'
    }).then(() => {
        localStorage.removeItem('username');
        window.location.href = '/login.html';
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
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Set up add buttons
    const addSkillBtn = document.getElementById('addSkillBtn');
    addSkillBtn.addEventListener('click', () => showAddForm('skill'));
    
    const addFinancialBtn = document.getElementById('addFinancialBtn');
    addFinancialBtn.addEventListener('click', () => showAddForm('financial'));
    
    // Set up cancel button
    document.getElementById('cancelBtn').addEventListener('click', hideModal);
    
    // Close modal on outside click
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('goalModal');
        if (event.target === modal) {
            hideModal();
        }
    });
    
    // Add hover sound effect to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', playMenuSound);
    });
});
