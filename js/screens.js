/**
 * Screen Management for Case #7734
 * Handles screen transitions, UI updates, and event listeners
 */

// ==================== SCREEN MANAGEMENT ====================
function showScreen(screenId) {
    console.log('showScreen called:', screenId);
    
    // Defensive check for GameEngine
    if (!window.GameEngine) {
        console.error('GameEngine not loaded yet!');
        return;
    }
    
    const { gameState, saveState } = window.GameEngine;
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('fade-in');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        
        // Trigger fade-in animation
        requestAnimationFrame(() => {
            targetScreen.classList.add('fade-in');
        });
        
        // Update state
        gameState.currentScreen = screenId;
        saveState();
        
        // Screen-specific initialization
        initializeScreen(screenId);
    }
}

function initializeScreen(screenId) {
    switch (screenId) {
        case 'resort':
            // Nothing special needed
            break;
            
        case 'thief-intro':
            startThiefIntro();
            break;
            
        case 'investigation':
            updateInvestigationUI();
            break;
            
        case 'warning':
            // Warning screen - nothing special
            break;
            
        case 'teams':
            // Team selection screen
            break;
            
        case 'chase':
            initChaseMode();
            break;
            
        case 'victory':
            showVictoryStats();
            break;
            
        case 'timesup':
            // Time's up screen
            break;
    }
}

// ==================== THIEF INTRODUCTION ====================
let thiefTyped = null;

function startThiefIntro() {
    const messageContainer = document.getElementById('thief-message');
    const beginButton = document.getElementById('btn-begin-game');
    const terminalContent = document.querySelector('.terminal-content');
    
    if (!messageContainer || !terminalContent) return;
    
    // Clear any existing typed instance
    if (thiefTyped) {
        thiefTyped.destroy();
    }
    
    messageContainer.innerHTML = '';
    beginButton.classList.add('hidden');
    
    // Hide terminal content initially, show connecting screen
    terminalContent.innerHTML = `
        <div id="connecting-screen" class="flex flex-col items-center justify-center" style="height: 100%;">
            <div class="spinner mb-md"></div>
            <p class="text-accent font-mono text-sm">Establishing secure connection...</p>
        </div>
    `;
    
    // Connection sequence with delays
    const connectionSequence = [
        { delay: 1500, text: '> Scanning frequencies...' },
        { delay: 1000, text: '> Encrypted channel detected' },
        { delay: 800, text: '> Initiating handshake...' },
        { delay: 1200, text: '> Connection established.' },
        { delay: 600, text: '> Incoming message from: <span class="text-danger font-bold">UNKNOWN</span>' }
    ];
    
    // Start the connection animation after initial delay
    setTimeout(() => {
        // Replace connecting screen with terminal output
        terminalContent.innerHTML = '';
        
        let totalDelay = 0;
        
        connectionSequence.forEach((step, index) => {
            totalDelay += step.delay;
            
            setTimeout(() => {
                const line = document.createElement('p');
                line.className = 'text-muted text-sm terminal-line';
                line.innerHTML = step.text;
                line.style.opacity = '0';
                terminalContent.appendChild(line);
                
                // Fade in the line
                requestAnimationFrame(() => {
                    line.style.transition = 'opacity 0.3s ease';
                    line.style.opacity = '1';
                });
                
                // Play a subtle tick sound
                playSound('tick');
                
                // After last connection line, start the thief message
                if (index === connectionSequence.length - 1) {
                    setTimeout(() => {
                        startThiefMessage(terminalContent, messageContainer, beginButton);
                    }, 800);
                }
            }, totalDelay);
        });
    }, 1000);
}

// Thief messages for multi-step intro
const THIEF_MESSAGES = [
    `Well, well, well... The happy couple and their intellectually camoflauged band of baboons have decided to accept my challenge. This will be most interesting.`,
    
    `I chose you all to try to find what I've stolen and figure out who I am because I'm in need of some entertainment. I find it hilarious watching people who have to share a brain cell try to solve my puzzles.

Let's see if you guys can even figure out where you're supposed to be...`,
    
    `There are 2 locations so split yourselves up accordingly. Let's make the future bride and groom the captains. You're still working together, but let's see how long that cooperation lasts...

Girls vs Guys, run your own draft, or let me generate teams. Make it quick, I'm not known for my patience.`
];

let currentMessageIndex = 0;

function startThiefMessage(terminalContent, messageContainer, beginButton) {
    // Add spacing before the thief message
    const spacer = document.createElement('div');
    spacer.style.marginTop = '1.5rem';
    terminalContent.appendChild(spacer);
    terminalContent.appendChild(messageContainer);
    
    // Reset message index
    currentMessageIndex = 0;
    
    // Show first message
    showThiefIntroMessage(messageContainer, beginButton);
}

function showThiefIntroMessage(messageContainer, beginButton) {
    // Clear previous content
    messageContainer.innerHTML = '';
    
    // Clear any existing typed instance
    if (thiefTyped) {
        thiefTyped.destroy();
    }
    
    const message = THIEF_MESSAGES[currentMessageIndex];
    const isLastMessage = currentMessageIndex === THIEF_MESSAGES.length - 1;
    
    let typingComplete = false;
    
    thiefTyped = new Typed(messageContainer, {
        strings: [message],
        typeSpeed: 15, // Faster typing
        showCursor: true,
        cursorChar: '█',
        onComplete: () => {
            typingComplete = true;
            // Show appropriate button based on message
            if (isLastMessage) {
                // Last message: show Continue + Generate Teams buttons
                showTeamSelectionButtons(messageContainer, beginButton);
            } else {
                // Show Continue button
                showContinueButton(messageContainer, beginButton);
            }
            playSound('reveal');
        }
    });
    
    // Add tap/click to skip typing animation
    const skipHandler = (e) => {
        if (!typingComplete && thiefTyped) {
            e.preventDefault();
            e.stopPropagation();
            
            // Complete the typing immediately
            thiefTyped.stop();
            messageContainer.innerHTML = message;
            typingComplete = true;
            
            // Destroy typed instance
            thiefTyped.destroy();
            thiefTyped = null;
            
            // Show appropriate buttons
            if (isLastMessage) {
                showTeamSelectionButtons(messageContainer, beginButton);
            } else {
                showContinueButton(messageContainer, beginButton);
            }
            playSound('reveal');
            
            // Remove this handler
            document.removeEventListener('click', skipHandler, true);
            document.removeEventListener('touchstart', skipHandler, true);
        }
    };
    
    // Add skip listener after a small delay to prevent immediate triggering
    setTimeout(() => {
        document.addEventListener('click', skipHandler, true);
        document.addEventListener('touchstart', skipHandler, true);
        
        // Clean up listener when typing completes
        const cleanup = setInterval(() => {
            if (typingComplete) {
                document.removeEventListener('click', skipHandler, true);
                document.removeEventListener('touchstart', skipHandler, true);
                clearInterval(cleanup);
            }
        }, 100);
    }, 500);
}

function showContinueButton(messageContainer, beginButton) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mt-md';
    buttonContainer.innerHTML = `
        <button id="btn-thief-continue" class="btn btn-primary fade-in">
            Continue
        </button>
    `;
    messageContainer.parentElement.appendChild(buttonContainer);
    
    document.getElementById('btn-thief-continue').addEventListener('click', () => {
        playSound('click');
        buttonContainer.remove();
        
        // Clear the connection lines to free up space after first message
        const terminalContent = document.querySelector('.terminal-content');
        if (terminalContent && currentMessageIndex === 0) {
            // Remove all children except the message container
            const children = Array.from(terminalContent.children);
            children.forEach(child => {
                if (!child.contains(messageContainer) && child !== messageContainer) {
                    child.remove();
                }
            });
        }
        
        currentMessageIndex++;
        showThiefIntroMessage(messageContainer, beginButton);
    });
}

function showTeamSelectionButtons(messageContainer, beginButton) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mt-md';
    buttonContainer.innerHTML = `
        <div class="flex gap-sm flex-col">
            <button id="btn-manual-teams" class="btn btn-primary fade-in">
                Continue (Manual Teams)
            </button>
            <button id="btn-generate-teams" class="btn btn-ghost fade-in">
                🎲 Generate Teams For Us
            </button>
        </div>
    `;
    messageContainer.parentElement.appendChild(buttonContainer);
    
    // Manual teams - go straight to investigation
    document.getElementById('btn-manual-teams').addEventListener('click', () => {
        playSound('start');
        showScreen('investigation');
        startInvestigationTimer();
    });
    
    // Generate teams - show mocking message then teams
    document.getElementById('btn-generate-teams').addEventListener('click', () => {
        playSound('click');
        buttonContainer.remove();
        showGeneratedTeams(messageContainer, beginButton);
    });
}

function showGeneratedTeams(messageContainer, beginButton) {
    // Clear previous content
    messageContainer.innerHTML = '';
    
    // Clear any existing typed instance
    if (thiefTyped) {
        thiefTyped.destroy();
    }
    
    // Generate the teams
    const teams = window.GameEngine.runRandomDraft();
    window.GameEngine.gameState.teams = teams;
    window.GameEngine.gameState.teamDivisionMethod = 'random';
    window.GameEngine.saveState();
    
    const mockingMessage = `I knew the wheels were spinning but all the hamsters have died. Couldn't even make teams for yourselves. Well here are your teams:`;
    
    thiefTyped = new Typed(messageContainer, {
        strings: [mockingMessage],
        typeSpeed: 15,
        showCursor: true,
        cursorChar: '█',
        onComplete: () => {
            // Show teams display
            const teamsDisplay = document.createElement('div');
            teamsDisplay.className = 'mt-md fade-in';
            teamsDisplay.innerHTML = `
                <div class="team-grid" style="margin-bottom: 1rem;">
                    <div class="team-card team-blue">
                        <h4 class="font-bold" style="color: #60a5fa;">Team Mitch 👑</h4>
                        <ul class="text-sm" style="list-style: none; margin-top: 0.5rem;">
                            ${teams.team1.map(p => `<li class="text-blue-300">${p.name}${p.captain ? ' 👑' : ''}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="team-card team-pink">
                        <h4 class="font-bold" style="color: #f472b6;">Team Melisa 👑</h4>
                        <ul class="text-sm" style="list-style: none; margin-top: 0.5rem;">
                            ${teams.team2.map(p => `<li class="text-pink-300">${p.name}${p.captain ? ' 👑' : ''}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <button id="btn-teams-continue" class="btn btn-success fade-in">
                    Continue to Puzzle
                </button>
            `;
            messageContainer.parentElement.appendChild(teamsDisplay);
            
            document.getElementById('btn-teams-continue').addEventListener('click', () => {
                playSound('start');
                showScreen('investigation');
                startInvestigationTimer();
            });
            
            playSound('reveal');
        }
    });
}

// ==================== INVESTIGATION UI ====================
function updateInvestigationUI() {
    const { gameState, getCurrentPhase, getUnsolvedPuzzles, getCurrentPuzzle, PUZZLES } = window.GameEngine;
    
    const phase = getCurrentPhase();
    const unsolved = getUnsolvedPuzzles();
    const puzzle = getCurrentPuzzle();
    
    // Update thief message
    const thiefMessageEl = document.getElementById('current-thief-message');
    if (thiefMessageEl) {
        thiefMessageEl.textContent = phase.thiefMessage;
    }
    
    // Update puzzle content
    const puzzleContent = document.getElementById('puzzle-content');
    if (puzzleContent) {
        // Check if this is a dual-puzzle phase (Phase 1 with 2 locations)
        if (phase.isDualPuzzle) {
            const location1 = PUZZLES['location1'];
            const location2 = PUZZLES['location2'];
            const loc1Solved = gameState.solvedPuzzles.includes('location1');
            const loc2Solved = gameState.solvedPuzzles.includes('location2');
            const allSolved = loc1Solved && loc2Solved;
            
            puzzleContent.innerHTML = `
                <!-- Shared riddle above both cards -->
                <div class="riddle-box mb-md">
                    <p class="text-accent text-sm font-mono italic text-center">
                        "${location1.description}"
                    </p>
                </div>
                
                <div class="dual-puzzle-grid">
                    <!-- Location 1 -->
                    <div class="puzzle-card ${loc1Solved ? 'solved' : ''}">
                        <div class="puzzle-card-header">
                            <span class="puzzle-label">📍 LOCATION 1</span>
                            ${loc1Solved ? '<span class="solved-badge">✓ VERIFIED</span>' : ''}
                        </div>
                        ${!loc1Solved ? `
                            <div class="puzzle-input-group mt-sm">
                                <input type="text" id="input-location1" class="input input-sm" placeholder="Enter code..." autocomplete="off">
                                <button id="btn-submit-location1" class="btn btn-primary btn-sm">✓</button>
                            </div>
                            <p id="feedback-location1" class="feedback-text text-xs"></p>
                        ` : ''}
                    </div>
                    
                    <!-- Location 2 -->
                    <div class="puzzle-card ${loc2Solved ? 'solved' : ''}">
                        <div class="puzzle-card-header">
                            <span class="puzzle-label">📍 LOCATION 2</span>
                            ${loc2Solved ? '<span class="solved-badge">✓ VERIFIED</span>' : ''}
                        </div>
                        ${!loc2Solved ? `
                            <div class="puzzle-input-group mt-sm">
                                <input type="text" id="input-location2" class="input input-sm" placeholder="Enter code..." autocomplete="off">
                                <button id="btn-submit-location2" class="btn btn-primary btn-sm">✓</button>
                            </div>
                            <p id="feedback-location2" class="feedback-text text-xs"></p>
                        ` : ''}
                    </div>
                </div>
                
                <div class="progress-indicator mt-md text-center">
                    <span class="text-muted text-sm">Locations Verified: </span>
                    <span class="font-bold ${allSolved ? 'text-success' : 'text-warning'}">
                        ${(loc1Solved ? 1 : 0) + (loc2Solved ? 1 : 0)}/2
                    </span>
                </div>
                
                ${allSolved && phase.showContinue ? `
                    <button id="btn-continue-phase" class="btn btn-success mt-md">
                        Continue →
                    </button>
                ` : ''}
            `;
            
            // Add event listeners for dual inputs
            setupDualPuzzleInputs();
            
            // Add continue button listener if shown
            if (allSolved && phase.showContinue) {
                setupContinueButton();
            }
            
        } else if (phase.isTriplePuzzle) {
            // Phase 2 - Triple puzzle input display
            const p1Solved = gameState.solvedPuzzles.includes('puzzle1');
            const p2Solved = gameState.solvedPuzzles.includes('puzzle2');
            const p3Solved = gameState.solvedPuzzles.includes('puzzle3');
            const solvedCount = (p1Solved ? 1 : 0) + (p2Solved ? 1 : 0) + (p3Solved ? 1 : 0);
            const allSolved = solvedCount === 3;
            
            puzzleContent.innerHTML = `
                <div class="triple-puzzle-grid">
                    <!-- Puzzle 1 -->
                    <div class="puzzle-input-card ${p1Solved ? 'solved' : ''}">
                        <div class="puzzle-card-header">
                            <span class="puzzle-label">📍 PUZZLE 1</span>
                            ${p1Solved ? '<span class="solved-badge">✓</span>' : ''}
                        </div>
                        ${!p1Solved ? `
                            <div class="triple-input-row">
                                <input type="text" id="input-puzzle1" class="triple-input" placeholder="Enter answer..." autocomplete="off">
                                <button id="btn-submit-puzzle1" class="triple-submit-btn">✓</button>
                            </div>
                            <p id="feedback-puzzle1" class="feedback-text text-xs"></p>
                        ` : '<p class="text-success text-sm">✓ Solved</p>'}
                    </div>
                    
                    <!-- Puzzle 2 -->
                    <div class="puzzle-input-card ${p2Solved ? 'solved' : ''}">
                        <div class="puzzle-card-header">
                            <span class="puzzle-label">📍 PUZZLE 2</span>
                            ${p2Solved ? '<span class="solved-badge">✓</span>' : ''}
                        </div>
                        ${!p2Solved ? `
                            <div class="triple-input-row">
                                <input type="text" id="input-puzzle2" class="triple-input" placeholder="Enter answer..." autocomplete="off">
                                <button id="btn-submit-puzzle2" class="triple-submit-btn">✓</button>
                            </div>
                            <p id="feedback-puzzle2" class="feedback-text text-xs"></p>
                        ` : '<p class="text-success text-sm">✓ Solved</p>'}
                    </div>
                    
                    <!-- Puzzle 3 -->
                    <div class="puzzle-input-card ${p3Solved ? 'solved' : ''}">
                        <div class="puzzle-card-header">
                            <span class="puzzle-label">📍 PUZZLE 3</span>
                            ${p3Solved ? '<span class="solved-badge">✓</span>' : ''}
                        </div>
                        ${!p3Solved ? `
                            <div class="triple-input-row">
                                <input type="text" id="input-puzzle3" class="triple-input" placeholder="Enter answer..." autocomplete="off">
                                <button id="btn-submit-puzzle3" class="triple-submit-btn">✓</button>
                            </div>
                            <p id="feedback-puzzle3" class="feedback-text text-xs"></p>
                        ` : '<p class="text-success text-sm">✓ Solved</p>'}
                    </div>
                </div>
                
                <div class="progress-indicator mt-md text-center">
                    <span class="text-muted text-sm">Evidence Collected: </span>
                    <span class="font-bold ${allSolved ? 'text-success' : 'text-warning'}">
                        ${solvedCount}/3
                    </span>
                </div>
                
                ${allSolved && phase.showContinue ? `
                    <button id="btn-continue-phase" class="btn btn-success mt-md">
                        Continue →
                    </button>
                ` : ''}
            `;
            
            // Add event listeners for triple inputs
            setupTriplePuzzleInputs();
            
            // Add continue button listener if shown
            if (allSolved && phase.showContinue) {
                setupContinueButton();
            }
            
        } else if (phase.isLockboxPuzzle) {
            // Lockbox phase - 2 code inputs
            const lb1Solved = gameState.solvedPuzzles.includes('lockbox1');
            const lb2Solved = gameState.solvedPuzzles.includes('lockbox2');
            const allSolved = lb1Solved && lb2Solved;
            
            puzzleContent.innerHTML = `
                <div class="dual-puzzle-grid">
                    <!-- Lockbox 1 -->
                    <div class="puzzle-card ${lb1Solved ? 'solved' : ''}">
                        <div class="puzzle-card-header">
                            <span class="puzzle-label">🔐 LOCKBOX 1</span>
                            ${lb1Solved ? '<span class="solved-badge">✓ OPENED</span>' : ''}
                        </div>
                        ${!lb1Solved ? `
                            <div class="puzzle-input-group mt-sm">
                                <input type="text" id="input-lockbox1" class="input input-sm" placeholder="Enter code..." autocomplete="off" inputmode="numeric">
                                <button id="btn-submit-lockbox1" class="btn btn-primary btn-sm">✓</button>
                            </div>
                            <p id="feedback-lockbox1" class="feedback-text text-xs"></p>
                        ` : ''}
                    </div>
                    
                    <!-- Lockbox 2 -->
                    <div class="puzzle-card ${lb2Solved ? 'solved' : ''}">
                        <div class="puzzle-card-header">
                            <span class="puzzle-label">🔐 LOCKBOX 2</span>
                            ${lb2Solved ? '<span class="solved-badge">✓ OPENED</span>' : ''}
                        </div>
                        ${!lb2Solved ? `
                            <div class="puzzle-input-group mt-sm">
                                <input type="text" id="input-lockbox2" class="input input-sm" placeholder="Enter code..." autocomplete="off" inputmode="numeric">
                                <button id="btn-submit-lockbox2" class="btn btn-primary btn-sm">✓</button>
                            </div>
                            <p id="feedback-lockbox2" class="feedback-text text-xs"></p>
                        ` : ''}
                    </div>
                </div>
                
                <div class="progress-indicator mt-md text-center">
                    <span class="text-muted text-sm">Lockboxes Opened: </span>
                    <span class="font-bold ${allSolved ? 'text-success' : 'text-warning'}">
                        ${(lb1Solved ? 1 : 0) + (lb2Solved ? 1 : 0)}/2
                    </span>
                </div>
                
                ${allSolved && phase.showContinue ? `
                    <button id="btn-continue-phase" class="btn btn-success mt-md">
                        Continue →
                    </button>
                ` : ''}
            `;
            
            // Add event listeners for lockbox inputs
            setupLockboxInputs();
            
            // Add continue button listener if shown
            if (allSolved && phase.showContinue) {
                setupContinueButton();
            }
            
        } else if (puzzle) {
            // Standard single puzzle display (Phase 3)
            puzzleContent.innerHTML = `
                <h3 class="text-lg font-bold text-accent mb-sm">${puzzle.title}</h3>
                <div class="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                    ${puzzle.description}
                </div>
            `;
        }
    }
    
    // Show/hide footer input based on phase
    const footer = document.querySelector('.investigation-footer');
    if (footer) {
        if (phase.isDualPuzzle || phase.isTriplePuzzle || phase.isLockboxPuzzle) {
            footer.classList.add('hidden'); // Hide for inline input phases
        } else {
            footer.classList.remove('hidden'); // Show for Phase 3
        }
    }
    
    // Update evidence counter for Phase 2
    const evidenceCounter = document.getElementById('evidence-counter');
    if (evidenceCounter) {
        if (gameState.currentPhase === 'phase2') {
            const solved = phase.puzzles.filter(pid => gameState.solvedPuzzles.includes(pid)).length;
            evidenceCounter.textContent = `COLLECTED: ${solved}/3`;
            evidenceCounter.classList.remove('hidden');
        } else {
            evidenceCounter.classList.add('hidden');
        }
    }
    
    // Update evidence log
    updateEvidenceLog();
    
    // Update timer display
    if (window.TimerSystem) {
        window.TimerSystem.updateTimerDisplay();
    }
    
    // Add debug skip button if in debug mode
    console.log('🔧 Checking DEBUG_MODE:', window.DEBUG_MODE);
    if (window.DEBUG_MODE) {
        console.log('🔧 Adding debug skip button');
        addDebugSkipButton();
    }
}

// Add debug skip button for testing
function addDebugSkipButton() {
    console.log('🔧 addDebugSkipButton called');
    
    // Remove existing debug button if any
    const existingBtn = document.getElementById('debug-skip-btn');
    if (existingBtn) existingBtn.remove();
    
    const { gameState, advancePhase, getUnsolvedPuzzles, PHASES, saveState } = window.GameEngine;
    
    const debugBtn = document.createElement('button');
    debugBtn.id = 'debug-skip-btn';
    debugBtn.className = 'debug-skip-btn';
    debugBtn.innerHTML = `⏭️ SKIP PHASE (Debug)`;
    debugBtn.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 10px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    `;
    
    debugBtn.addEventListener('click', () => {
        const phase = window.GameEngine.getCurrentPhase();
        
        // Mark all unsolved puzzles in current phase as solved
        phase.puzzles.forEach(pid => {
            if (!gameState.solvedPuzzles.includes(pid)) {
                gameState.solvedPuzzles.push(pid);
            }
        });
        
        saveState();
        
        // Advance to next phase
        advancePhase();
        
        console.log('🔧 Debug: Skipped to next phase');
    });
    
    document.body.appendChild(debugBtn);
}

// Setup event listeners for dual puzzle inputs (Phase 1)
function setupDualPuzzleInputs() {
    const { gameState, checkAgainstAllUnsolved, recordAttempt, getUnsolvedPuzzles, PUZZLES, saveState } = window.GameEngine;
    
    // Hide the footer input during Phase 1 dual puzzle mode
    const footer = document.querySelector('.investigation-footer');
    if (footer) {
        footer.classList.add('hidden');
    }
    
    // Generic handler that checks against ALL unsolved puzzles
    const handleDualSubmit = (input, feedback) => {
        const answer = input.value.trim();
        if (!answer) return;
        
        recordAttempt();
        
        // Check against all unsolved Phase 1 puzzles
        const result = checkAgainstAllUnsolved(answer);
        
        if (result.valid) {
            gameState.solvedPuzzles.push(result.puzzleId);
            saveState();
            playSound('correct');
            
            const puzzle = PUZZLES[result.puzzleId];
            if (puzzle.thiefReaction) {
                showThiefReaction(puzzle.thiefReaction);
            }
            
            // Update UI (will show continue button if all solved)
            setTimeout(() => updateInvestigationUI(), 1000);
        } else {
            handleWrongAnswer(result, result.puzzleId || 'location1', input, feedback);
        }
    };
    
    // Location 1 input
    const input1 = document.getElementById('input-location1');
    const btn1 = document.getElementById('btn-submit-location1');
    const feedback1 = document.getElementById('feedback-location1');
    
    if (input1 && btn1) {
        btn1.addEventListener('click', () => handleDualSubmit(input1, feedback1));
        input1.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleDualSubmit(input1, feedback1);
        });
    }
    
    // Location 2 input
    const input2 = document.getElementById('input-location2');
    const btn2 = document.getElementById('btn-submit-location2');
    const feedback2 = document.getElementById('feedback-location2');
    
    if (input2 && btn2) {
        btn2.addEventListener('click', () => handleDualSubmit(input2, feedback2));
        input2.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleDualSubmit(input2, feedback2);
        });
    }
}

// Setup event listeners for triple puzzle inputs (Phase 2)
function setupTriplePuzzleInputs() {
    const { gameState, checkAgainstAllUnsolved, recordAttempt, getUnsolvedPuzzles, getCurrentPhase, PUZZLES, saveState } = window.GameEngine;
    
    // Generic handler that checks against ALL unsolved Phase 2 puzzles
    const handleTripleSubmit = (input, feedback) => {
        const answer = input.value.trim();
        if (!answer) return;
        
        recordAttempt();
        
        // Check against all unsolved Phase 2 puzzles
        const result = checkAgainstAllUnsolved(answer);
        
        if (result.valid) {
            gameState.solvedPuzzles.push(result.puzzleId);
            saveState();
            playSound('correct');
            
            const puzzle = PUZZLES[result.puzzleId];
            if (puzzle.thiefReaction) {
                showThiefReaction(puzzle.thiefReaction);
            }
            
            // Update UI (will show continue button if all solved)
            setTimeout(() => updateInvestigationUI(), 1000);
        } else {
            handleWrongAnswer(result, result.puzzleId || 'puzzle1', input, feedback);
        }
    };
    
    // Setup all 3 puzzle inputs
    ['puzzle1', 'puzzle2', 'puzzle3'].forEach(puzzleId => {
        const input = document.getElementById(`input-${puzzleId}`);
        const btn = document.getElementById(`btn-submit-${puzzleId}`);
        const feedback = document.getElementById(`feedback-${puzzleId}`);
        
        if (input && btn) {
            btn.addEventListener('click', () => handleTripleSubmit(input, feedback));
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleTripleSubmit(input, feedback);
            });
        }
    });
}

// Setup Continue button for phase transitions
function setupContinueButton() {
    const continueBtn = document.getElementById('btn-continue-phase');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            playSound('click');
            window.GameEngine.advancePhase();
        });
    }
}

// Setup event listeners for lockbox inputs
function setupLockboxInputs() {
    const { gameState, checkAgainstAllUnsolved, recordAttempt, getUnsolvedPuzzles, PUZZLES, saveState } = window.GameEngine;
    
    // Hide the footer input during lockbox mode
    const footer = document.querySelector('.investigation-footer');
    if (footer) {
        footer.classList.add('hidden');
    }
    
    // Generic handler that checks against lockbox puzzles
    const handleLockboxSubmit = (input, feedback) => {
        const answer = input.value.trim();
        if (!answer) return;
        
        recordAttempt();
        
        // Check against lockbox puzzles
        const result = checkAgainstAllUnsolved(answer);
        
        if (result.valid) {
            gameState.solvedPuzzles.push(result.puzzleId);
            saveState();
            playSound('correct');
            
            // Update UI (will show continue button if all solved)
            setTimeout(() => updateInvestigationUI(), 1000);
        } else {
            handleWrongAnswer(result, result.puzzleId || 'lockbox1', input, feedback);
        }
    };
    
    // Lockbox 1 input
    const input1 = document.getElementById('input-lockbox1');
    const btn1 = document.getElementById('btn-submit-lockbox1');
    const feedback1 = document.getElementById('feedback-lockbox1');
    
    if (input1 && btn1) {
        btn1.addEventListener('click', () => handleLockboxSubmit(input1, feedback1));
        input1.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLockboxSubmit(input1, feedback1);
        });
    }
    
    // Lockbox 2 input
    const input2 = document.getElementById('input-lockbox2');
    const btn2 = document.getElementById('btn-submit-lockbox2');
    const feedback2 = document.getElementById('feedback-lockbox2');
    
    if (input2 && btn2) {
        btn2.addEventListener('click', () => handleLockboxSubmit(input2, feedback2));
        input2.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLockboxSubmit(input2, feedback2);
        });
    }
}

// Handle wrong answer for dual/triple puzzle inputs
function handleWrongAnswer(result, puzzleId, input, feedback) {
    const { gameState, applyPenalty, TAUNTS, saveState } = window.GameEngine;
    
    if (!gameState.puzzleAttempts[puzzleId]) {
        gameState.puzzleAttempts[puzzleId] = 0;
    }
    gameState.puzzleAttempts[puzzleId]++;
    
    const attemptCount = gameState.puzzleAttempts[puzzleId];
    
    if (result.result === 'duplicate') {
        const taunt = TAUNTS.duplicate[Math.floor(Math.random() * TAUNTS.duplicate.length)];
        feedback.textContent = taunt;
        feedback.className = 'feedback-text text-xs text-warning';
        playSound('wrong');
    } else if (result.result === 'typo') {
        const taunt = TAUNTS.typo[Math.floor(Math.random() * TAUNTS.typo.length)];
        feedback.textContent = taunt;
        feedback.className = 'feedback-text text-xs text-warning';
        playSound('typo');
    } else {
        gameState.wrongAttempts++;
        saveState();
        
        const taunt = TAUNTS.wrongAnswer[Math.floor(Math.random() * TAUNTS.wrongAnswer.length)];
        
        if (attemptCount >= 3) {
            applyPenalty('thirdWrong');
            feedback.textContent = `${taunt} (-30s)`;
        } else if (attemptCount === 2) {
            applyPenalty('secondWrong');
            feedback.textContent = `${taunt} (-15s)`;
        } else {
            feedback.textContent = taunt;
        }
        
        feedback.className = 'feedback-text text-xs text-danger';
        playSound('wrong');
        document.getElementById('app').classList.add('shake');
    }
    
    input.value = '';
    input.focus();
    
    // Clear feedback after delay
    setTimeout(() => {
        feedback.textContent = '';
        document.getElementById('app').classList.remove('shake');
    }, 2000);
}

function updateEvidenceLog() {
    const { gameState, PUZZLES } = window.GameEngine;
    const evidenceList = document.getElementById('evidence-list');
    
    if (!evidenceList) return;
    
    // Filter out skipped puzzles from display
    const completedPuzzles = gameState.solvedPuzzles.filter(pid => !pid.includes('_SKIPPED'));
    
    if (completedPuzzles.length === 0) {
        evidenceList.innerHTML = '<p class="text-gray-600 italic">No evidence collected yet...</p>';
        return;
    }
    
    evidenceList.innerHTML = completedPuzzles.map(puzzleId => {
        const puzzle = PUZZLES[puzzleId];
        if (!puzzle) return '';
        return `
            <div class="evidence-item">
                <span class="text-thief-neon">✓</span>
                <span class="text-gray-300 ml-2">${puzzle.evidence}</span>
            </div>
        `;
    }).join('');
}

function showThiefReaction(message) {
    const panel = document.getElementById('thief-message-panel');
    const messageEl = document.getElementById('current-thief-message');
    
    if (!panel || !messageEl) return;
    
    // Add glow effect
    panel.classList.add('active');
    
    // Update message with typewriter effect
    messageEl.innerHTML = '';
    
    new Typed(messageEl, {
        strings: [message],
        typeSpeed: 20,
        showCursor: false,
        onComplete: () => {
            setTimeout(() => {
                panel.classList.remove('active');
            }, 2000);
        }
    });
}

function showAnswerFeedback(type, message) {
    const feedback = document.getElementById('answer-feedback');
    const input = document.getElementById('answer-input');
    const app = document.getElementById('app');
    
    if (!feedback) return;
    
    // Set message and color
    feedback.textContent = message;
    
    switch (type) {
        case 'correct':
            feedback.className = 'text-sm mt-2 font-mono h-6 text-thief-neon';
            input.classList.add('border-thief-neon');
            app.classList.add('success-flash');
            playSound('correct');
            break;
            
        case 'wrong':
            feedback.className = 'text-sm mt-2 font-mono h-6 text-thief-red';
            input.classList.add('border-thief-red');
            app.classList.add('shake');
            playSound('wrong');
            break;
            
        case 'typo':
            feedback.className = 'text-sm mt-2 font-mono h-6 text-yellow-500';
            playSound('typo');
            break;
            
        case 'blocked':
            feedback.className = 'text-sm mt-2 font-mono h-6 text-gray-500';
            playSound('blocked');
            break;
    }
    
    // Clear feedback after delay
    setTimeout(() => {
        feedback.textContent = '';
        feedback.className = 'text-sm mt-2 font-mono h-6';
        input.classList.remove('border-thief-neon', 'border-thief-red');
        app.classList.remove('success-flash', 'shake');
    }, 2000);
    
    // Clear input
    if (type === 'correct') {
        input.value = '';
    }
}

// ==================== VICTORY SCREEN ====================
function showVictoryStats() {
    const stats = window.GameEngine.calculateStats();
    
    document.getElementById('stat-time').textContent = window.TimerSystem.formatTime(stats.timeLeft);
    document.getElementById('stat-puzzles').textContent = `${stats.solvedCount}/${stats.totalPuzzles}`;
    document.getElementById('stat-wrong').textContent = stats.wrongAttempts.toString();
    document.getElementById('stat-hints').textContent = stats.hintsUsed.toString();
    document.getElementById('stat-perfect').textContent = stats.isPerfect ? '✅ YES!' : '❌';
    document.getElementById('stat-bonus').textContent = `${stats.bonus}x`;
    
    // Trigger celebration
    createConfetti();
    playSound('victory');
}

function createConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    
    const colors = ['#00ff88', '#ff3333', '#d4af37', '#1e3a5f', '#ff69b4', '#00bfff'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        container.appendChild(confetti);
    }
    
    // Remove after animation
    setTimeout(() => container.remove(), 5000);
}

// ==================== CHASE MODE INIT ====================
function initChaseMode() {
    const { gameState, generateChaseLink } = window.GameEngine;
    
    // Generate and display share link
    const shareLink = generateChaseLink();
    const linkInput = document.getElementById('share-link');
    if (linkInput) {
        linkInput.value = shareLink;
    }
    
    // Generate QR code using qrcode-generator
    const qrCanvas = document.getElementById('qr-code');
    if (qrCanvas && typeof qrcode !== 'undefined') {
        try {
            // Create QR code (type 0 = auto, L = low error correction)
            const qr = qrcode(0, 'L');
            qr.addData(shareLink);
            qr.make();
            
            // Get the canvas context
            const ctx = qrCanvas.getContext('2d');
            const moduleCount = qr.getModuleCount();
            const cellSize = 4;
            const size = moduleCount * cellSize + 20; // Add padding
            
            qrCanvas.width = size;
            qrCanvas.height = size;
            
            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            
            // Draw QR modules
            ctx.fillStyle = '#000000';
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        ctx.fillRect(
                            col * cellSize + 10,
                            row * cellSize + 10,
                            cellSize,
                            cellSize
                        );
                    }
                }
            }
        } catch (error) {
            console.error('QR Code error:', error);
        }
    }
    
    // Update timer display
    if (window.TimerSystem) {
        window.TimerSystem.updateChaseTimerDisplay();
    }
}

function showVictoryScreen(chaseTimeout = false) {
    const { gameState, saveState } = window.GameEngine;
    
    if (chaseTimeout) {
        // Thief escaped but puzzles were solved
        gameState.prizeReduced = true;
    }
    
    saveState();
    showScreen('victory');
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('setupEventListeners called');
    
    // Evidence Panel Toggle
    const evidenceToggle = document.getElementById('evidence-toggle');
    if (evidenceToggle) {
        evidenceToggle.addEventListener('click', () => {
            const content = document.getElementById('evidence-list');
            const arrow = document.getElementById('evidence-arrow');
            
            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                arrow.classList.add('rotated');
            } else {
                content.classList.add('collapsed');
                arrow.classList.remove('rotated');
            }
            
            playSound('click');
        });
    }
    
    // Resort Notice - Accept Button
    const acceptBtn = document.getElementById('btn-accept-notice');
    console.log('Accept button found:', !!acceptBtn);
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            console.log('Accept button clicked!');
            playSound('click');
            showScreen('thief-intro');
        });
    }
    
    // Thief Intro - Begin Button
    const beginBtn = document.getElementById('btn-begin-game');
    if (beginBtn) {
        beginBtn.addEventListener('click', () => {
            playSound('start');
            showScreen('investigation');
            startInvestigationTimer();
        });
    }
    
    // Answer Input
    const answerInput = document.getElementById('answer-input');
    const submitBtn = document.getElementById('btn-submit-answer');
    
    if (answerInput && submitBtn) {
        submitBtn.addEventListener('click', () => handleAnswerSubmit());
        
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAnswerSubmit();
            }
        });
    }
    
    // Warning Screen - Understand Button
    const understandBtn = document.getElementById('btn-understand-warning');
    if (understandBtn) {
        understandBtn.addEventListener('click', () => {
            playSound('click');
            showScreen('investigation');
            updateInvestigationUI();
        });
    }
    
    // Team Selection Buttons
    const genderBtn = document.getElementById('btn-teams-gender');
    const randomBtn = document.getElementById('btn-teams-random');
    const keepBtn = document.getElementById('btn-teams-keep');
    
    if (genderBtn) {
        genderBtn.addEventListener('click', () => {
            playSound('click');
            window.GameEngine.gameState.teamDivisionMethod = 'gender';
            document.getElementById('ready-section').classList.remove('hidden');
            genderBtn.classList.add('ring-2', 'ring-white');
            randomBtn.classList.add('opacity-50');
            randomBtn.disabled = true;
            if (keepBtn) {
                keepBtn.classList.add('opacity-50');
                keepBtn.disabled = true;
            }
        });
    }
    
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            playSound('click');
            window.GameEngine.gameState.teamDivisionMethod = 'random';
            genderBtn.classList.add('opacity-50');
            genderBtn.disabled = true;
            randomBtn.classList.add('ring-2', 'ring-white');
            if (keepBtn) {
                keepBtn.classList.add('opacity-50');
                keepBtn.disabled = true;
            }
            
            const teams = window.GameEngine.runRandomDraft();
            window.GameEngine.gameState.teams = teams;
            window.GameEngine.animateDraft(teams);
        });
    }
    
    // Keep Current Teams button - goes straight to ready section
    if (keepBtn) {
        keepBtn.addEventListener('click', () => {
            playSound('click');
            window.GameEngine.gameState.teamDivisionMethod = 'keep';
            document.getElementById('ready-section').classList.remove('hidden');
            keepBtn.classList.add('ring-2', 'ring-white');
            genderBtn.classList.add('opacity-50');
            genderBtn.disabled = true;
            randomBtn.classList.add('opacity-50');
            randomBtn.disabled = true;
        });
    }
    
    // Ready Buttons
    const readyBtn1 = document.getElementById('btn-ready-team1');
    const readyBtn2 = document.getElementById('btn-ready-team2');
    
    if (readyBtn1) {
        readyBtn1.addEventListener('click', () => {
            playSound('click');
            readyBtn1.dataset.ready = 'true';
            readyBtn1.innerHTML = 'Team Mitch<br><span class="text-xs">✓ READY</span>';
            checkBothTeamsReady();
        });
    }
    
    if (readyBtn2) {
        readyBtn2.addEventListener('click', () => {
            playSound('click');
            readyBtn2.dataset.ready = 'true';
            readyBtn2.innerHTML = 'Team Melisa<br><span class="text-xs">✓ READY</span>';
            checkBothTeamsReady();
        });
    }
    
    // Time's Up - Continue Anyway
    const continueBtn = document.getElementById('btn-continue-anyway');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            playSound('click');
            showScreen('investigation');
            // Timer stays at 0, but allow continued play
        });
    }
    
    // Play Again Button
    const playAgainBtn = document.getElementById('btn-play-again');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            window.GameEngine.clearState();
        });
    }
    
    // Photo Buttons (Chase Mode)
    setupPhotoListeners();
}

function checkBothTeamsReady() {
    const btn1 = document.getElementById('btn-ready-team1');
    const btn2 = document.getElementById('btn-ready-team2');
    
    if (btn1.dataset.ready === 'true' && btn2.dataset.ready === 'true') {
        // Start countdown and transition to chase
        runCountdown(() => {
            showScreen('chase');
            startChaseTimer();
        });
    }
}

// ==================== ANSWER HANDLING ====================
function handleAnswerSubmit() {
    const input = document.getElementById('answer-input');
    const answer = input.value.trim();
    
    if (!answer) return;
    
    const { 
        gameState, 
        checkAgainstAllUnsolved, 
        recordAttempt, 
        isRateLimited, 
        getRateLimitCooldown,
        applyPenalty,
        advancePhase,
        getUnsolvedPuzzles,
        TAUNTS,
        PUZZLES,
        saveState
    } = window.GameEngine;
    
    // Check rate limiting
    if (isRateLimited()) {
        const cooldown = getRateLimitCooldown();
        showAnswerFeedback('blocked', `Too many attempts! Wait ${cooldown}s`);
        return;
    }
    
    recordAttempt();
    
    // Check answer against all unsolved puzzles in current phase
    const result = checkAgainstAllUnsolved(answer);
    
    // Track attempts for this puzzle
    if (!gameState.puzzleAttempts[result.puzzleId]) {
        gameState.puzzleAttempts[result.puzzleId] = 0;
    }
    gameState.puzzleAttempts[result.puzzleId]++;
    
    if (result.valid) {
        // CORRECT ANSWER
        gameState.solvedPuzzles.push(result.puzzleId);
        saveState();
        
        const puzzle = PUZZLES[result.puzzleId];
        showAnswerFeedback('correct', '✓ CORRECT!');
        
        // Show thief reaction
        if (puzzle.thiefReaction) {
            setTimeout(() => {
                showThiefReaction(puzzle.thiefReaction);
            }, 1000);
        }
        
        // Check if phase is complete
        const remaining = getUnsolvedPuzzles();
        if (remaining.length === 0) {
            // Phase complete!
            setTimeout(() => {
                advancePhase();
            }, 2000);
        } else {
            // Update UI for next puzzle
            setTimeout(() => {
                updateInvestigationUI();
            }, 1500);
        }
        
    } else if (result.result === 'typo') {
        // TYPO DETECTED
        const taunt = TAUNTS.typo[Math.floor(Math.random() * TAUNTS.typo.length)];
        showAnswerFeedback('typo', taunt);
        
    } else if (result.result === 'blocked') {
        // BLOCKED ANSWER
        const taunt = TAUNTS.blocked[Math.floor(Math.random() * TAUNTS.blocked.length)];
        showAnswerFeedback('blocked', taunt);
        
    } else if (result.result === 'tooShort') {
        showAnswerFeedback('blocked', 'Answer too short...');
        
    } else {
        // WRONG ANSWER
        gameState.wrongAttempts++;
        saveState();
        
        const attemptCount = gameState.puzzleAttempts[result.puzzleId] || 0;
        const taunt = TAUNTS.wrongAnswer[Math.floor(Math.random() * TAUNTS.wrongAnswer.length)];
        
        if (attemptCount === 2) {
            // Second wrong - small penalty + shake
            applyPenalty('secondWrong');
            showAnswerFeedback('wrong', `${taunt} (-15s)`);
            document.getElementById('app').classList.add('shake');
            
        } else if (attemptCount >= 3) {
            // Third+ wrong - larger penalty + offer hint
            applyPenalty('thirdWrong');
            showAnswerFeedback('wrong', `${taunt} (-30s)`);
            document.getElementById('app').classList.add('shake');
            
            // Offer hint after many attempts
            if (attemptCount >= 5) {
                showHintOffer();
            }
            
            // Offer skip after 10 attempts
            if (attemptCount >= 10) {
                showSkipOffer();
            }
            
        } else {
            // First wrong - just a taunt
            showAnswerFeedback('wrong', taunt);
        }
    }
    
    input.value = '';
    input.focus();
}

// ==================== HINT & SKIP MODALS ====================
function showHintOffer() {
    const { gameState, getCurrentPuzzle, applyPenalty, saveState } = window.GameEngine;
    const puzzle = getCurrentPuzzle();
    
    if (!puzzle || !puzzle.hint) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content text-center">
            <h3 class="text-thief-neon font-mono text-lg mb-4">💡 Need a Hint?</h3>
            <p class="text-gray-400 text-sm mb-4">
                A hint will cost you <span class="text-thief-red font-bold">30 seconds</span>.
            </p>
            <div class="space-y-2">
                <button id="btn-accept-hint" class="w-full bg-thief-neon hover:bg-green-400 text-thief-dark font-bold py-3 rounded-lg transition-all">
                    Show Hint (-30s)
                </button>
                <button id="btn-decline-hint" class="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-all">
                    No Thanks
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('btn-accept-hint').addEventListener('click', () => {
        applyPenalty('hint');
        gameState.hintsUsed++;
        saveState();
        
        modal.innerHTML = `
            <div class="modal-content text-center">
                <h3 class="text-thief-neon font-mono text-lg mb-4">💡 HINT</h3>
                <p class="text-white text-lg">${puzzle.hint}</p>
                <button id="btn-close-hint" class="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-all">
                    Got It
                </button>
            </div>
        `;
        
        document.getElementById('btn-close-hint').addEventListener('click', () => {
            modal.remove();
        });
    });
    
    document.getElementById('btn-decline-hint').addEventListener('click', () => {
        modal.remove();
    });
}

function showSkipOffer() {
    const { gameState, getCurrentPuzzle, applyPenalty, advancePhase, getUnsolvedPuzzles, saveState } = window.GameEngine;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content text-center">
            <h3 class="text-thief-red font-mono text-lg mb-4">⏭️ Skip Puzzle?</h3>
            <p class="text-gray-400 text-sm mb-4">
                Skipping will cost you <span class="text-thief-red font-bold">10 MINUTES</span>.
            </p>
            <div class="space-y-2">
                <button id="btn-accept-skip" class="w-full bg-thief-red hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all">
                    Skip Puzzle (-10 min)
                </button>
                <button id="btn-decline-skip" class="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-all">
                    Keep Trying
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('btn-accept-skip').addEventListener('click', () => {
        applyPenalty('skip');
        
        // Mark puzzle as "skipped" (not solved, but move on)
        const puzzle = getCurrentPuzzle();
        if (puzzle) {
            gameState.solvedPuzzles.push(puzzle.id + '_SKIPPED');
        }
        saveState();
        
        modal.remove();
        
        // Check if phase complete
        const remaining = getUnsolvedPuzzles();
        if (remaining.length === 0) {
            advancePhase();
        } else {
            updateInvestigationUI();
        }
    });
    
    document.getElementById('btn-decline-skip').addEventListener('click', () => {
        modal.remove();
    });
}

// ==================== PHOTO LISTENERS ====================
function setupPhotoListeners() {
    const photoInput = document.getElementById('photo-input');
    const takePhotoBtn = document.getElementById('btn-take-photo');
    const uploadPhotoBtn = document.getElementById('btn-upload-photo');
    const previewContainer = document.getElementById('photo-preview-container');
    const previewImg = document.getElementById('photo-preview');
    const shareBtn = document.getElementById('btn-share-photo');
    const whatsappBtn = document.getElementById('btn-whatsapp-share');
    const retakeBtn = document.getElementById('btn-retake-photo');
    const copyLinkBtn = document.getElementById('btn-copy-link');
    
    if (takePhotoBtn && photoInput) {
        takePhotoBtn.addEventListener('click', () => {
            photoInput.setAttribute('capture', 'environment');
            photoInput.click();
        });
    }
    
    if (uploadPhotoBtn && photoInput) {
        uploadPhotoBtn.addEventListener('click', () => {
            photoInput.removeAttribute('capture');
            photoInput.click();
        });
    }
    
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    window.GameEngine.gameState.capturedPhoto = event.target.result;
                    previewImg.src = event.target.result;
                    previewContainer.classList.remove('hidden');
                    playSound('capture');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
            previewContainer.classList.add('hidden');
            window.GameEngine.gameState.capturedPhoto = null;
            photoInput.value = '';
        });
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            await shareEvidence();
        });
    }
    
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            shareViaWhatsApp();
        });
    }
    
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            const linkInput = document.getElementById('share-link');
            navigator.clipboard.writeText(linkInput.value).then(() => {
                copyLinkBtn.textContent = '✓';
                setTimeout(() => {
                    copyLinkBtn.textContent = '📋';
                }, 2000);
            });
        });
    }
}

async function shareEvidence() {
    const { gameState } = window.GameEngine;
    
    const chaseTime = window.TimerSystem.formatTime(gameState.chaseTimeLeft);
    const shareText = `🚨 THIEF SPOTTED!\n\n📸 Photo evidence captured\n⏱️ Chase time remaining: ${chaseTime}\n\n#CaseFile7734`;
    
    // Try native share API first
    if (navigator.share && gameState.capturedPhoto) {
        try {
            // Convert base64 to blob
            const response = await fetch(gameState.capturedPhoto);
            const blob = await response.blob();
            const file = new File([blob], 'evidence.jpg', { type: 'image/jpeg' });
            
            await navigator.share({
                title: 'Case #7734 - Evidence',
                text: shareText,
                files: [file]
            });
            
            playSound('share');
        } catch (err) {
            console.log('Native share failed, falling back...');
            shareViaWhatsApp();
        }
    } else {
        shareViaWhatsApp();
    }
}

function shareViaWhatsApp() {
    const { gameState } = window.GameEngine;
    const chaseTime = window.TimerSystem.formatTime(gameState.chaseTimeLeft);
    const shareText = `🚨 THIEF SPOTTED!\n\n📸 Photo evidence captured\n⏱️ Chase time remaining: ${chaseTime}\n\n#CaseFile7734`;
    
    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

// ==================== EXPORTS ====================
window.ScreenManager = {
    showScreen,
    initializeScreen,
    updateInvestigationUI,
    updateEvidenceLog,
    showThiefReaction,
    showAnswerFeedback,
    showVictoryScreen,
    showVictoryStats,
    createConfetti,
    setupEventListeners,
    handleAnswerSubmit
};

// Global exports
window.showScreen = showScreen;
window.setupEventListeners = setupEventListeners;
window.updateInvestigationUI = updateInvestigationUI;
window.showVictoryScreen = showVictoryScreen;
