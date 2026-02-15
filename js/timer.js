/**
 * Timer System for Case #7734
 * Handles investigation and chase countdown timers
 */

let investigationInterval = null;
let chaseInterval = null;

// ==================== TIMER DISPLAY ====================
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;
    
    const { gameState } = window.GameEngine;
    const timeLeft = gameState.investigationTimeLeft;
    
    display.textContent = formatTime(timeLeft);
    
    // Warning state (< 5 minutes)
    if (timeLeft <= 300) {
        display.classList.add('timer-warning');
    } else {
        display.classList.remove('timer-warning');
    }
    
    // Critical state (< 1 minute)
    if (timeLeft <= 60) {
        display.classList.add('text-thief-red');
    }
}

function updateChaseTimerDisplay() {
    const display = document.getElementById('chase-timer');
    if (!display) return;
    
    const { gameState } = window.GameEngine;
    display.textContent = formatTime(gameState.chaseTimeLeft);
    
    // Warning state (< 5 minutes)
    if (gameState.chaseTimeLeft <= 300) {
        display.classList.add('timer-warning');
    } else {
        display.classList.remove('timer-warning');
    }
}

// ==================== INVESTIGATION TIMER ====================
function startInvestigationTimer() {
    const { gameState, saveState } = window.GameEngine;
    
    if (investigationInterval) {
        clearInterval(investigationInterval);
    }
    
    gameState.timerActive = true;
    saveState();
    
    investigationInterval = setInterval(() => {
        if (!gameState.timerActive) {
            clearInterval(investigationInterval);
            return;
        }
        
        gameState.investigationTimeLeft--;
        updateTimerDisplay();
        
        // Auto-save every 10 seconds
        if (gameState.investigationTimeLeft % 10 === 0) {
            saveState();
        }
        
        // Time's up
        if (gameState.investigationTimeLeft <= 0) {
            clearInterval(investigationInterval);
            gameState.timerActive = false;
            gameState.timerExpired = true;
            gameState.prizeReduced = true;
            saveState();
            showScreen('timesup');
            playSound('timesup');
        }
        
        // Warning sounds
        if (gameState.investigationTimeLeft === 300) {
            playSound('warning');
        }
        if (gameState.investigationTimeLeft === 60) {
            playSound('critical');
        }
        if (gameState.investigationTimeLeft <= 10 && gameState.investigationTimeLeft > 0) {
            playSound('tick');
        }
        
    }, 1000);
}

function pauseInvestigationTimer() {
    const { gameState, saveState } = window.GameEngine;
    
    if (investigationInterval) {
        clearInterval(investigationInterval);
        investigationInterval = null;
    }
    
    gameState.timerActive = false;
    saveState();
}

function resumeInvestigationTimer() {
    const { gameState } = window.GameEngine;
    
    if (!gameState.timerExpired && gameState.investigationTimeLeft > 0) {
        startInvestigationTimer();
    }
}

// ==================== CHASE TIMER ====================
function startChaseTimer() {
    const { gameState, saveState } = window.GameEngine;
    
    if (chaseInterval) {
        clearInterval(chaseInterval);
    }
    
    chaseInterval = setInterval(() => {
        gameState.chaseTimeLeft--;
        updateChaseTimerDisplay();
        
        // Auto-save every 10 seconds
        if (gameState.chaseTimeLeft % 10 === 0) {
            saveState();
        }
        
        // Time's up
        if (gameState.chaseTimeLeft <= 0) {
            clearInterval(chaseInterval);
            // Chase time expired - thief got away
            showVictoryScreen(true); // Partial victory
            playSound('timesup');
        }
        
        // Warning sounds
        if (gameState.chaseTimeLeft === 300) {
            playSound('warning');
        }
        if (gameState.chaseTimeLeft <= 10 && gameState.chaseTimeLeft > 0) {
            playSound('tick');
        }
        
    }, 1000);
}

function pauseChaseTimer() {
    if (chaseInterval) {
        clearInterval(chaseInterval);
        chaseInterval = null;
    }
}

// ==================== TIMER PENALTY ANIMATION ====================
function showTimerPenalty(seconds) {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;
    
    // Add shake effect
    timerDisplay.classList.add('shake', 'penalty-flash');
    
    // Create floating penalty text
    const penalty = document.createElement('span');
    penalty.className = 'timer-deduct';
    penalty.textContent = `-${seconds}s`;
    penalty.style.left = timerDisplay.offsetLeft + 'px';
    penalty.style.top = timerDisplay.offsetTop + 'px';
    
    timerDisplay.parentElement.style.position = 'relative';
    timerDisplay.parentElement.appendChild(penalty);
    
    // Play penalty sound
    playSound('penalty');
    
    // Remove effects after animation
    setTimeout(() => {
        timerDisplay.classList.remove('shake', 'penalty-flash');
        penalty.remove();
    }, 1000);
    
    // Update display immediately
    updateTimerDisplay();
}

// ==================== TIMER BONUS ANIMATION ====================
function showTimerBonus(seconds) {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;
    
    // Add success flash
    timerDisplay.classList.add('success-flash');
    
    // Create floating bonus text
    const bonus = document.createElement('span');
    bonus.className = 'timer-deduct';
    bonus.style.color = '#00ff88';
    bonus.textContent = `+${seconds}s`;
    bonus.style.left = timerDisplay.offsetLeft + 'px';
    bonus.style.top = timerDisplay.offsetTop + 'px';
    
    timerDisplay.parentElement.style.position = 'relative';
    timerDisplay.parentElement.appendChild(bonus);
    
    // Remove effects after animation
    setTimeout(() => {
        timerDisplay.classList.remove('success-flash');
        bonus.remove();
    }, 1000);
    
    updateTimerDisplay();
}

// ==================== COUNTDOWN ANIMATION (3-2-1) ====================
function runCountdown(callback) {
    const overlay = document.getElementById('countdown-overlay');
    const numberEl = document.getElementById('countdown-number');
    
    if (!overlay || !numberEl) {
        callback();
        return;
    }
    
    overlay.classList.remove('hidden');
    let count = 3;
    
    const tick = () => {
        numberEl.textContent = count;
        numberEl.className = 'text-white font-mono text-9xl font-bold countdown-pop';
        
        playSound('countdown');
        
        if (count === 0) {
            numberEl.textContent = 'GO!';
            numberEl.className = 'text-thief-neon font-mono text-7xl font-bold countdown-pop';
            playSound('start');
            
            setTimeout(() => {
                overlay.classList.add('hidden');
                callback();
            }, 500);
        } else {
            count--;
            setTimeout(tick, 1000);
        }
    };
    
    tick();
}

// ==================== EXPORTS ====================
window.TimerSystem = {
    formatTime,
    updateTimerDisplay,
    updateChaseTimerDisplay,
    startInvestigationTimer,
    pauseInvestigationTimer,
    resumeInvestigationTimer,
    startChaseTimer,
    pauseChaseTimer,
    showTimerPenalty,
    showTimerBonus,
    runCountdown
};

// Also expose globally for easy access
window.startInvestigationTimer = startInvestigationTimer;
window.pauseInvestigationTimer = pauseInvestigationTimer;
window.startChaseTimer = startChaseTimer;
window.showTimerPenalty = showTimerPenalty;
window.runCountdown = runCountdown;
