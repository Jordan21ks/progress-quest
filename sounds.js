// Sound functions for the application
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

// Make functions globally available
if (typeof window !== 'undefined') {
    window.playLevelUpSound = playLevelUpSound;
    window.playVictorySound = playVictorySound;
}
