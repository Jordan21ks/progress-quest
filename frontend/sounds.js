// Sound URLs - using short, base64-encoded WAV files for instant loading
const MENU_SOUND = 'data:audio/wav;base64,UklGRpQHAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YXAHAACAPwAAgD+AAAA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/';

const LEVEL_UP_SOUND = 'data:audio/wav;base64,UklGRpQHAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YXAHAACAPwAAAAAAAIA/AAAAAAAAgD8AAAAAAACAPwAAAAAAAIA/AAAAAAAAgD8AAAAAAACAPwAAAAAAAIA/AAAAAAAAgD8AAAAAAACAPwAAAAAAAIA/AAAAAAAAgD8AAAAAAACAPwAAAAAAAIA/AAAAAAAAgD8AAAAAAACAPwAAAAAAAIA/AAAAAA==';

const VICTORY_SOUND = 'data:audio/wav;base64,UklGRpQHAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YXAHAACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/';

// Create Audio objects
const menuSound = new Audio(MENU_SOUND);
const levelUpSound = new Audio(LEVEL_UP_SOUND);
const victorySound = new Audio(VICTORY_SOUND);

// Configure sounds
menuSound.volume = 0.3;
levelUpSound.volume = 0.5;
victorySound.volume = 0.7;

// Export sound functions
export function playMenuSound() {
    menuSound.currentTime = 0;
    menuSound.play().catch(e => console.log('Menu sound failed:', e));
}

export function playLevelUpSound() {
    levelUpSound.currentTime = 0;
    levelUpSound.play().catch(e => console.log('Level up sound failed:', e));
}

export function playVictorySound() {
    victorySound.currentTime = 0;
    victorySound.play().catch(e => console.log('Victory sound failed:', e));
}
