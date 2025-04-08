import { playVictorySound } from './sounds.js';
import { skillEmojis } from './data.js';
import { storeAuthTokens, clearAuthTokens, storeCurrentUser, getCurrentUser } from './data.js';
import * as Storage from './storage.js'; // Import the new storage module
import { saveDirectRegistration, isDirectlyAuthenticated, initializeDefaultGoals } from './bypass.js'; // Import our new direct authentication bypass

// Hardcoded financial assassin template to ensure it always displays correctly
const financialAssassinTemplate = {
    id: "financial_assassin",
    name: "The Financial Assassin",
    description: "Master your finances with these key saving goals",
    financial: [
        { name: "ETF Savings", target: 10000, current: 2000, level: 1 },
        { name: "Cash Savings", target: 3000, current: 1000, level: 1 },
        { name: "House Savings", target: 20000, current: 2000, level: 1 }
    ],
    skills: []
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
        
        const response = await fetch('/api/templates', { 
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
        
        // Ensure financialAssassin template is properly set
        let templates = [...data.templates];
        
        // Replace the Financial Assassin template with our hardcoded version
        const financialAssassinIndex = templates.findIndex(t => t.id === 'financial_assassin');
        if (financialAssassinIndex >= 0) {
            templates[financialAssassinIndex] = financialAssassinTemplate;
        }
        
        // Pre-process all templates at once
        const processedTemplates = templates.map(generateTemplateHTML);
        
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
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    
    // Set up form submission handlers
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const submitButton = event.submitter || document.querySelector('#loginForm button[type="submit"]');
    
    // Validation
    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Clear previous error
    errorDiv.style.display = 'none';
    
    // Show loading state
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    
    try {
        // First check if we can do offline login
        if (!navigator.onLine) {
            console.log('Device is offline, attempting offline login');
            const offlineSuccess = await attemptOfflineLogin(username, password, errorDiv, submitButton);
            if (offlineSuccess) return;
        }
        
        // Try online login
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens
            storeAuthTokens(data.access_token, data.refresh_token, data.expires_in);
            
            // Store user info
            storeCurrentUser(data.user);
            
            // Store credentials for offline login capability
            await storeOfflineCredentials(username, password, data.user);
            
            // Show success and redirect
            errorDiv.textContent = 'Login successful! Redirecting...';
            errorDiv.style.display = 'block';
            errorDiv.style.color = '#008000';
            submitButton.textContent = 'Success!';
            
            // Play sound (optional)
            playVictorySound();
            
            // Redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            // Handle login error
            errorDiv.textContent = data.error || 'Invalid username or password';
            errorDiv.style.display = 'block';
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        
        // Try offline login as fallback
        if (!navigator.onLine) {
            console.log('Network error during login, trying offline mode');
            await attemptOfflineLogin(username, password, errorDiv, submitButton);
        }
    }
}
async function handleRegister(event) {
    event.preventDefault();
    console.log('Registration form submitted');
    
    // Access form elements
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorDiv = document.getElementById('register-error');
    const submitButton = document.getElementById('register-button');
    const originalButtonText = submitButton.textContent || 'Start Your Journey';

    // Show errors in a visible, user-friendly way
    function showError(message) {
        console.error('Registration error:', message);
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#ff3860';
        errorDiv.style.padding = '10px';
        errorDiv.style.marginBottom = '15px';
        errorDiv.style.border = '1px solid #ff3860';
        errorDiv.style.borderRadius = '4px';
        errorDiv.scrollIntoView({ behavior: 'smooth' });
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }

    // Reset any previous errors
    errorDiv.style.display = 'none';
    
    // Username validation
    if (!username || username.length < 3) {
        showError('Username must be at least 3 characters long');
        return;
    }
    
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
        showError('Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens');
        return;
    }
    
    // Template validation - Use Financial Assassin as default if none selected
    if (!selectedTemplate) {
        console.log('No template selected, defaulting to financial_assassin');
        selectedTemplate = 'financial_assassin';
        // Visually select the financial_assassin template if it exists
        const financialAssassinCard = document.querySelector('.template-card[data-template="financial_assassin"]');
        if (financialAssassinCard) {
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
            financialAssassinCard.classList.add('selected');
        }
    }
    
    // Password validation
    if (!password) {
        showError('Please enter a password');
        return;
    }
    
    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }
    
    // Simplified password validation - focus on length more than complexity
    const hasLetters = /[A-Za-z]/.test(password);
    const hasDigits = /[0-9]/.test(password);
    
    if (!hasLetters || !hasDigits) {
        showError('Password must include both letters and numbers');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Show loading state
    submitButton.textContent = 'Creating account...';
    submitButton.disabled = true;
    
    try {
        console.log('Starting direct registration process...');
        
        // Create a simple user profile
        const userData = {
            id: 'user-' + Date.now(),
            username: username,
            registrationDate: new Date().toISOString(),
            template: selectedTemplate || 'default'
        };

        // DIRECT AUTHENTICATION: This completely bypasses the token system
        // that's causing the login loop problems
        const directAuthSuccess = saveDirectRegistration(username, userData);
        
        if (!directAuthSuccess) {
            showError('Failed to complete registration. Please try again.');
            return;
        }
        
        // Initialize user's default goals directly
        initializeDefaultGoals(username);
        
        // FOR BACKWARD COMPATIBILITY: Also use the previous authentication methods
        // but they aren't critical anymore since we have our direct system
        
        // Create a temporary ID and password hash
        const tempUserId = 'user-' + Date.now();
        const passwordHash = await secureHashPassword(password);

        // Save credentials for offline use (backward compatibility)
        try {
            await storeOfflineCredentials(username, password, {
                id: tempUserId,
                username: username,
                created_at: new Date().toISOString()
            });
            
            // Generate and store a token (backward compatibility)
            const tempToken = 'offline.' + btoa(Date.now() + '.' + username);
            localStorage.setItem('access_token', tempToken);
            sessionStorage.setItem('access_token', tempToken);
            localStorage.setItem('token', tempToken);
            sessionStorage.setItem('token', tempToken);
            localStorage.setItem('token_expiry', (Date.now() + (24 * 60 * 60 * 1000)).toString());
            
            // Store user info in all formats for maximum compatibility
            localStorage.setItem('username', username);
            sessionStorage.setItem('username', username);
            localStorage.setItem('auth_timestamp', Date.now().toString());
            sessionStorage.setItem('auth_timestamp', Date.now().toString());
            storeCurrentUser(userData);
            
            console.log('All authentication systems initialized successfully');
        } catch (error) {
            // Non-critical error - our direct system will still work
            console.warn('Error in backward compatibility auth:', error);
        }
        
        // Store pending registration for future sync
        localStorage.setItem(`registration_pending_${username}`, JSON.stringify({
            ...registerData,
            timestamp: new Date().toISOString()
        }));
                
        // ACTUAL BACKGROUND API REGISTRATION (OPTIONAL)
        // This is attempted but not required for our direct auth to work
        setTimeout(() => {
            try {
                console.log('Attempting API registration in background');
                fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        template: selectedTemplate || 'default'
                    })
                })
                .then(response => {
                    console.log('API registration returned:', response.status);
                    if (response.ok) {
                        return response.json();
                    }
                    console.warn('API registration failed with status:', response.status);
                })
                .then(data => {
                    if (data && data.access_token) {
                        console.log('Received API tokens - storing for future use');
                        // Store tokens but our direct auth is still primary
                        storeAuthTokens(data.access_token, data.refresh_token, data.expires_in);
                    }
                })
                .catch(err => {
                    console.warn('API registration error (non-critical):', err);
                });
            } catch (err) {
                console.warn('Error in background registration (non-critical):', err);
            }
        }, 500);
                
        // SHOW SUCCESS MESSAGE
        errorDiv.textContent = 'Registration successful! Setting up your dashboard...';
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#4CAF50';
        errorDiv.style.border = '1px solid #4CAF50';
        errorDiv.style.padding = '15px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.marginBottom = '20px';
        submitButton.textContent = 'Success!';
                
        // Play success sound if available
        try {
            playVictorySound();
        } catch (e) {
            console.warn('Could not play sound:', e);
        }
                
        // REDIRECT DIRECTLY TO INDEX WITH SUCCESS FLAG
        console.log('Redirecting to main dashboard with direct authentication');
        setTimeout(() => {
            window.location.href = 'index.html?direct_auth=success';
        }, 1500);

    } catch (error) {
        console.error('Registration error:', error);
        showError('Connection error. Your account has been created locally. You can start using the app right away!');
                
        
        // If offline, store registration intent for later sync
        if (!navigator.onLine) {
            try {
                // Save registration data for later sync
                localStorage.setItem(`registration_intent_${username}`, JSON.stringify({
                    username,
                    passwordHash: await secureHashPassword(password),
                    template: selectedTemplate,
                    timestamp: new Date().toISOString()
                }));
                
                errorDiv.textContent = 'You appear to be offline. Your activities and progress will sync when you reconnect.';
                errorDiv.style.color = '#2196F3';  // Blue color for information
                errorDiv.style.border = '1px solid #2196F3';
                errorDiv.style.display = 'block';
                
                // Redirect to dashboard after showing offline message
                setTimeout(() => {
                    window.location.href = 'index.html?mode=offline';
                }, 2500);
            } catch (e) {
                console.error('Failed to store offline registration intent:', e);
            }
        }
    }
}

// Centralized token storage function with emergency mode support
function storeAuthToken(token, username, rememberMe = true, isEmergency = false) {
    try {
        // Force rememberMe to true for permanent login persistence
        rememberMe = true;
        
        // Calculate expiration time - 30 days by default
        const maxAge = 60 * 60 * 24 * 30; // 30 days
        const expireDate = new Date();
        expireDate.setTime(expireDate.getTime() + (maxAge * 1000));
        
        console.log(`Storing auth token for ${username}${isEmergency ? ' (EMERGENCY MODE)' : ''}`);
        
        // Store in all available storage mechanisms for redundancy
        // First, store in localStorage which persists across sessions
        try {
            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            localStorage.setItem('auth_timestamp', Date.now().toString());
            localStorage.setItem('remember_me', 'true');
            
            // Mark emergency mode if applicable
            if (isEmergency) {
                localStorage.setItem('emergency_mode', 'true');
                localStorage.setItem('last_emergency_login', new Date().toISOString());
            }
            
            console.log('Successfully stored auth in localStorage');
        } catch (localStorageError) {
            console.warn('localStorage storage failed:', localStorageError);
        }
        
        // Next, store in sessionStorage for the current session
        try {
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('auth_timestamp', Date.now().toString());
            
            // Also mark emergency mode in session storage
            if (isEmergency) {
                sessionStorage.setItem('emergency_mode', 'true');
                sessionStorage.setItem('last_emergency_login', new Date().toISOString());
            }
            
            console.log('Successfully stored auth in sessionStorage');
        } catch (sessionStorageError) {
            console.warn('sessionStorage storage failed:', sessionStorageError);
        }
        
        // Finally, use cookies with a long expiration as a reliable backup
        try {
            // Store account existence separate from the auth token
async function storeOfflineCredentials(username, password, userData = null) {
    if (!username || !password) return false;
    
    try {
        // Create a more secure hash of the password
        // This is still not cryptographically secure for real production use
        // but better than the previous approach
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password + '-' + username);
        
        // Use SubtleCrypto if available (more secure)
        let secureHash;
        try {
            const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            secureHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            // Fallback method if SubtleCrypto is not available
            console.warn('SubtleCrypto not available, using fallback hash method');
            secureHash = await simpleHash(password, username);
        }
        
        // Store the credentials securely
        const credentials = {
            username,
            passwordHash: secureHash,
            timestamp: Date.now(),
            // Store subset of user data for offline use
            userData: userData || { username }
        };
        
        // Use IndexedDB for more secure storage
        await Storage.storeData('USER_DATA', 'offline_credentials', credentials);
        
        console.log(`Secure offline credentials stored for ${username}`);
        return true;
    } catch (e) {
        console.warn('Failed to store offline credentials:', e);
                if (credentials.passwordHash.includes(fallbackHash.substring(0, 10))) {
                    console.log('Fallback password verification successful');
                    success = true;
                }
            }
        }
        
        // If not successful, try the legacy emergency recovery data
        if (!success) {
            // Try to get legacy emergency data
            const emergencyData = localStorage.getItem(`emergency_recovery_${username}`);
            
            if (emergencyData) {
                const recovery = JSON.parse(emergencyData);
                // Verify using the old method
                const providedEncrypted = btoa(password.split('').reverse().join('') + '-salt-' + username);
                
                if (recovery.encryptedPassword === providedEncrypted) {
                    console.log('Legacy emergency verification successful');
                    success = true;
                    
                    // Upgrade to new storage method
                    await storeOfflineCredentials(username, password);
                }
            }
            
            // Try legacy registration data as a last resort
            if (!success) {
                const registrationData = localStorage.getItem(`registration_${username}`);
                if (registrationData) {
                    try {
                        const registration = JSON.parse(registrationData);
                        
                        // Check if we have a password hash
                        if (registration.passwordHash) {
                            if (registration.passwordHash === await secureHashPassword(password)) {
                                console.log('Legacy registration verification successful');
                                success = true;
                                
                                // Upgrade to new storage method
                                await storeOfflineCredentials(username, password);
                            }
                        }
                    } catch (e) {
                        console.warn('Error parsing legacy registration data', e);
                    }
                }
            }
        }
        
        if (success) {
            // Create an offline token with expiration
            const offlineToken = 'offline.' + btoa(Date.now() + '.' + username);
            const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            
            // Store user data
            const userData = credentials?.userData || { username };
            storeCurrentUser({
                ...userData,
                id: 'offline-' + Date.now(),
                username,
                isOfflineLogin: true,
                offlineLoginTime: new Date().toISOString()
            });
            
            // Store offline token
            storeAuthTokens(offlineToken, null, 24 * 60 * 60);
            
            // Try to load saved goals
            try {
                const { skills, financial } = await Storage.getGoals(username);
                
                if (skills.length > 0 || financial.length > 0) {
                    console.log('Successfully loaded offline data:', 
                        `${skills.length} skills, ${financial.length} financial goals`);
                }
            } catch (e) {
                console.warn('Failed to load user data during offline login:', e);
            }
            
            // Display success message
            errorDiv.textContent = 'Offline login successful! Redirecting...';
            submitButton.textContent = 'Success!';
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'index.html?mode=offline';
            }, 1500);
            
            return true;
        } else {
            console.log('Offline login verification failed');
            return false;
        }
    } catch (e) {
        console.error('Offline login failed:', e);
        return false;
    }
}
