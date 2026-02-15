/**
 * Audio System for Case #7734
 * Handles all sound effects using Web Audio API and Audio elements
 */

// Audio context for Web Audio API sounds
let audioContext = null;
let audioEnabled = true;

// Initialize audio context on first user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// ==================== SOUND DEFINITIONS ====================
// Simple synthesized sounds using Web Audio API

const SOUNDS = {
    // UI Sounds
    click: { type: 'click', frequency: 800, duration: 0.05 },
    
    // Correct/Success
    correct: { type: 'success', frequencies: [523, 659, 784], duration: 0.15 },
    
    // Wrong/Error  
    wrong: { type: 'error', frequency: 200, duration: 0.2 },
    
    // Typo
    typo: { type: 'beep', frequency: 440, duration: 0.1 },
    
    // Blocked
    blocked: { type: 'buzz', frequency: 100, duration: 0.15 },
    
    // Reveal/Transition - Ascending tone (message received feel)
    reveal: { type: 'ascending', frequencies: [440, 554, 659, 880], duration: 0.12 },
    
    // Start Game
    start: { type: 'fanfare', frequencies: [523, 659, 784, 1047], duration: 0.1 },
    
    // Timer Warning
    warning: { type: 'alarm', frequency: 880, duration: 0.3, repeat: 3 },
    
    // Critical Warning
    critical: { type: 'alarm', frequency: 1000, duration: 0.2, repeat: 5 },
    
    // Tick
    tick: { type: 'tick', frequency: 1000, duration: 0.03 },
    
    // Penalty
    penalty: { type: 'descend', startFreq: 600, endFreq: 200, duration: 0.3 },
    
    // Countdown
    countdown: { type: 'beep', frequency: 600, duration: 0.15 },
    
    // Victory
    victory: { type: 'victory', frequencies: [523, 659, 784, 1047, 1319], duration: 0.2 },
    
    // Time's Up
    timesup: { type: 'defeat', frequencies: [400, 300, 200], duration: 0.3 },
    
    // Draft Pick
    draft: { type: 'pop', frequency: 500, duration: 0.08 },
    
    // Capture Photo
    capture: { type: 'shutter', frequency: 1200, duration: 0.05 },
    
    // Share
    share: { type: 'whoosh', startFreq: 200, endFreq: 1000, duration: 0.2 }
};

// ==================== SOUND GENERATION ====================

function playSound(soundName) {
    if (!audioEnabled) return;
    
    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const sound = SOUNDS[soundName];
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        switch (sound.type) {
            case 'click':
                playClick(ctx, sound);
                break;
            case 'success':
                playArpeggio(ctx, sound.frequencies, sound.duration, 'sine');
                break;
            case 'error':
                playBuzz(ctx, sound);
                break;
            case 'beep':
                playBeep(ctx, sound.frequency, sound.duration);
                break;
            case 'buzz':
                playBuzz(ctx, sound);
                break;
            case 'sweep':
                playSweep(ctx, sound.startFreq, sound.endFreq, sound.duration);
                break;
            case 'ascending':
                playAscending(ctx, sound.frequencies, sound.duration);
                break;
            case 'fanfare':
                playArpeggio(ctx, sound.frequencies, sound.duration, 'square');
                break;
            case 'alarm':
                playAlarm(ctx, sound);
                break;
            case 'tick':
                playBeep(ctx, sound.frequency, sound.duration);
                break;
            case 'descend':
                playSweep(ctx, sound.startFreq, sound.endFreq, sound.duration);
                break;
            case 'victory':
                playVictory(ctx, sound);
                break;
            case 'defeat':
                playArpeggio(ctx, sound.frequencies, sound.duration, 'sawtooth');
                break;
            case 'pop':
                playPop(ctx, sound);
                break;
            case 'shutter':
                playShutter(ctx);
                break;
            case 'whoosh':
                playSweep(ctx, sound.startFreq, sound.endFreq, sound.duration);
                break;
            default:
                playBeep(ctx, 440, 0.1);
        }
    } catch (e) {
        console.warn('Audio playback failed:', e);
    }
}

function playBeep(ctx, frequency, duration) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
}

function playClick(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
}

function playBuzz(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
}

function playSweep(ctx, startFreq, endFreq, duration) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
}

function playArpeggio(ctx, frequencies, noteDuration, waveType = 'sine') {
    frequencies.forEach((freq, index) => {
        const startTime = ctx.currentTime + (index * noteDuration);
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0.25, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
    });
}

function playAscending(ctx, frequencies, noteDuration) {
    // Classic "message received" ascending tone with slight overlap
    const totalDuration = frequencies.length * noteDuration;
    
    frequencies.forEach((freq, index) => {
        const startTime = ctx.currentTime + (index * noteDuration * 0.7); // Slight overlap
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        // Smooth envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + noteDuration * 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
    });
}

function playAlarm(ctx, sound) {
    for (let i = 0; i < (sound.repeat || 1); i++) {
        const startTime = ctx.currentTime + (i * (sound.duration + 0.05));
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(sound.frequency, startTime);
        
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.setValueAtTime(0.2, startTime + sound.duration * 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + sound.duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + sound.duration);
    }
}

function playVictory(ctx, sound) {
    // Play ascending arpeggio with sustained final note
    sound.frequencies.forEach((freq, index) => {
        const startTime = ctx.currentTime + (index * sound.duration);
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        const noteDuration = index === sound.frequencies.length - 1 ? 0.5 : sound.duration;
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
    });
}

function playPop(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(sound.frequency * 2, ctx.currentTime + sound.duration * 0.3);
    oscillator.frequency.exponentialRampToValueAtTime(sound.frequency * 0.5, ctx.currentTime + sound.duration);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
}

function playShutter(ctx) {
    // Create a quick burst of white noise
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    source.start(ctx.currentTime);
}

// ==================== AUDIO CONTROL ====================

function toggleAudio() {
    audioEnabled = !audioEnabled;
    return audioEnabled;
}

function setAudioEnabled(enabled) {
    audioEnabled = enabled;
}

function isAudioEnabled() {
    return audioEnabled;
}

// ==================== INITIALIZATION ====================

// Initialize audio on first user interaction
document.addEventListener('click', () => {
    initAudio();
}, { once: true });

document.addEventListener('touchstart', () => {
    initAudio();
}, { once: true });

// ==================== EXPORTS ====================

window.AudioSystem = {
    playSound,
    toggleAudio,
    setAudioEnabled,
    isAudioEnabled,
    initAudio
};

// Global export for easy access
window.playSound = playSound;
