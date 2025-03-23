// Sound functions for the application
export function playLevelUpSound() {
    try {
        const audio = new Audio('sounds/level-up.mp3');
        audio.play();
    } catch (error) {
        console.error('Error playing level up sound:', error);
    }
}

export function playVictorySound() {
    try {
        const audio = new Audio('sounds/victory.mp3');
        audio.play();
    } catch (error) {
        console.error('Error playing victory sound:', error);
    }
}
