import { playVictorySound } from './sounds.js';

// Skill emojis mapping
const skillEmojis = {
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

// Handle tab switching
const tabs = document.querySelectorAll('.auth-tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetForm = tab.dataset.tab === 'login' ? 'loginForm' : 'registerForm';
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show correct form
        document.getElementById('loginForm').style.display = targetForm === 'loginForm' ? 'block' : 'none';
        document.getElementById('registerForm').style.display = targetForm === 'registerForm' ? 'block' : 'none';
        
        // Clear error messages
        document.getElementById('login-error').style.display = 'none';
        document.getElementById('register-error').style.display = 'none';
    });
});

// Load and render templates
async function loadTemplates() {
    try {
        const response = await fetch('https://experience-points-backend.onrender.com/api/templates');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const templateGrid = document.querySelector('.template-grid');
        
        if (!templateGrid) {
            console.error('Template grid not found in DOM');
            return;
        }
        
        // Clear existing templates
        templateGrid.innerHTML = '';
        
        // Check if we have templates
        if (!data || !Array.isArray(data.templates) || data.templates.length === 0) {
            templateGrid.innerHTML = '<div class="error-message">No templates available. Please try again later.</div>';
            return;
        }
        
        // Render each template
        data.templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.dataset.template = template.id;
            
            let skillsList = '';
            if (template.skills && Array.isArray(template.skills) && template.skills.length > 0) {
                const skillsData = template.skills.map(skill => {
                    if (typeof skill === 'string') {
                        return { name: skill, target: 10 };
                    }
                    return {
                        name: skill.name || '',
                        target: skill.target || 10
                    };
                }).filter(skill => skill.name);
                
                if (skillsData.length > 0) {
                    skillsList = `
                        <div class="template-skills">
                            <h4>🎯 Skills you'll develop:</h4>
                            <ul>
                                ${skillsData.map(skill => 
                                    `<li>${skillEmojis[skill.name] || '🎯'} ${skill.name} (Target: ${skill.target} hrs)</li>`
                                ).join('')}
                            </ul>
                        </div>
                    `;
                }
            } else if (template.financial && Array.isArray(template.financial) && template.financial.length > 0) {
                const financialData = template.financial.map(goal => {
                    if (typeof goal === 'string') {
                        return { name: goal, target: 1000 };
                    }
                    return {
                        name: goal.name || '',
                        target: goal.target || 1000
                    };
                }).filter(goal => goal.name);
                
                if (financialData.length > 0) {
                    skillsList = `
                        <div class="template-skills">
                            <h4>💰 Financial Goals:</h4>
                            <ul>
                                ${financialData.map(goal => 
                                    `<li>💰 ${goal.name} (Target: £${goal.target.toLocaleString()})</li>`
                                ).join('')}
                            </ul>
                        </div>
                    `;
                }
            }
            
            card.innerHTML = `
                <h3>${template.name}</h3>
                ${template.description ? `<p class="template-description">${template.description}</p>` : ''}
                ${skillsList}
            `;
            
            // Add click handler
            card.addEventListener('click', () => {
                document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedTemplate = template.id;
                
                // Clear error message
                document.getElementById('register-error').style.display = 'none';
            });
            
            templateGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load templates:', error);
        const templateGrid = document.querySelector('.template-grid');
        if (templateGrid) {
            templateGrid.innerHTML = `<div class="error-message">Failed to load templates: ${error.message}</div>`;
        }
        const registerError = document.getElementById('register-error');
        if (registerError) {
            registerError.textContent = 'Failed to load templates. Please try again later.';
            registerError.style.display = 'block';
        }
    }
}

// Initialize template selection
let selectedTemplate = null;

// Load templates when page loads
document.addEventListener('DOMContentLoaded', loadTemplates);

// Handle login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch('https://experience-points-backend.onrender.com/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            playVictorySound();
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            window.location.href = 'index.html';
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
    }
});

// Handle registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const errorDiv = document.getElementById('register-error');
    
    if (!selectedTemplate) {
        errorDiv.textContent = 'Please select a template to begin your journey!';
        errorDiv.style.display = 'block';
        return;
    }
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('https://experience-points-backend.onrender.com/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, template: selectedTemplate })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            playVictorySound();
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            window.location.href = 'index.html';
        } else {
            errorDiv.textContent = data.error || 'Registration failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
    }
});
