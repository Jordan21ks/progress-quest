// Standalone Registration Script
// This handles template selection and registration without any module dependencies

// Global variable to store selected template
var selectedTemplateId = null;

// Function to play victory sound
function playSimpleVictorySound() {
    try {
        const audio = new Audio('sounds/victory.mp3');
        audio.play();
    } catch (error) {
        console.error('Error playing victory sound:', error);
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Setting up registration form');
    
    // Load templates
    loadTemplatesSimple();
    
    // Setup tab switching
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetForm = this.dataset.tab === 'login' ? 'loginForm' : 'registerForm';
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show correct form
            document.getElementById('loginForm').style.display = targetForm === 'loginForm' ? 'block' : 'none';
            document.getElementById('registerForm').style.display = targetForm === 'registerForm' ? 'block' : 'none';
            
            // Clear error messages
            document.getElementById('login-error').style.display = 'none';
            document.getElementById('register-error').style.display = 'none';
        });
    });
    
    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSimple);
    }
    
    // Setup register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSimple);
    }
});

// Load templates from API
async function loadTemplatesSimple() {
    console.log('Loading templates...');
    const templateGrid = document.querySelector('.template-grid');
    
    if (!templateGrid) {
        console.error('Template grid not found in DOM');
        return;
    }
    
    // Show loading indicator
    templateGrid.innerHTML = '<div>Loading templates...</div>';
    
    try {
        // Try production API
        const apiUrl = 'https://experience-points-backend.onrender.com/api/templates';
        const response = await fetch(apiUrl, { 
            headers: {'Accept': 'application/json'},
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Template data:', data);
        
        // Clear loading indicator
        templateGrid.innerHTML = '';
        
        // Check if we have templates
        if (!data || !Array.isArray(data.templates) || data.templates.length === 0) {
            templateGrid.innerHTML = '<div class="error-message">No templates available. Please try again later.</div>';
            return;
        }
        
        // Render each template
        data.templates.forEach(template => {
            console.log('Processing template:', template.id);
            const card = document.createElement('div');
            card.className = 'template-card';
            card.dataset.template = template.id;
            
            // Generate skills list or financial goals list
            let listContent = '';
            if (template.skills && template.skills.length > 0) {
                const skillsList = template.skills.map(skill => {
                    const skillName = typeof skill === 'string' ? skill : (skill.name || '');
                    const target = typeof skill === 'string' ? 10 : (skill.target || 10);
                    return `<li>🎯 ${skillName} (Target: ${target} hrs)</li>`;
                }).join('');
                
                listContent = `
                    <div class="template-skills">
                        <h4>🎯 Skills you'll develop:</h4>
                        <ul>${skillsList}</ul>
                    </div>
                `;
            } else if (template.financial && template.financial.length > 0) {
                const financialList = template.financial.map(goal => {
                    const goalName = typeof goal === 'string' ? goal : (goal.name || '');
                    const target = typeof goal === 'string' ? 1000 : (goal.target || 1000);
                    return `<li>💰 ${goalName} (Target: £${target.toLocaleString()})</li>`;
                }).join('');
                
                listContent = `
                    <div class="template-skills">
                        <h4>💰 Financial Goals:</h4>
                        <ul>${financialList}</ul>
                    </div>
                `;
            }
            
            // Populate card
            card.innerHTML = `
                <h3>${template.name || 'Unnamed Template'}</h3>
                ${template.description ? `<p class="template-description">${template.description}</p>` : ''}
                ${listContent}
            `;
            
            // Add click handler
            card.addEventListener('click', function() {
                console.log(`Selected template: ${template.id}`);
                
                // Update UI
                document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                
                // Store selection
                selectedTemplateId = template.id;
                console.log('Template ID stored:', selectedTemplateId);
                
                // Clear any error messages
                document.getElementById('register-error').style.display = 'none';
            });
            
            templateGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load templates:', error);
        templateGrid.innerHTML = `<div class="error-message">Failed to load templates: ${error.message}</div>`;
    }
}

// Handle login
async function handleLoginSimple(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password';
        errorDiv.style.display = 'block';
        return;
    }
    
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
            try {
                playSimpleVictorySound();
            } catch (e) {
                console.log('Sound error:', e);
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            window.location.href = 'index.html';
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Handle registration
async function handleRegisterSimple(event) {
    event.preventDefault();
    
    const errorDiv = document.getElementById('register-error');
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    // Clear previous errors
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    
    // Validate inputs
    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!selectedTemplateId) {
        errorDiv.textContent = 'Please select a template to begin your journey!';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
        console.log('Registering with:', {
            username, 
            password: '[HIDDEN]', 
            template: selectedTemplateId
        });
        
        // Make the API request
        const response = await fetch('https://experience-points-backend.onrender.com/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({
                username,
                password,
                template: selectedTemplateId
            })
        });
        
        console.log('Registration response status:', response.status);
        
        let data;
        try {
            data = await response.json();
            console.log('Registration response data:', data);
        } catch (jsonError) {
            console.error('Error parsing response:', jsonError);
            throw new Error('Invalid server response');
        }
        
        if (response.ok) {
            try {
                playSimpleVictorySound();
            } catch (soundError) {
                console.log('Sound error (non-critical):', soundError);
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            
            console.log('Registration successful, redirecting...');
            window.location.href = 'index.html';
        } else {
            errorDiv.textContent = data.error || 'Registration failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Connection error: ' + error.message;
        errorDiv.style.display = 'block';
    } finally {
        // Reset button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}
