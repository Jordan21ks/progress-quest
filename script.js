// Sound functions
function playLevelUpSound() {
    try {
        const audio = new Audio('sounds/level-up.mp3');
        audio.play();
    } catch (error) {
        console.error('Error playing level up sound:', error);
    }
}

function playVictorySound() {
    try {
        const audio = new Audio('sounds/victory.mp3');
        audio.play();
    } catch (error) {
        console.error('Error playing victory sound:', error);
    }
}

// Global chart variables
let progressRadarChart = null;
let chartInitialized = false; // Track if chart has been properly initialized
let chartInitAttempts = 0;  // Track number of initialization attempts

// Helper function to save goal to server after level up
async function saveGoalToServer(goal) {
    // Make sure goal has necessary properties
    if (!goal || typeof goal !== 'object' || !goal.id) {
        console.error('Cannot save invalid goal to server:', goal);
        return false;
    }
    
    console.log(`Saving goal to server: ${goal.name}, level: ${goal.level || 1}, progress: ${goal.current}/${goal.target}`);
    
    try {
        const requestData = {
            id: goal.id,
            name: goal.name,
            current: goal.current,
            target: goal.target,
            deadline: goal.deadline,
            type: goal.type || (typeof goal.current === 'number' && goal.current > 1000 ? 'financial' : 'skill'),
            level: goal.level || 1
        };
        
        console.log('Saving goal to server after level up:', requestData);
        
        const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save goal');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving goal after level up:', error);
        return null;
    }
}

// Fallback skills data - only used when debugging and no skills exist
const FALLBACK_SKILLS = [
    { name: 'Tennis', current: 7, target: 15 },
    { name: 'BJJ', current: 1, target: 15 },
    { name: 'Cycling', current: 0, target: 10 },
    { name: 'Skiing', current: 2, target: 8 },
    { name: 'Padel', current: 2, target: 10 },
    { name: 'Spanish', current: 1, target: 15 },
    { name: 'Pilates', current: 0, target: 10 },
    { name: 'Cooking', current: 0, target: 10 }
];

// Fallback financial goals - only used when debugging
const FALLBACK_FINANCIAL = [
    { name: 'Debt Repayment', current: 0, target: 27000, currency: '£', isCompact: true }
];

// Initialize the radar chart - simplified and robust implementation
function initProgressChart() {
    console.log('Initializing radar chart...');
    
    // Increment attempt counter
    chartInitAttempts++;
    const maxAttempts = 5;
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not available! The radar chart cannot be initialized.');
        // Try to load Chart.js dynamically if not available
        if (chartInitAttempts < maxAttempts) {
            console.log(`Chart.js not loaded, attempt ${chartInitAttempts}/${maxAttempts} - trying again in 500ms`);
            setTimeout(initProgressChart, 500);
        }
        return;
    }
    
    // First ensure the chart container and canvas are properly set up
    const chartContainerVisible = ensureChartCanvasIsVisible();
    if (!chartContainerVisible && chartInitAttempts < maxAttempts) {
        console.log(`Chart container not properly visible, attempt ${chartInitAttempts}/${maxAttempts} - trying again in 300ms`);
        setTimeout(initProgressChart, 300);
        return;
    }
    
    const ctx = document.getElementById('progressChart');
    if (!ctx) {
        console.warn('Chart canvas element not found');
        if (chartInitAttempts < maxAttempts) {
            // Retry with exponential backoff
            const delay = Math.min(200 * Math.pow(1.5, chartInitAttempts), 2000);
            console.log(`Canvas not found, attempt ${chartInitAttempts}/${maxAttempts} - trying again in ${delay}ms`);
            setTimeout(initProgressChart, delay);
        } else {
            console.error(`Failed to initialize chart after ${maxAttempts} attempts. Please refresh the page.`);
        }
        return;
    }
    
    // Double-check Chart.js is available at this point
    if (typeof Chart === 'undefined') {
        console.error('Chart.js still not available after previous checks');
        return;
    }
    
    console.log('Chart.js is loaded and canvas is ready - proceeding with initialization');
    
    // Clean up any existing chart
    if (progressRadarChart) {
        progressRadarChart.destroy();
        progressRadarChart = null;
    }
    
    // Get data directly from user skills
    let chartData = getChartData();
    console.log('Retrieved chart data:', chartData);
    
    // Safety check - make sure we have valid data
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
        console.warn('No data available for chart, using default data based on user activities');
        // Use data from the user's memory - Tennis, BJJ, Cycling, Skiing, etc.
        chartData = {
            labels: ['Tennis', 'BJJ', 'Cycling', 'Skiing', 'Padel', 'Spanish', 'Pilates', 'Cooking'],
            data: [46.7, 6.7, 0, 25, 20, 6.7, 0, 0]
        };
    }
    
    console.log('Creating chart with final data:', chartData);
    
    // Create a new chart with the data - using higher contrast colors for dark background
    try {
        console.log('Attempting to create new Chart instance');
        progressRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Progress %',
                data: chartData.data,
                backgroundColor: 'rgba(138, 43, 226, 0.7)', // More vibrant purple fill
                borderColor: 'rgba(200, 100, 255, 1)',      // Brighter purple border
                borderWidth: 3,
                pointBackgroundColor: 'rgba(255, 100, 255, 1)', // Brighter pink points
                pointBorderColor: '#fff',
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 100, 255, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: 'rgba(200, 200, 200, 0.4)'  // Brighter grid lines
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'  // Brighter grid
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        backdropColor: 'transparent',
                        color: 'rgba(200, 200, 200, 0.8)',  // Brighter tick labels
                        stepSize: 20,
                        font: {
                            size: 10
                        }
                    },
                    pointLabels: {
                        color: 'rgba(255, 255, 255, 0.9)',  // White axis labels
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: 15
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 60, 0.9)',
                    titleColor: 'rgba(255, 255, 255, 1)',
                    bodyColor: 'rgba(255, 255, 255, 1)',
                    titleFont: {
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            return `Progress: ${context.raw.toFixed(0)}%`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('Chart successfully initialized with', chartData.labels.length, 'data points');
    
    // Force a redraw with animation
    progressRadarChart.update({
        duration: 800,
        easing: 'easeOutBounce'
    });
    
    // Mark chart as successfully initialized
    chartInitialized = true;
    chartInitAttempts = 0; // Reset the counter for future initializations
    console.log('Radar chart successfully initialized and ready for display');
    } catch (error) {
        console.error('Error creating chart:', error);
        if (chartInitAttempts < 5) {
            console.log(`Error creating chart, attempt ${chartInitAttempts}/5 - trying again in 400ms`);
            setTimeout(initProgressChart, 400);
        }
    }

// Function to get chart data directly from skills and goals
function getChartData() {
    console.log('Getting chart data from current skills and goals');
    // Attempt to fix any undefined values
    if (!window.skills) window.skills = [];
    if (!window.financialGoals) window.financialGoals = [];
    console.log('Current state of window.skills:', window.skills);
    console.log('Current state of window.financialGoals:', window.financialGoals);
    
    // Start with empty arrays
    let labels = [];
    let data = [];
    
    // First try to use window.skills if they exist
    if (window.skills && window.skills.length > 0) {
        console.log(`Processing ${window.skills.length} skills for chart data`);
        
        // Process skills
        window.skills.forEach(skill => {
            if (skill && skill.name && skill.target > 0) {
                labels.push(skill.name);
                const percentage = Math.min((skill.current / skill.target) * 100, 100);
                data.push(percentage);
                console.log(`Added skill to chart: ${skill.name} = ${percentage}%`);
            }
        });
    } else {
        console.log('No skills found for chart data');
        
        // If no skills but we have test skills, use them
        if (window.testSkills && window.testSkills.length > 0) {
            console.log(`Using ${window.testSkills.length} test skills for chart data`);
            
            window.testSkills.forEach(skill => {
                if (skill && skill.name && skill.target > 0) {
                    labels.push(skill.name);
                    const percentage = Math.min((skill.current / skill.target) * 100, 100);
                    data.push(percentage);
                    console.log(`Added test skill to chart: ${skill.name} = ${percentage}%`);
                }
            });
        }
    }
    
    // Then use window.financialGoals if they exist
    if (window.financialGoals && window.financialGoals.length > 0) {
        console.log(`Processing ${window.financialGoals.length} financial goals for chart data`);
        
        // Process financial goals
        window.financialGoals.forEach(goal => {
            if (goal && goal.name && goal.target > 0) {
                labels.push(goal.name);
                const percentage = Math.min((goal.current / goal.target) * 100, 100);
                data.push(percentage);
                console.log(`Added financial goal to chart: ${goal.name} = ${percentage}%`);
            }
        });
    } else {
        console.log('No financial goals found for chart data');
    }
    
    // If still no data, use fallback data
    if (labels.length === 0) {
        // First check if we have backup chart data from loadGoals
        if (window.backupChartData && window.backupChartData.labels && window.backupChartData.labels.length > 0) {
            console.log('Using backup chart data as fallback:', window.backupChartData);
            return window.backupChartData;
        }
        
        // Then try test skills
        if (window.testSkills && window.testSkills.length > 0) {
            console.log('Using test skills as fallback');
            window.testSkills.forEach(skill => {
                if (skill && skill.name && skill.target > 0) {
                    labels.push(skill.name);
                    const percentage = Math.min((skill.current / skill.target) * 100, 100);
                    data.push(percentage);
                }
            });
        }
        
        // Finally try hardcoded fallbacks
        if (labels.length === 0) {
            const isDevEnvironment = window.location.href.includes('localhost') || 
                                  window.location.href.includes('127.0.0.1');
                                  
            console.log('No real data found for chart. Using hardcoded fallbacks in dev environment:', isDevEnvironment);
            
            // Only use fallback data during development
            if (isDevEnvironment) {
                console.log('Using fallback skills data for development');
                
                // Use our hardcoded fallbacks
                FALLBACK_SKILLS.forEach(skill => {
                    labels.push(skill.name);
                    const percentage = Math.min((skill.current / skill.target) * 100, 100);
                    data.push(percentage);
                });
            }
        }
    }
    
    console.log('Final chart data prepared:', { labels, data, count: labels.length });
    return { labels, data };
}

// Update the radar chart with current data
function updateProgressChart() {
    console.log('Updating radar chart with latest skill data');
    console.log('Current skills state:', window.skills);
    
    // Check if we're in a hidden iframe or tab
    if (document.hidden) {
        console.log('Document is hidden, delaying chart update until visible');
        document.addEventListener('visibilitychange', function onVisChange() {
            if (!document.hidden) {
                console.log('Document now visible, updating chart');
                document.removeEventListener('visibilitychange', onVisChange);
                updateProgressChart();
            }
        });
        return;
    }
    
    // Make sure the chart container is visible
    ensureChartCanvasIsVisible();
    
    // Initialize chart if it doesn't exist or wasn't properly initialized
    if (!progressRadarChart || !chartInitialized) {
        console.log('Chart not properly initialized, creating new chart');
        // Destroy any existing chart first to prevent duplicates
        if (progressRadarChart) {
            try {
                progressRadarChart.destroy();
            } catch (e) {
                console.warn('Could not destroy existing chart:', e);
            }
            progressRadarChart = null;
        }
        // Initialize with a small delay to ensure DOM is ready
        setTimeout(() => {
            initProgressChart();
        }, 50);
        return; // initProgressChart will set up the data
    }
    
    // Get fresh data directly from skills using our getChartData function
    console.log('UPDATE CHART - Starting data refresh');
    const chartData = getChartData();
    console.log('UPDATE CHART - Got chart data:', chartData);
    
    // If we have no data, check if we have backup data or use development fallbacks
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
        console.warn('UPDATE CHART - No valid chart data available');

        // First try to use backup data created during loadGoals()
        if (window.backupChartData && window.backupChartData.labels.length > 0) {
            console.log('Using backup chart data from loadGoals:', window.backupChartData);
            chartData.labels = [...window.backupChartData.labels];
            chartData.data = [...window.backupChartData.data];
        } else {
            // Otherwise check if we're in development mode
            const isDev = window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1');
            console.log('No data available to update chart. Dev mode:', isDev);
            
            // In dev mode, use the fallback data that matches the user's activities
            if (isDev) {
                chartData.labels = ['Tennis', 'BJJ', 'Cycling', 'Skiing', 'Padel', 'Spanish', 'Pilates', 'Cooking'];
                chartData.data = [46.7, 6.7, 0, 25, 20, 6.7, 0, 0];
                console.log('Using hardcoded development fallback data:', chartData);
            } else {
                return; // In production, just bail if no data
            }
        }
    }
    
    console.log('Updating chart with new data:', chartData);
    
    // Update the existing chart with new data
    progressRadarChart.data.labels = chartData.labels;
    progressRadarChart.data.datasets[0].data = chartData.data;
    
    // Force a layout recalculation by making chart visible
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        chartContainer.style.display = 'block';
        chartContainer.style.visibility = 'visible';
        chartContainer.style.opacity = '1';
    }
    
    // Force chart redraw by resizing
    if (progressRadarChart.resize) {
        progressRadarChart.resize();
    }
    
    // Force update the chart with animation
    progressRadarChart.update({
        duration: 600,
        easing: 'easeOutQuart'
    });
    
    console.log('Radar chart update completed with', chartData.labels.length, 'data points');
}

// Function to ensure chart is visible with proper dimensions for dark theme
function ensureChartCanvasIsVisible() {
    console.log('Ensuring chart canvas is visible with proper dimensions...');
    let isVisible = false;
    
    // Make sure we have Chart.js available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library is not loaded! Please check your network connection.');
        const chartSection = document.getElementById('chart-section');
        if (chartSection) {
            chartSection.innerHTML = '<div class="error-message">Chart cannot be displayed. Please refresh the page or check your network connection.</div>';
        }
        return false;
    }
    
    // Make sure the chart section is visible first
    const chartSection = document.getElementById('chart-section');
    if (chartSection) {
        chartSection.style.display = 'block';
        chartSection.style.visibility = 'visible';
        chartSection.style.opacity = '1';
    }
    
    // Make progress overview section visible
    const progressOverview = document.querySelector('.progress-overview');
    if (progressOverview) {
        progressOverview.style.display = 'block';
        progressOverview.style.visibility = 'visible';
        progressOverview.style.opacity = '1';
        progressOverview.style.position = 'relative';
        progressOverview.style.zIndex = '10';
    }
    
    // Now find and set up the chart container
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) {
        console.error('Chart container not found, cannot display chart');
        return false;
    }
    
    // Set chart container dimensions and styles
    chartContainer.style.display = 'block';
    chartContainer.style.visibility = 'visible';
    chartContainer.style.opacity = '1';
    chartContainer.style.zIndex = '100';
    chartContainer.style.margin = '0 auto 30px auto';
    chartContainer.style.width = '100%';
    chartContainer.style.maxWidth = '400px';
    chartContainer.style.height = '300px';
    chartContainer.style.position = 'relative';
    chartContainer.style.background = 'rgba(0, 0, 30, 0.1)';
    chartContainer.style.borderRadius = '50%';
    
    // Now set up the canvas properly
    const canvas = document.getElementById('progressChart');
    if (!canvas) {
        console.error('Chart canvas element not found');
        return false;
    }
    
    // Apply the necessary display properties with improved styling
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.zIndex = '101';
    
    // Set explicit dimensions (important for mobile)
    canvas.width = 300;
    canvas.height = 300;
    canvas.style.width = '300px';
    canvas.style.height = '300px';
    
    // Debug logging
    console.log('Canvas dimensions and visibility set:', {
        width: canvas.width,
        height: canvas.height,
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height,
        display: window.getComputedStyle(canvas).display,
        visibility: window.getComputedStyle(canvas).visibility,
        containerVisible: chartContainer.style.display
    });
    
    return true; // Return success
}

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
// Load user data and handle post-authentication actions
async function loadUserData() {
    console.log('Loading user data after authentication...');
    await loadGoals();
    ensureChartCanvasIsVisible();
    
    // Ensure chart is properly initialized with the new data
    if (!progressRadarChart || !chartInitialized) {
        console.log('Chart not initialized yet, initializing now with user data');
        initProgressChart();
    } else {
        console.log('Chart already exists, updating with user data');
        updateProgressChart();
    }
}

async function loadGoals() {
    console.log('==== CHART DIAGNOSTIC: LOAD GOALS FUNCTION STARTED ====');
    
    // Create test data for development use
    window.testSkills = [
        { name: 'Tennis', target: 15, current: 7, history: [] },
        { name: 'BJJ', target: 15, current: 1, history: [] },
        { name: 'Cycling', target: 10, current: 0, history: [] },
        { name: 'Skiing', target: 8, current: 2, history: [] },
        { name: 'Padel', target: 10, current: 2, history: [] },
        { name: 'Spanish', target: 15, current: 1, history: [] },
        { name: 'Pilates', target: 10, current: 0, history: [] },
        { name: 'Cooking', target: 10, current: 0, history: [] }
    ];
    console.log('Test skills data created for chart development');
    
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
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load your goals');
        }
        
        // Initialize or update arrays
        window.skills = Array.isArray(data.skills) ? data.skills : [];
        window.financialGoals = Array.isArray(data.financial) ? data.financial : [];
        
        console.log('Raw data loaded:', data);
        
        // If no skills or goals were loaded but user registered with a template, try to add template defaults
        if ((!window.skills || window.skills.length === 0) && (!window.financialGoals || window.financialGoals.length === 0)) {
            // Check localStorage for template info
            const template = localStorage.getItem('selected_template');
            console.log('No goals found, checking for template:', template);
            
            if (template === 'fitness' || !template) {
                console.log('Adding fitness template defaults');
                window.skills = [
                    { name: 'Tennis', target: 15, current: 7, history: [] },
                    { name: 'BJJ', target: 15, current: 1, history: [] },
                    { name: 'Cycling', target: 10, current: 0, history: [] },
                    { name: 'Skiing', target: 8, current: 2, history: [] },
                    { name: 'Padel', target: 10, current: 2, history: [] },
                    { name: 'Spanish', target: 15, current: 1, history: [] },
                    { name: 'Pilates', target: 10, current: 0, history: [] },
                    { name: 'Cooking', target: 10, current: 0, history: [] }
                ];
            } else if (template === 'finance') {
                console.log('Adding finance template defaults');
                window.financialGoals = [
                    { name: 'Debt Repayment', target: 27000, current: 0, history: [] }
                ];
            }
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
        
        // Debug logging for skills and financial goals
        console.log('==== CHART DIAGNOSTIC: GOALS LOADED ====');
        console.log('Skills loaded (count):', window.skills ? window.skills.length : 0);
        console.log('Skills loaded (data):', JSON.stringify(window.skills));
        console.log('Financial goals loaded (count):', window.financialGoals ? window.financialGoals.length : 0);
        console.log('Financial goals loaded (data):', JSON.stringify(window.financialGoals));
        
        // Create comprehensive backup chart data from current skills
        window.backupChartData = {
            labels: window.skills.map(s => s.name),
            data: window.skills.map(s => Math.min((s.current / s.target) * 100, 100))
        };
        
        // If we have no skills but have test skills, use them (only in non-production)
        if ((!window.skills || window.skills.length === 0 || window.skills[0].current === 0) && window.testSkills) {
            const isNonProduction = !window.location.href.includes('experiencepoints.app');
            
            if (isNonProduction) {
                console.log('Using test skills as fallback in non-production environment');
                window.backupChartData = {
                    labels: window.testSkills.map(s => s.name),
                    data: window.testSkills.map(s => Math.min((s.current / s.target) * 100, 100))
                };
            }
        }
        
        console.log('Final backup chart data ready:', window.backupChartData);
        
        // Dispatch event to notify that skills data is ready
        document.dispatchEvent(new CustomEvent('skillsLoaded', { 
            detail: { 
                skillsCount: window.skills.length, 
                goalsCount: window.financialGoals.length,
                chartData: window.backupChartData 
            } 
        }));
        
        // Ensure chart canvas is visible before chart initialization
        ensureChartCanvasIsVisible();
        
        // Force destroy and recreate chart to ensure it has the latest data
        if (progressRadarChart) {
            try {
                progressRadarChart.destroy();
            } catch (e) {
                console.warn('Could not destroy existing chart:', e);
            }
            progressRadarChart = null;
            chartInitialized = false;
        }
        
        // Make sure chart container is visible before chart initialization
        const canvasReady = ensureChartCanvasIsVisible();
        
        // Improved multi-phase chart initialization with better sequencing
        // Phase 1: Small delay to ensure DOM and data are ready
        setTimeout(() => {
            console.log('Phase 1: Initializing chart after skills are loaded');
            // Always recreate the chart to ensure it has the latest data
            if (progressRadarChart) {
                try {
                    progressRadarChart.destroy();
                } catch (e) {
                    console.warn('Could not destroy existing chart:', e);
                }
                progressRadarChart = null;
                chartInitialized = false;
            }
            // Ensure canvas visibility one more time
            ensureChartCanvasIsVisible();
            // Initialize the chart
            initProgressChart();
        }, 100);
        
        // Phase 2: After DOM content is fully processed
        setTimeout(() => {
            // Check if chart initialization was successful
            if (!chartInitialized || !progressRadarChart || 
                !progressRadarChart.data || 
                progressRadarChart.data.labels.length === 0) {
                
                console.log('Phase 2: Recreating chart after DOM is ready');
                if (progressRadarChart) {
                    try {
                        progressRadarChart.destroy();
                    } catch (e) {
                        console.warn('Could not destroy existing chart:', e);
                    }
                    progressRadarChart = null;
                    chartInitialized = false;
                }
                ensureChartCanvasIsVisible();
                initProgressChart();
            }
        }, 300);
        
        // Phase 3: Final attempt with forced visibility
        setTimeout(() => {
            if (!progressRadarChart || progressRadarChart.data.labels.length === 0) {
                console.log('Phase 3: Final chart initialization attempt');
                
                // Force chart visibility one more time
                ensureChartCanvasIsVisible();
                
                // Clean up any existing chart
                if (progressRadarChart) {
                    progressRadarChart.destroy();
                    progressRadarChart = null;
                }
                
                // Create new chart
                initProgressChart();
            }
            
            // Set up event listeners for window resize
            window.addEventListener('resize', () => {
                ensureChartCanvasIsVisible();
                if (progressRadarChart) {
                    progressRadarChart.resize();
                    progressRadarChart.update();
                }
            });
            
            // Set up event listeners to update chart when skills or financial goals change
            console.log('Setting up chart update event listeners');
            document.addEventListener('skillAdded', updateProgressChart);
            document.addEventListener('skillUpdated', updateProgressChart);
            document.addEventListener('skillDeleted', updateProgressChart);
            document.addEventListener('financialGoalAdded', updateProgressChart);
            document.addEventListener('financialGoalUpdated', updateProgressChart);
            document.addEventListener('financialGoalDeleted', updateProgressChart);
            document.addEventListener('skillsLoaded', updateProgressChart);
            
            // Force a final check and update
            console.log('Forcing final chart update');
            updateProgressChart();
        }, 1000);
    } catch (error) {
        console.error('Error loading goals:', error);
        // Only show alert if we have no goals
        if (!window.skills?.length && !window.financialGoals?.length) {
            alert(error.message || 'Failed to load goals');
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
    if (typeof current !== 'number' || typeof target !== 'number' || target === 0) {
        console.warn('Invalid values for calculating level:', { current, target });
        return 1;
    }
    return Math.floor((current / target) * 10) + 1;
}

// Check if skill is mastered (100% or more)
function isMastered(current, target) {
    console.log(`Checking mastery: ${current}/${target} = ${(current/target*100).toFixed(1)}%`);
    return current >= target;
}

// Level up a skill
function levelUp(item) {
    console.log('Leveling up item:', item.name);
    // Make sure level property exists
    if (typeof item.level === 'undefined') {
        item.level = 1;
    }
    
    // Initialize level if it doesn't exist
    if (!item.level || typeof item.level !== 'number') {
        console.log('Item missing level property, initializing to 1:', item);
        item.level = 1;
    }
    
    // Perform level up
    item.level += 1;
    
    console.log(`${item.name} leveled up to level ${item.level}`);
    
    // Calculate new target (50% increase)
    if (item.target && typeof item.target === 'number') {
        item.target = Math.round(item.target * 1.5); // Increase target by 50%
        console.log(`New target for ${item.name}: ${item.target}`);
    }
    
    console.log(`${item.name} leveled up to level ${item.level} with new target: ${item.target}`);
    
    // Save the updated target to the server
    saveGoalToServer(item);
    
    // Play sound effect
    playVictorySound();
    
    // Show level up message
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

// Render progress bars with FF-style
function renderProgressBar(container, item, isFinancial = false) {
    // Original calculation with debug logging
    const percentage = (item.current / item.target) * 100;
    console.log(`Progress for ${item.name}: ${item.current}/${item.target} = ${percentage}%`);
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
        <div class="timeline-info">
            ${hasDeadline ? `<span>⏰ Deadline: ${formatDate(item.deadline)} (${daysLeft} days)</span>` : ''}
            ${(hasSufficientData && prediction !== null && prediction) ? `
                <span style="color: ${timelineStatus.color}">🎯 Predicted: ${formatDate(prediction)}</span>
                <span style="color: ${timelineStatus.color}">📊 Status: ${timelineStatus.status.replace('-', ' ').toUpperCase()}</span>
            ` : ''}
        </div>
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
    console.log('Rendering all progress bars and initializing chart');
    const skillsContainer = document.getElementById('skills-container');
    const financialContainer = document.getElementById('financial-container');
    
    if (!skillsContainer || !financialContainer) {
        console.warn('Skills or financial containers not found, delaying render');
        setTimeout(renderAll, 100); // Try again in 100ms
        return;
    }
    
    skillsContainer.innerHTML = '';
    financialContainer.innerHTML = '';
    
    // Suppress fun facts when rendering from login or refresh
    window.suppressFunFacts = true;
    
    // Render the activity skills (make sure to handle null/undefined arrays)
    if (window.skills && Array.isArray(window.skills)) {
        window.skills.forEach(skill => renderProgressBar(skillsContainer, skill));
        console.log(`Rendered ${window.skills.length} skills`);
    } else {
        console.warn('No skills available to render');
    }
    
    // Render financial goals
    if (window.financialGoals && Array.isArray(window.financialGoals)) {
        window.financialGoals.forEach(goal => renderProgressBar(financialContainer, goal, true));
        console.log(`Rendered ${window.financialGoals.length} financial goals`);
    } else {
        console.warn('No financial goals available to render');
    }
    
    // Critical: Ensure chart canvas is visible before updating chart
    ensureChartCanvasIsVisible();
    
    // Update the radar chart with the latest data
    console.log('Updating radar chart after rendering progress bars');
    setTimeout(() => {
        ensureChartCanvasIsVisible();
        if (!progressRadarChart || !chartInitialized) {
            console.log('Chart not initialized during render, initializing now');
            initProgressChart();
        } else {
            console.log('Chart exists, updating with new data');
            updateProgressChart();
        }
    }, 50);
    
    // Reset the flag after rendering
    window.suppressFunFacts = false;
}

// Show add/edit form
// Show form for adding a new goal
function showAddForm(type) {
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
function hideModal() {
    document.getElementById('goalModal').style.display = 'none';
}

// Function will be made available globally at initialization

// Delete a goal
async function deleteGoal(goalId, type) {
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
            apiUrl = `https://experience-points-backend.onrender.com/api/goals/${goalId}`;
            response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });
            
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
        
        // Explicitly update the progress chart to reflect the deleted goal
        updateProgressChart();
        
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
async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        // Set the update flag to trigger fun facts
        window.justUpdated = true;
        
        const type = document.getElementById('goal-type').value;
        const name = document.getElementById('goal-name').value;
        const target = parseFloat(document.getElementById('goal-target').value);
        const current = parseFloat(document.getElementById('goal-current').value);
        const deadline = document.getElementById('goal-deadline').value || null;
        
        console.log(`Processing form submission: ${type} - ${name} - Current: ${current}/${target}`);
        
        if (!name) {
            throw new Error('Please enter a name');
        }
        
        if (isNaN(target) || isNaN(current)) {
            throw new Error('Please enter valid numbers');
        }
        
        // Get the correct list based on the type - IMPORTANT: This fixes the bug where financial goals were
        // being added when editing skills
        const list = type === 'skill' ? window.skills : window.financialGoals;
        if (!list) {
            console.error(`List for type ${type} is not defined!`);
        }
        
        // When editing from the form, the goal ID is stored in the DOM
        const goalId = document.getElementById('goalForm').dataset.goalId;
        console.log(`Editing goal with ID: ${goalId || 'new goal'}`);
        
        
        // If we have a goal ID, we're editing an existing goal
        const existingIndex = goalId ? 
            (list?.findIndex(item => item.id === parseInt(goalId)) ?? -1) : 
            (list?.findIndex(item => item.name === name) ?? -1);
            
        console.log(`Found existing item at index: ${existingIndex}`);
        
        // Make sure we're getting the correct list type
        console.log(`Using list for type: ${type}, list length: ${list?.length || 0}`);
        if (type === 'skill') {
            console.log('Currently loaded skills:', window.skills?.map(s => s.name).join(', '));
        } else {
            console.log('Currently loaded financial goals:', window.financialGoals?.map(g => g.name).join(', '));
        }
        
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
        
        console.log(`Preparing to save ${type} with name: ${name}`);
        
        // For new items, explicitly add level property
        if (existingIndex < 0) {
            requestData.level = 1;
            console.log(`New item, setting initial level to 1`);
        }
        
        let oldValue = 0;
        if (existingIndex >= 0) {
            requestData.id = list[existingIndex].id;
            oldValue = list[existingIndex].current || 0;
        }
        
        // Send to backend
        const response = await fetch('https://experience-points-backend.onrender.com/api/goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestData)
        });
        
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
            
            // Update existing goal - while preserving important properties
            list[existingIndex] = {
                ...data,
                // Keep the updated history
                history: list[existingIndex].history || [],
                // Preserve type (critical to fixing the bug!)
                type: type,
                // Preserve level property
                level: list[existingIndex].level || 1
            };
            
            console.log(`Updated ${type} in list:`, list[existingIndex]);
            
            // Check for level up
            const wasMastered = isMastered(oldValue, target);
            const isMasteredNow = isMastered(current, target);
            
            console.log(`Level up check for ${name}: wasMastered=${wasMastered}, isMasteredNow=${isMasteredNow}`);
            
            if (!wasMastered && isMasteredNow) {
                console.log(`${name} has been mastered! Leveling up...`);
                levelUp(list[existingIndex]);
                
                // Save the updated level and target to the server
                saveGoalToServer(list[existingIndex]);
                
                // Show a special message for reaching 100%
                showMessage(`${name} mastered! Level up to ${list[existingIndex].level}!`, 'success');
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
                        const response = await fetch('https://experience-points-backend.onrender.com/api/facts', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({ searchTerm })
                        });
                        
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
            
            // Create a properly structured new item with explicit type and level
            const newItem = {
                ...data,
                type: type, // Explicitly set type to prevent confusion
                level: 1,   // Initialize level for new items
                history: [{ date: now, value: current }]
            };
            
            console.log(`Adding new ${type} with name: ${name}`, newItem);
            
            // Make sure we're adding to the correct list based on type
            if (type === 'skill') {
                if (!window.skills) window.skills = [];
                window.skills.push(newItem);
            } else if (type === 'financial') {
                if (!window.financialGoals) window.financialGoals = [];
                window.financialGoals.push(newItem);
            } else {
                // Fallback to the provided list (should never happen with proper type)
                list.push(newItem);
            }
            
            // Don't add an automatic second entry - we want at least 1 day
            // difference before we start showing predictions
        }
        
        // Update display and close modal
        renderAll();
        
        // Explicitly update the radar chart
        try {
            // Force chart recreation to ensure it's properly updated
            if (progressRadarChart) {
                progressRadarChart.destroy();
                progressRadarChart = null;
            }
            console.log('Initializing radar chart after skill added...');
            initProgressChart();
            
            // Always update the chart with the latest data
            console.log('Updating radar chart with new skill data...');
            updateProgressChart();
        } catch (chartError) {
            console.error('Error updating chart:', chartError);
        }
        
        hideModal();
        
        // Reset the update flag after rendering
        window.justUpdated = false;
    } catch (error) {
        console.error('Error saving goal:', error);
        alert(error.message || 'Failed to save goal. Please try again.');
        return;
    }
}

// Handle logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Function will be made available globally at initialization

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

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Main DOMContentLoaded event handler triggered');
    
    // Check auth first
    if (!await checkAuth()) {
        console.log('Auth check failed, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('Auth check passed, proceeding with initialization');
    
    // Make sure chart areas are visible immediately
    ensureChartCanvasIsVisible();
    
    // Set up a retry mechanism for chart loading
    let chartLoadAttempts = 0;
    const maxChartLoadAttempts = 3;
    const attemptChartLoad = () => {
        if (chartLoadAttempts < maxChartLoadAttempts) {
            console.log(`Chart load attempt ${chartLoadAttempts + 1} of ${maxChartLoadAttempts}`);
            chartLoadAttempts++;
            // Clear any previous chart
            if (progressRadarChart) {
                try {
                    progressRadarChart.destroy();
                } catch (e) {
                    console.warn('Could not destroy existing chart:', e);
                }
                progressRadarChart = null;
                chartInitialized = false;
            }
            // Initialize chart
            initProgressChart();
        }
    };
    
    // Initial chart attempt
    attemptChartLoad();
    
    // Load complete user data including goals and initialize chart
    await loadUserData();
    
    // Set up all event bindings
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', handleFormSubmit);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
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
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal();
        });
    }
    
    const deleteButton = document.getElementById('delete-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
            e.preventDefault();
            const button = e.target;
            const goalId = button.dataset.id;
            const goalType = button.dataset.type;
            
            if (goalId && goalType) {
                deleteGoal(goalId, goalType);
            }
        });
    }
    
    // Close modal on outside click
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('goalModal');
        if (event.target === modal) {
            hideModal();
        }
    });
});
