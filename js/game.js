/**
 * CASE #7734 - Main Game Logic
 * Mobile-First ARG/Escape Room Web Game
 */

// ==================== GAME CONFIGURATION ====================
const CONFIG = {
    INVESTIGATION_TIME: 45 * 60, // 45 minutes in seconds
    CHASE_TIME: 20 * 60, // 20 minutes in seconds
    THIEF_IDENTITY: 'JAY',
    RESORT_NAME: 'Bahia Principe Grand Tulum',
    
    // Penalty settings
    PENALTIES: {
        SECOND_WRONG: 15,
        THIRD_WRONG: 30,
        HINT_COST: 30,
        SKIP_COST: 600 // 10 minutes
    },
    
    // Brute force protection
    RATE_LIMIT: {
        PHASE1_MAX: 10,
        PHASE2_MAX: 8,
        PHASE3_MAX: 5,
        WINDOW: 60 // seconds
    },
    
    // Players for team selection
    PLAYERS: [
        { name: 'Mitch', captain: true },
        { name: 'Melisa', captain: true },
        { name: 'Kishanth', captain: false },
        { name: 'Ashmeen', captain: false },
        { name: 'Joice', captain: false },
        { name: 'Ann', captain: false },
        { name: 'Imaan', captain: false },
        { name: 'Jennifer', captain: false },
        { name: 'Jess', captain: false },
        { name: 'Mervin', captain: false },
        { name: 'Jay', captain: false }
    ],
    
    // Blocked common test answers
    BLOCKED_ANSWERS: ['TEST', 'ANSWER', '123', 'HELLO', 'PASSWORD', 'ADMIN']
};

// ==================== PUZZLE DEFINITIONS ====================
const PUZZLES = {
    // Phase 1 - Dual Location Riddles (both teams need to find their location)
    location1: {
        id: 'location1',
        phase: 1,
        puzzleNumber: null, // Phase 1 uses single hint for the riddle
        title: 'Location 1',
        description: `Two places where North and South will be staying together for the duration of your vacation.`,
        hint: 'Who\'s from the North? Who\'s from the South? Where are they staying?',
        answers: ['611'],
        thiefReaction: 'One location found. Not bad.',
        evidence: 'Location 1 verified'
    },
    
    location2: {
        id: 'location2',
        phase: 1,
        puzzleNumber: null, // Phase 1 uses single hint for the riddle
        title: 'Location 2',
        description: `Two places where North and South will be staying together for the duration of your vacation.`,
        hint: 'Think about where you\'re staying...',
        answers: ['1114'],
        thiefReaction: 'Both locations found. Impressive.',
        evidence: 'Location 2 verified'
    },
    
    // Phase 2 - Triple Threat (any order) - Physical room puzzles
    // puzzleNumber matches the number on the physical puzzle
    puzzle1: {
        id: 'puzzle1',
        phase: 2,
        puzzleNumber: 1,
        title: 'Puzzle 1',
        description: '', // Physical puzzle - no description needed
        hint: 'I like to get funny with my bunny',
        answers: ['SIMBA'],
        thiefReaction: 'One down. Lucky guess.',
        evidence: 'Puzzle 1 solved'
    },
    
    puzzle2: {
        id: 'puzzle2',
        phase: 2,
        puzzleNumber: 2,
        title: 'Puzzle 2',
        description: '', // Physical puzzle - no description needed
        hint: 'These clocks aren\'t telling time...',
        answers: ['516'],
        thiefReaction: 'Another one? Not bad.',
        evidence: 'Puzzle 2 solved'
    },
    
    puzzle3: {
        id: 'puzzle3',
        phase: 2,
        puzzleNumber: 3,
        title: 'Puzzle 3',
        description: '', // Physical puzzle - no description needed
        hint: 'Look at all the places our lovely couple have been to!',
        answers: ['MEXICO'],
        thiefReaction: 'Fine, you got that one too.',
        evidence: 'Puzzle 3 solved'
    },
    
    // Phase 2.5 - Lockbox codes
    lockbox1: {
        id: 'lockbox1',
        phase: 2.5,
        puzzleNumber: 1,
        title: 'Lockbox 1',
        description: '',
        hint: 'From their MCs to their PC',
        answers: ['2717'],
        thiefReaction: null,
        evidence: 'Lockbox 1 opened'
    },
    
    lockbox2: {
        id: 'lockbox2',
        phase: 2.5,
        puzzleNumber: 2,
        title: 'Lockbox 2',
        description: '',
        hint: 'From their MCs to their PC',
        answers: ['1738'],
        thiefReaction: null,
        evidence: 'Lockbox 2 opened'
    },
    
    // Phase 3 - Identity reveal (NO HINT AVAILABLE)
    thiefIdentity: {
        id: 'thiefIdentity',
        phase: 3,
        puzzleNumber: null,
        title: 'The Thief\'s Identity',
        description: `You have all the clues you need to figure out who I am. But do you have the intelligence?

WHO AM I?`,
        hint: null, // No hint for the final puzzle
        answers: ['JAY'],
        thiefReaction: null, // Special handling for final reveal
        evidence: 'Thief identified'
    }
};

// ==================== HINT SYSTEM ====================
// Mapping from physical puzzle numbers to puzzle IDs by phase
const PUZZLE_NUMBER_MAP = {
    phase2: {
        1: 'puzzle1',
        2: 'puzzle2',
        3: 'puzzle3'
    },
    lockbox: {
        1: 'lockbox1',
        2: 'lockbox2'
    }
};

// Get puzzle by number for current phase
function getPuzzleByNumber(number) {
    const phase = gameState.currentPhase;
    const map = PUZZLE_NUMBER_MAP[phase];
    if (!map) return null;
    
    const puzzleId = map[number];
    if (!puzzleId) return null;
    
    return PUZZLES[puzzleId];
}

// Check if hint has been used for a puzzle
function isHintUsed(puzzleId) {
    return gameState.usedHints.includes(puzzleId);
}

// Mark hint as used
function markHintUsed(puzzleId) {
    if (!gameState.usedHints.includes(puzzleId)) {
        gameState.usedHints.push(puzzleId);
        gameState.hintsUsed++;
        saveState();
    }
}

// Get valid puzzle numbers for current phase
function getValidPuzzleNumbers() {
    const phase = gameState.currentPhase;
    const map = PUZZLE_NUMBER_MAP[phase];
    if (!map) return [];
    return Object.keys(map).map(n => parseInt(n));
}

// ==================== GAME PHASES ====================
const PHASES = {
    phase1: {
        id: 'phase1',
        name: 'Find Your Locations',
        puzzles: ['location1', 'location2'],
        unlocked: true,
        thiefMessage: "Each team has a riddle. Solve it, find your location, and enter the code you find there. Both teams must succeed.\n\nUse your phones to communicate with each other. You'll find that you'll need to.",
        isDualPuzzle: true, // Special flag for dual-puzzle display
        showContinue: true, // Show continue button before advancing
        nextPhase: 'phase2'
    },
    phase2: {
        id: 'phase2',
        name: 'Deep Investigation',
        puzzles: ['puzzle1', 'puzzle2', 'puzzle3'],
        unlocked: false,
        thiefMessage: "Congrats. You figured out the riddles I got preschoolers to make.\n\nThere are several puzzles in each room. Some will reveal answers that you must input below to be able to continue.",
        isTriplePuzzle: true, // Special flag for triple input display
        showContinue: true,
        nextPhase: 'lockbox'
    },
    lockbox: {
        id: 'lockbox',
        name: 'The Lockboxes',
        puzzles: ['lockbox1', 'lockbox2'],
        unlocked: false,
        thiefMessage: "I'm impressed you've gotten this far. You're getting close.\n\nYou might have noticed that each room has a lockbox in it. Your riddle to solve these codes are as follows:\n\n\"Two homes come together to form one.\nOne home was built to combine two.\"",
        isLockboxPuzzle: true, // Special flag for lockbox display
        showContinue: true,
        nextPhase: 'phase3'
    },
    phase3: {
        id: 'phase3',
        name: 'Identity Reveal',
        puzzles: ['thiefIdentity'],
        unlocked: false,
        thiefMessage: "You've come far. Too far. Now it's time to unmask me... if you dare.",
        warningFirst: true,
        nextPhase: 'chase'
    }
};

// ==================== THIEF TAUNTS ====================
const TAUNTS = {
    wrongAnswer: [
        "Wrong. Were you even trying?",
        "Ha! Not even close.",
        "Is that really your best guess?",
        "My grandmother could do better.",
        "Strike! You're running out of time.",
        "Tick tock... wrong answer.",
        "Did you just randomly type something?",
        "I'm almost embarrassed for you.",
        "Wrong again? I'm starting to feel bad.",
        "Keep guessing, I have all day. You don't."
    ],
    typo: [
        "So close! But spelling matters, genius.",
        "Almost... but I think you meant something else.",
        "Check your spelling, detective.",
        "Your keyboard betrayed you. Try again.",
        "That's not how you spell it..."
    ],
    blocked: [
        "Really? 'TEST'? I'm insulted.",
        "Come on, put some effort in.",
        "Did you really think that would work?",
        "That's not even a real attempt."
    ],
    duplicate: [
        "You already used that answer!",
        "Try something new, genius.",
        "That puzzle is already solved!",
        "One answer per puzzle. Keep up."
    ],
    penalty: [
        "Another wrong answer? That'll cost you.",
        "Time is slipping away...",
        "Each mistake brings you closer to failure."
    ],
    mercyMode: [
        "Running low on time? I'll go easy... just this once.",
        "You're struggling. How unfortunate.",
        "Time's almost up. Here's a break."
    ]
};

// ==================== GAME STATE ====================
let gameState = {
    currentScreen: 'resort',
    currentPhase: 'phase1',
    investigationTimeLeft: CONFIG.INVESTIGATION_TIME,
    chaseTimeLeft: CONFIG.CHASE_TIME,
    timerActive: false,
    timerExpired: false,
    prizeReduced: false,
    timerStartedAt: null, // Track when timer was started for persistence
    
    // Puzzle tracking
    solvedPuzzles: [],
    currentPuzzleId: null,
    
    // Stats
    wrongAttempts: 0,
    hintsUsed: 0,
    puzzleAttempts: {}, // { puzzleId: count }
    currentPhaseWrongAttempts: 0, // Reset per phase/puzzle
    
    // Hint tracking - which puzzles have had their hints revealed
    usedHints: [], // Array of puzzle IDs that have had hints shown
    
    // Brute force protection
    recentAttempts: [], // timestamps
    
    // Team data
    teams: null,
    teamDivisionMethod: null, // 'gender' or 'random'
    
    // Chase mode
    chaseActive: false,
    capturedPhoto: null
};

// ==================== STATE PERSISTENCE ====================
function saveState() {
    try {
        const saveData = {
            ...gameState,
            savedAt: Date.now()
        };
        localStorage.setItem('caseFile7734', JSON.stringify(saveData));
    } catch (e) {
        console.warn('Failed to save state:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('caseFile7734');
        if (saved) {
            const data = JSON.parse(saved);
            // Check if save is from a recent session (within 24 hours)
            if (Date.now() - data.savedAt < 24 * 60 * 60 * 1000) {
                gameState = { ...gameState, ...data };
                // Clear old rate limit attempts on load - they shouldn't persist
                gameState.recentAttempts = [];
                return true;
            }
        }
    } catch (e) {
        console.warn('Failed to load state:', e);
    }
    return false;
}

function clearState() {
    localStorage.removeItem('caseFile7734');
    location.reload();
}

// ==================== URL PARAMETER HANDLING ====================
function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    
    console.log('🔧 handleURLParams called');
    console.log('🔧 URL params:', window.location.search);
    console.log('🔧 All params:', Object.fromEntries(params.entries()));
    
    // Reset game - clears all state and starts fresh
    if (params.get('reset') === 'true') {
        console.log('🔧 Reset requested');
        localStorage.removeItem('caseFile7734');
        // Remove the reset param and reload
        window.location.href = window.location.pathname;
        return;
    }
    
    // Debug mode
    if (params.get('debug') === 'true') {
        window.DEBUG_MODE = true;
        console.log('🔧 DEBUG MODE ENABLED!');
        console.log('🔧 Puzzles:', PUZZLES);
        console.log('🔧 Answers:', Object.values(PUZZLES).map(p => ({ id: p.id, answers: p.answers })));
        console.log('💡 To reset: add ?reset=true to URL or press Ctrl+Shift+R');
    } else {
        console.log('🔧 Debug mode NOT enabled. debug param =', params.get('debug'));
    }
    
    // Skip intro (debug) - go straight to investigation
    if (params.get('skip') === 'true' || params.get('debug') === 'true') {
        console.log('🔧 Skipping intro screens');
        gameState.currentScreen = 'investigation';
        gameState.timerActive = true;
    }
    
    // Jump to phase
    const phase = params.get('phase');
    console.log('🔧 Phase param:', phase);
    
    if (phase && PHASES[`phase${phase}`]) {
        console.log('🔧 Jumping to phase', phase);
        gameState.currentPhase = `phase${phase}`;
        gameState.currentScreen = 'investigation';
        gameState.timerActive = true;
        
        // Mark previous phases as solved and unlock current
        for (let i = 1; i < parseInt(phase); i++) {
            PHASES[`phase${i}`].puzzles.forEach(pid => {
                if (!gameState.solvedPuzzles.includes(pid)) {
                    gameState.solvedPuzzles.push(pid);
                }
            });
            PHASES[`phase${i}`].unlocked = true;
            console.log('🔧 Unlocked phase', i);
        }
        PHASES[`phase${phase}`].unlocked = true;
        console.log('🔧 Game state after phase jump:', gameState);
    }
    
    // Set custom timer
    const time = params.get('time');
    if (time && !isNaN(parseInt(time))) {
        gameState.investigationTimeLeft = parseInt(time);
    }
    
    // Chase mode join link
    const chase = params.get('chase');
    if (chase) {
        try {
            const data = JSON.parse(atob(chase));
            gameState.chaseActive = true;
            gameState.chaseTimeLeft = data.timeLeft || CONFIG.CHASE_TIME;
            gameState.currentScreen = 'chase';
        } catch (e) {
            console.warn('Invalid chase link');
        }
    }
}

// ==================== PHASE MANAGEMENT ====================
function getCurrentPhase() {
    return PHASES[gameState.currentPhase];
}

function getUnsolvedPuzzles() {
    const phase = getCurrentPhase();
    return phase.puzzles.filter(pid => !gameState.solvedPuzzles.includes(pid));
}

function getCurrentPuzzle() {
    const unsolved = getUnsolvedPuzzles();
    if (unsolved.length === 0) return null;
    
    // For Phase 1 and 3, show the single puzzle
    // For Phase 2, show whichever is current (can be solved in any order)
    gameState.currentPuzzleId = gameState.currentPuzzleId || unsolved[0];
    return PUZZLES[gameState.currentPuzzleId];
}

function advancePhase() {
    const currentPhase = getCurrentPhase();
    const nextPhaseId = currentPhase.nextPhase;
    
    console.log('🔧 advancePhase called, current:', currentPhase.id, 'next:', nextPhaseId);
    
    // Reset wrong attempt counters for new phase
    gameState.currentPhaseWrongAttempts = 0;
    gameState.puzzleAttempts = {}; // Reset per-puzzle attempts
    gameState.recentAttempts = []; // Clear rate limiting for new phase
    
    if (nextPhaseId === 'chase') {
        // Transition to chase mode
        console.log('🔧 Transitioning to chase mode');
        initiateChaseMode();
    } else if (PHASES[nextPhaseId]) {
        PHASES[nextPhaseId].unlocked = true;
        gameState.currentPhase = nextPhaseId;
        gameState.currentPuzzleId = null;
        saveState();
        
        console.log('🔧 Advanced to phase:', nextPhaseId);
        
        // Check for warning screen before phase 3
        if (currentPhase.nextPhase === 'phase3' && PHASES.phase3.warningFirst) {
            showScreen('warning');
        } else {
            updateInvestigationUI();
        }
    } else {
        console.error('🔧 Unknown next phase:', nextPhaseId);
    }
}

// ==================== ANSWER VALIDATION ====================
function normalizeAnswer(answer) {
    return answer.toString()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .trim();
}

function levenshteinDistance(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}

function checkAnswer(input, puzzleId) {
    const normalized = normalizeAnswer(input);
    const puzzle = PUZZLES[puzzleId];
    
    if (!puzzle) return { valid: false, result: 'error' };
    
    // Minimum length check
    if (normalized.length < 2) {
        return { valid: false, result: 'tooShort' };
    }
    
    // Blocked answers
    if (CONFIG.BLOCKED_ANSWERS.includes(normalized)) {
        return { valid: false, result: 'blocked' };
    }
    
    // Check for exact match
    for (const answer of puzzle.answers) {
        if (normalizeAnswer(answer) === normalized) {
            return { valid: true, result: 'correct', puzzle };
        }
    }
    
    // Check for typo (Levenshtein distance = 1)
    for (const answer of puzzle.answers) {
        if (levenshteinDistance(normalizeAnswer(answer), normalized) === 1) {
            return { valid: false, result: 'typo', correctAnswer: answer };
        }
    }
    
    return { valid: false, result: 'wrong' };
}

function checkAgainstAllUnsolved(input) {
    const unsolved = getUnsolvedPuzzles();
    const normalized = normalizeAnswer(input);
    
    // Check if this answer was already used for a solved puzzle
    for (const solvedPuzzleId of gameState.solvedPuzzles) {
        const puzzle = PUZZLES[solvedPuzzleId];
        if (puzzle && puzzle.answers) {
            for (const answer of puzzle.answers) {
                if (normalizeAnswer(answer) === normalized) {
                    return { valid: false, result: 'duplicate', puzzleId: solvedPuzzleId };
                }
            }
        }
    }
    
    // Check against unsolved puzzles
    for (const puzzleId of unsolved) {
        const result = checkAnswer(input, puzzleId);
        if (result.valid || result.result === 'typo') {
            return { ...result, puzzleId };
        }
    }
    
    return { valid: false, result: 'wrong', puzzleId: unsolved[0] };
}

// ==================== BRUTE FORCE PROTECTION ====================
function cleanOldAttempts() {
    const now = Date.now();
    const windowStart = now - CONFIG.RATE_LIMIT.WINDOW * 1000;
    gameState.recentAttempts = gameState.recentAttempts.filter(t => t > windowStart);
}

function recordAttempt() {
    const now = Date.now();
    gameState.recentAttempts.push(now);
    
    // Clean old attempts
    cleanOldAttempts();
}

function isRateLimited() {
    // Always clean old attempts before checking rate limit
    cleanOldAttempts();
    
    const limit = CONFIG.RATE_LIMIT[`PHASE${gameState.currentPhase.replace('phase', '')}_MAX`] || 10;
    return gameState.recentAttempts.length >= limit;
}

function getRateLimitCooldown() {
    if (gameState.recentAttempts.length === 0) return 0;
    const oldest = Math.min(...gameState.recentAttempts);
    const cooldownEnd = oldest + CONFIG.RATE_LIMIT.WINDOW * 1000;
    return Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
}

// ==================== PENALTY SYSTEM ====================
function applyPenalty(type) {
    const inMercyMode = gameState.investigationTimeLeft < 300; // < 5 minutes
    let penalty = 0;
    
    switch (type) {
        case 'secondWrong':
            penalty = inMercyMode ? 5 : CONFIG.PENALTIES.SECOND_WRONG;
            break;
        case 'thirdWrong':
            penalty = inMercyMode ? 10 : CONFIG.PENALTIES.THIRD_WRONG;
            break;
        case 'hint':
            penalty = CONFIG.PENALTIES.HINT_COST;
            break;
        case 'skip':
            penalty = CONFIG.PENALTIES.SKIP_COST;
            break;
    }
    
    gameState.investigationTimeLeft = Math.max(0, gameState.investigationTimeLeft - penalty);
    
    // Show penalty animation
    showTimerPenalty(penalty);
    saveState();
    
    return penalty;
}

// ==================== TEAM MANAGEMENT ====================
function runRandomDraft() {
    const nonCaptains = CONFIG.PLAYERS.filter(p => !p.captain);
    const shuffled = [...nonCaptains].sort(() => Math.random() - 0.5);
    
    const team1 = [CONFIG.PLAYERS.find(p => p.name === 'Mitch')];
    const team2 = [CONFIG.PLAYERS.find(p => p.name === 'Melisa')];
    
    // Alternate picks
    shuffled.forEach((player, index) => {
        if (index % 2 === 0) {
            team1.push(player);
        } else {
            team2.push(player);
        }
    });
    
    return { team1, team2 };
}

function animateDraft(teams) {
    return new Promise((resolve) => {
        const team1List = document.getElementById('team1-list');
        const team2List = document.getElementById('team2-list');
        const draftResults = document.getElementById('draft-results');
        
        team1List.innerHTML = '';
        team2List.innerHTML = '';
        draftResults.classList.remove('hidden');
        
        const allPicks = [];
        
        // Captains first
        allPicks.push({ player: teams.team1[0], team: 1 });
        allPicks.push({ player: teams.team2[0], team: 2 });
        
        // Alternate remaining
        for (let i = 1; i < teams.team1.length; i++) {
            allPicks.push({ player: teams.team1[i], team: 1 });
            if (teams.team2[i]) {
                allPicks.push({ player: teams.team2[i], team: 2 });
            }
        }
        
        let pickIndex = 0;
        
        const addPick = () => {
            if (pickIndex >= allPicks.length) {
                setTimeout(() => {
                    document.getElementById('ready-section').classList.remove('hidden');
                    resolve();
                }, 500);
                return;
            }
            
            const pick = allPicks[pickIndex];
            const li = document.createElement('li');
            li.textContent = pick.player.name + (pick.player.captain ? ' 👑' : '');
            li.className = pick.team === 1 ? 'text-blue-300 slide-in-left' : 'text-pink-300 slide-in-right';
            
            if (pick.team === 1) {
                team1List.appendChild(li);
            } else {
                team2List.appendChild(li);
            }
            
            playSound('draft');
            pickIndex++;
            setTimeout(addPick, 400);
        };
        
        addPick();
    });
}

// ==================== CHASE MODE ====================
function initiateChaseMode() {
    // Pause investigation timer, save remaining time
    gameState.timerActive = false;
    gameState.chaseActive = true;
    gameState.chaseTimeLeft = CONFIG.CHASE_TIME;
    saveState();
    
    // Go to team selection first
    showScreen('teams');
}

function generateChaseLink() {
    const data = {
        timeLeft: gameState.chaseTimeLeft,
        startTime: Date.now()
    };
    const encoded = btoa(JSON.stringify(data));
    return `${window.location.origin}${window.location.pathname}?chase=${encoded}`;
}

// ==================== STATS CALCULATION ====================
function calculateStats() {
    const timeLeft = gameState.investigationTimeLeft;
    const totalPuzzles = Object.keys(PUZZLES).length;
    const solvedCount = gameState.solvedPuzzles.length;
    const wrongAttempts = gameState.wrongAttempts;
    const hintsUsed = gameState.hintsUsed;
    const isPerfect = wrongAttempts === 0 && hintsUsed === 0;
    
    // Bonus calculation based on time remaining
    let bonus = 1.0;
    if (timeLeft > 30 * 60) bonus = 2.0; // > 30 min = 2x
    else if (timeLeft > 20 * 60) bonus = 1.75; // > 20 min = 1.75x
    else if (timeLeft > 10 * 60) bonus = 1.5; // > 10 min = 1.5x
    else if (timeLeft > 5 * 60) bonus = 1.25; // > 5 min = 1.25x
    
    if (isPerfect) bonus += 0.5; // Perfect run bonus
    if (gameState.prizeReduced) bonus *= 0.5; // Timer expired penalty
    
    return {
        timeLeft,
        solvedCount,
        totalPuzzles,
        wrongAttempts,
        hintsUsed,
        isPerfect,
        bonus: bonus.toFixed(2)
    };
}

// ==================== INITIALIZATION ====================
function initGame() {
    // Handle URL params first (may modify gameState)
    handleURLParams();
    
    // Store URL-modified state
    const urlScreen = gameState.currentScreen;
    const urlTimerActive = gameState.timerActive;
    const urlPhase = gameState.currentPhase;
    const urlSolvedPuzzles = [...gameState.solvedPuzzles];
    
    // Try to load saved state
    const savedExists = loadState();
    
    console.log('🔧 initGame - savedExists:', savedExists, 'timerActive:', gameState.timerActive, 'screen:', gameState.currentScreen);
    
    // URL params should override saved state
    if (window.DEBUG_MODE || urlScreen === 'investigation') {
        gameState.currentScreen = urlScreen;
        gameState.timerActive = urlTimerActive;
        gameState.currentPhase = urlPhase;
        gameState.solvedPuzzles = urlSolvedPuzzles;
        console.log('🔧 URL params overriding saved state');
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Determine starting screen - KEY FIX: If game was in progress, skip intro!
    if (gameState.chaseActive) {
        // Chase mode in progress
        showScreen('chase');
        startChaseTimer();
    } else if (savedExists && gameState.timerActive && gameState.investigationTimeLeft > 0 && gameState.investigationTimeLeft < CONFIG.INVESTIGATION_TIME) {
        // Game was in progress (timer started and time has elapsed) - skip intro, resume investigation
        console.log('🔧 Resuming in-progress game, skipping intro');
        showScreen('investigation');
        startInvestigationTimer();
    } else if (gameState.currentScreen === 'investigation') {
        // URL params or saved state wants investigation
        showScreen('investigation');
        if (gameState.timerActive) {
            startInvestigationTimer();
        }
    } else if (savedExists && gameState.currentScreen !== 'resort' && gameState.currentScreen !== 'thief-intro') {
        // Resume from saved state (not intro screens)
        showScreen(gameState.currentScreen);
        if (gameState.timerActive) {
            startInvestigationTimer();
        }
    } else if (savedExists && gameState.solvedPuzzles.length > 0) {
        // Player has solved puzzles but ended up on intro - resume investigation
        console.log('🔧 Player has progress, resuming investigation');
        showScreen('investigation');
        if (gameState.timerActive || gameState.investigationTimeLeft < CONFIG.INVESTIGATION_TIME) {
            gameState.timerActive = true;
            startInvestigationTimer();
        }
    } else {
        // Fresh start
        showScreen('resort');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);

// Keyboard shortcut for reset (Ctrl+Shift+R)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (confirm('Reset the game and start over?')) {
            localStorage.removeItem('caseFile7734');
            window.location.href = window.location.pathname;
        }
    }
});

// Export for other modules
window.GameEngine = {
    CONFIG,
    PUZZLES,
    PHASES,
    TAUNTS,
    PUZZLE_NUMBER_MAP,
    gameState,
    saveState,
    loadState,
    clearState,
    checkAnswer,
    checkAgainstAllUnsolved,
    normalizeAnswer,
    applyPenalty,
    getCurrentPhase,
    getUnsolvedPuzzles,
    getCurrentPuzzle,
    advancePhase,
    isRateLimited,
    getRateLimitCooldown,
    recordAttempt,
    runRandomDraft,
    animateDraft,
    generateChaseLink,
    calculateStats,
    initiateChaseMode,
    // Hint system
    getPuzzleByNumber,
    isHintUsed,
    markHintUsed,
    getValidPuzzleNumbers
};
