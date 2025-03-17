import { playMenuSound, playVictorySound } from './sounds.js';

// Handle tab switching
const tabs = document.querySelectorAll('.auth-tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        playMenuSound();
        const targetForm = tab.dataset.tab === 'login' ? 'loginForm' : 'registerForm';
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show correct form
        document.getElementById('loginForm').style.display = targetForm === 'loginForm' ? 'block' : 'none';
        document.getElementById('registerForm').style.display = targetForm === 'registerForm' ? 'block' : 'none';
    });
});

// Template selection
const templateCards = document.querySelectorAll('.template-card');
let selectedTemplate = null;

templateCards.forEach(card => {
    card.addEventListener('click', () => {
        playMenuSound();
        templateCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedTemplate = card.dataset.template;
    });
});

// Handle login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    playMenuSound();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('http://localhost:5001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            playVictorySound();
            localStorage.setItem('username', username);
            window.location.href = '/';
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        alert('Connection error. Please try again.');
    }
});

// Handle registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    playMenuSound();
    
    if (!selectedTemplate) {
        alert('Please select a template to begin your journey!');
        return;
    }
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('http://localhost:5001/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password, template: selectedTemplate })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            playVictorySound();
            localStorage.setItem('username', username);
            window.location.href = '/';
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        alert('Connection error. Please try again.');
    }
});
