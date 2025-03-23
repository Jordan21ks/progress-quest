// Simple auth.js file without modules
// This handles login and registration functionality

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
    console.log('Loading templates...');
    const templateGrid = document.querySelector('.template-grid');
    
    if (!templateGrid) {
        console.error('ERROR: Template grid not found in DOM');
        return;
    }
    
    // Show loading indicator
    templateGrid.innerHTML = '<div>Loading templates...</div>';
    
    try {
        console.log('Fetching templates from API...');
        // Try local server first (for development), then fall back to production
        let apiUrl = 'http://localhost:5001/api/templates';
        let response;
        
        try {
            console.log('Trying local API first...');
            response = await fetch(apiUrl, { 
                headers: {'Accept': 'application/json'},
                mode: 'cors'
            });
            
            if (!response.ok) {
                console.log('Local API failed, falling back to production');
                throw new Error('Local server not available');
            }
        } catch (err) {
            console.log('Using production API instead due to error:', err.message);
            apiUrl = 'https://experience-points-backend.onrender.com/api/templates';
            response = await fetch(apiUrl, { 
                headers: {'Accept': 'application/json'},
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        console.log('API response received');
        const data = await response.json();
        console.log('Template data:', data);
        
        // Clear existing templates
        templateGrid.innerHTML = '';
        
        // Check if we have templates
        if (!data || !Array.isArray(data.templates) || data.templates.length === 0) {
            console.error('No templates found in API response');
            templateGrid.innerHTML = '<div class="error-message">No templates available. Please try again later.</div>';
            return;
        }
        
        console.log(`Found ${data.templates.length} templates`);
        
        // Render each template
        data.templates.forEach(template => {
            console.log('Processing template:', template.id, template.name);
            const card = document.createElement('div');
            card.className = 'template-card';
            card.dataset.template = template.id;
            
            let skillsList = '';
            if (template.skills && Array.isArray(template.skills) && template.skills.length > 0) {
                console.log(`Template ${template.id} has ${template.skills.length} skills`);
                const skillsData = template.skills.map(skill => {
                    if (typeof skill === 'string') {
                        return { name: skill, target: 10 };
                    }
                    return {
                        name: skill.name || '',
                        target: skill.target || 10,
                        current: skill.current || 0
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
                console.log(`Template ${template.id} has ${template.financial.length} financial goals`);
                const financialData = template.financial.map(goal => {
                    if (typeof goal === 'string') {
                        return { name: goal, target: 1000 };
                    }
                    return {
                        name: goal.name || '',
                        target: goal.target || 1000,
                        current: goal.current || 0
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
            } else {
                console.log(`Template ${template.id} has no skills or financial goals`);
            }
            
            card.innerHTML = `
                <h3>${template.name}</h3>
                ${template.description ? `<p class="template-description">${template.description}</p>` : ''}
                ${skillsList}
            `;
            console.log(`Rendered template card for ${template.name}`);
            
            // Add click handler
            card.addEventListener('click', () => {
                console.log(`Selected template: ${template.id}`);
                document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Use window.selectedTemplate to ensure global accessibility
                window.selectedTemplate = template.id;
                console.log('Template selected and stored in window:', window.selectedTemplate);
                
                // Clear error message
                document.getElementById('register-error').style.display = 'none';
            });
            
            templateGrid.appendChild(card);
        });
        console.log('All templates rendered successfully');
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

// Template selection is managed via window.selectedTemplate

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

// Declare window.selectedTemplate to ensure global accessibility
window.selectedTemplate = null;

// Handle registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const errorDiv = document.getElementById('register-error');
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    
    // Check if template is selected
    if (!window.selectedTemplate) {
        errorDiv.textContent = 'Please select a template to begin your journey!';
        errorDiv.style.display = 'block';
        return;
    }
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password';
        errorDiv.style.display = 'block';
        return;
    }
    
    console.log('Starting registration process...');
    console.log('Selected template:', window.selectedTemplate);
    
    // Show loading state
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
        // Create registration payload
        const payload = {
            username,
            password,
            template: window.selectedTemplate
        };
        
        console.log('Registration payload:', JSON.stringify(payload));
        
        // Make API request
        const response = await fetch('https://experience-points-backend.onrender.com/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify(payload)
        });
        
        console.log('Registration response status:', response.status);
        
        // Get response data
        let data;
        try {
            data = await response.json();
            console.log('Registration response data:', data);
        } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            throw new Error('Invalid response from server');
        }
        
        // Handle response
        if (response.ok) {
            // Play sound if available
            try {
                if (typeof playVictorySound === 'function') {
                    playVictorySound();
                }
            } catch (soundError) {
                console.warn('Could not play victory sound:', soundError);
            }
            
            // Save user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            
            // Redirect to main app
            console.log('Registration successful, redirecting...');
            window.location.href = 'index.html';
        } else {
            // Show error message
            errorDiv.textContent = data.error || 'Registration failed. Please try again.';
            errorDiv.style.display = 'block';
            console.error('Registration failed:', data.error);
        }
    } catch (error) {
        // Handle network or other errors
        console.error('Registration error:', error);
        errorDiv.textContent = 'Connection error. Please try again later.';
        errorDiv.style.display = 'block';
    } finally {
        // Reset button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
});
