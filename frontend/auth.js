import { playVictorySound } from './sounds.js';
import { skillEmojis } from './data.js'; // Import from shared data file

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

// Process goal/skill items to a consistent format
function processItems(items) {
    if (!items || !Array.isArray(items) || items.length === 0) return [];
    
    return items
        .map(item => {
            if (typeof item === 'string') {
                return { name: item, target: item.includes('Debt') ? 1000 : 10 };
            }
            return {
                name: item.name || '',
                target: item.target || (item.name && item.name.includes('Debt') ? 1000 : 10),
                current: item.current || 0
            };
        })
        .filter(item => item.name);
}

// Generate template HTML
function generateTemplateHTML(template) {
    let skillsList = '';
    let financialList = '';
    
    // Process skills
    if (template.skills && Array.isArray(template.skills) && template.skills.length > 0) {
        const skillsData = processItems(template.skills);
        
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
    }
    
    // Process financial goals - now we always check for financial goals
    if (template.financial && Array.isArray(template.financial) && template.financial.length > 0) {
        const financialData = processItems(template.financial);
        
        if (financialData.length > 0) {
            financialList = `
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
    
    // Set a default description for templates that don't have one
    let description = template.description;
    if (!description || description.trim() === '') {
        if (template.id === 'financial_assassin') {
            description = 'Master your finances with these key saving goals';
        } else if (template.skills.length > 0 && template.financial.length === 0) {
            description = 'Build your skills with focused progress tracking';
        } else if (template.financial.length > 0 && template.skills.length === 0) {
            description = 'Reach your financial milestones step by step';
        } else {
            description = 'Track your progress and achieve your goals';
        }
    }
    
    return {
        id: template.id,
        html: `
            <h3>${template.name}</h3>
            <p class="template-description">${description}</p>
            ${skillsList}
            ${financialList}
        `
    };
}

// Load and render templates with optimized fetching
async function loadTemplates() {
    const templateGrid = document.querySelector('.template-grid');
    if (!templateGrid) return;
    
    // Show loading indicator
    templateGrid.innerHTML = '<div class="loading-templates">Loading your journey options...</div>';
    
    try {
        // Use AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced timeout
        
        const response = await fetch('https://experience-points-backend.onrender.com/api/templates', { 
            headers: {'Accept': 'application/json'},
            signal: controller.signal,
            cache: 'default'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        templateGrid.innerHTML = '';
        
        if (!data?.templates?.length) {
            templateGrid.innerHTML = '<div class="error-message">No templates available.</div>';
            return;
        }
        
        // Pre-process all templates at once
        const processedTemplates = data.templates.map(generateTemplateHTML);
        
        // Batch DOM updates with document fragment
        const fragment = document.createDocumentFragment();
        
        processedTemplates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.dataset.template = template.id;
            card.innerHTML = template.html;
            
            // Add click handler
            card.addEventListener('click', () => {
                document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedTemplate = template.id;
                document.getElementById('register-error').style.display = 'none';
            });
            
            fragment.appendChild(card);
        });
        
        templateGrid.appendChild(fragment);
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

// Centralized token storage function
function storeAuthToken(token, username, rememberMe = true) {
    try {
        // Calculate expiration time based on "Remember Me" choice
        // 30 days if remember me is checked, otherwise session only
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 0; // 30 days or session-only
        const expireDate = new Date();
        expireDate.setTime(expireDate.getTime() + (maxAge * 1000));
        
        // Always store in sessionStorage for current session
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('username', username);
        
        // Only store in localStorage and set persistent cookies if "Remember Me" is checked
        if (rememberMe) {
            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            localStorage.setItem('auth_timestamp', Date.now().toString());
            localStorage.setItem('remember_me', 'true');
            
            // Persistent cookies with expiration date
            document.cookie = `token=${token}; path=/; expires=${expireDate.toUTCString()}; SameSite=Strict`;
            document.cookie = `username=${username}; path=/; expires=${expireDate.toUTCString()}; SameSite=Strict`;
        } else {
            // Clear localStorage entries to ensure they aren't persisted
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('auth_timestamp');
            localStorage.removeItem('remember_me');
            
            // Session cookies (no expiration = browser session only)
            document.cookie = `token=${token}; path=/; SameSite=Strict`;
            document.cookie = `username=${username}; path=/; SameSite=Strict`;
        }
        return true;
    } catch (storageError) {
        console.error('Storage error:', storageError);
        // Fallback handling
        try {
            // Always try sessionStorage as minimum
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('username', username);
        } catch (err) {
            console.error('Both localStorage and sessionStorage failed:', err);
        }
        
        // Cookies as final fallback
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 0; // 30 days or session-only
        const expireDate = new Date();
        expireDate.setTime(expireDate.getTime() + (maxAge * 1000));
        
        if (rememberMe) {
            document.cookie = `token=${token}; path=/; expires=${expireDate.toUTCString()}; SameSite=Strict`;
            document.cookie = `username=${username}; path=/; expires=${expireDate.toUTCString()}; SameSite=Strict`;
        } else {
            document.cookie = `token=${token}; path=/; SameSite=Strict`;
            document.cookie = `username=${username}; path=/; SameSite=Strict`;
        }
        return true;
    }
}

// Handle form submission with loading state
async function handleAuthForm(formType, formData, errorDiv, submitButton) {
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = formType === 'login' ? 'Logging in...' : 'Creating Account...';
    submitButton.disabled = true;
    
    try {
        const endpoint = formType === 'login' ? 'login' : 'register';
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(`https://experience-points-backend.onrender.com/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            credentials: 'same-origin',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (response.ok) {
            playVictorySound();
            // Pass the remember me preference from login form
            const rememberMe = formData.rememberMe !== undefined ? formData.rememberMe : false;
            storeAuthToken(data.token, data.user.username, rememberMe);
            window.location.href = 'index.html';
            return true;
        } else {
            errorDiv.textContent = data.error || `${formType === 'login' ? 'Login' : 'Registration'} failed`;
            errorDiv.style.display = 'block';
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            return false;
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return false;
    }
}

// Handle login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    // Always remember users by default for 30 days
    const rememberMe = true;
    const errorDiv = document.getElementById('login-error');
    const submitButton = document.querySelector('#loginForm .btn');
    
    await handleAuthForm('login', { username, password, rememberMe }, errorDiv, submitButton);
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
    const submitButton = document.querySelector('#registerForm .btn');
    
    await handleAuthForm('register', 
        { username, password, template: selectedTemplate }, 
        errorDiv, 
        submitButton
    );
});
