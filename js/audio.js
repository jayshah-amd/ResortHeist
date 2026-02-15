/**
 * Audio System for Case #7734
 * Dark, mysterious sound effects for a thief mystery game
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
// Dark, mysterious synthesized sounds

const SOUNDS = {
    // UI Click - Low, subtle thud
    click: { type: 'thud', frequency: 80, duration: 0.08 },
    
    // Correct/Success - Deep, satisfying confirmation
    correct: { type: 'darkSuccess', frequencies: [150, 200, 300], duration: 0.2 },
    
    // Wrong/Error - Ominous low buzz
    wrong: { type: 'ominous', frequency: 60, duration: 0.4 },
    
    // Typo - Low warning tone
    typo: { type: 'warningTone', frequency: 180, duration: 0.15 },
    
    // Blocked - Deep rumble
    blocked: { type: 'rumble', frequency: 40, duration: 0.25 },
    
    // Reveal/Transition - Mysterious descending whisper
    reveal: { type: 'mysterious', frequencies: [400, 300, 200, 150], duration: 0.15 },
    
    // Start Game - Dark dramatic chord
    start: { type: 'darkChord', frequencies: [100, 150, 200], duration: 0.3 },
    
    // Timer Warning - Low pulsing alarm
    warning: { type: 'darkAlarm', frequency: 120, duration: 0.4, repeat: 2 },
    
    // Critical Warning - Intense low pulse
    critical: { type: 'darkAlarm', frequency: 80, duration: 0.3, repeat: 3 },
    
    // Tick - Deep subtle click
    tick: { type: 'deepTick', frequency: 100, duration: 0.05 },
    
    // Penalty - Sinister descending tone
    penalty: { type: 'sinister', startFreq: 200, endFreq: 50, duration: 0.5 },
    
    // Countdown - Heavy beat
    countdown: { type: 'heavyBeat', frequency: 80, duration: 0.2 },
    
    // Victory - Dark triumphant
    victory: { type: 'darkTriumph', frequencies: [100, 150, 200, 250, 300], duration: 0.25 },
    
    // Time's Up - Ominous drone
    timesup: { type: 'drone', frequencies: [60, 80, 100], duration: 0.6 },
    
    // Draft Pick - Deep pop
    draft: { type: 'deepPop', frequency: 120, duration: 0.1 },
    
    // Capture Photo - Heavy shutter
    capture: { type: 'heavyShutter', frequency: 200, duration: 0.08 },
    
    // Share - Dark whoosh
    share: { type: 'darkWhoosh', startFreq: 80, endFreq: 300, duration: 0.3 }
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
            case 'thud':
                playThud(ctx, sound);
                break;
            case 'darkSuccess':
                playDarkArpeggio(ctx, sound.frequencies, sound.duration);
                break;
            case 'ominous':
                playOminous(ctx, sound);
                break;
            case 'warningTone':
                playWarningTone(ctx, sound);
                break;
            case 'rumble':
                playRumble(ctx, sound);
                break;
            case 'mysterious':
                playMysterious(ctx, sound.frequencies, sound.duration);
                break;
            case 'darkChord':
                playDarkChord(ctx, sound.frequencies, sound.duration);
                break;
            case 'darkAlarm':
                playDarkAlarm(ctx, sound);
                break;
            case 'deepTick':
                playDeepTick(ctx, sound);
                break;
            case 'sinister':
                playSinister(ctx, sound);
                break;
            case 'heavyBeat':
                playHeavyBeat(ctx, sound);
                break;
            case 'darkTriumph':
                playDarkTriumph(ctx, sound);
                break;
            case 'drone':
                playDrone(ctx, sound);
                break;
            case 'deepPop':
                playDeepPop(ctx, sound);
                break;
            case 'heavyShutter':
                playHeavyShutter(ctx);
                break;
            case 'darkWhoosh':
                playDarkWhoosh(ctx, sound);
                break;
            default:
                playThud(ctx, { frequency: 80, duration: 0.1 });
        }
    } catch (e) {
        console.warn('Audio playback failed:', e);
    }
}

// Deep thud for UI clicks
function playThud(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + sound.duration);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
}

// Dark success arpeggio - low and satisfying
function playDarkArpeggio(ctx, frequencies, noteDuration) {
    frequencies.forEach((freq, index) => {
        const startTime = ctx.currentTime + (index * noteDuration * 0.6);
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
    });
}

// Ominous wrong answer sound
function playOminous(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    oscillator2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    
    oscillator2.type = 'sawtooth';
    oscillator2.frequency.setValueAtTime(sound.frequency * 1.02, ctx.currentTime); // Slight detune for thickness
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + sound.duration * 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
    oscillator2.stop(ctx.currentTime + sound.duration);
}

// Warning tone for typos
function playWarningTone(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(sound.frequency * 0.7, ctx.currentTime + sound.duration);
    
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
}

// Deep rumble for blocked
function playRumble(ctx, sound) {
    const bufferSize = ctx.sampleRate * sound.duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Create low rumble noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(i / 50);
    }
    
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    source.start(ctx.currentTime);
}

// Mysterious descending reveal
function playMysterious(ctx, frequencies, noteDuration) {
    frequencies.forEach((freq, index) => {
        const startTime = ctx.currentTime + (index * noteDuration * 0.5);
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 2, startTime);
        filter.frequency.exponentialRampToValueAtTime(freq * 0.5, startTime + noteDuration);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
    });
}

// Dark chord for start
function playDarkChord(ctx, frequencies, duration) {
    frequencies.forEach((freq) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime + duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    });
}

// Dark pulsing alarm
function playDarkAlarm(ctx, sound) {
    for (let i = 0; i < (sound.repeat || 1); i++) {
        const startTime = ctx.currentTime + (i * (sound.duration + 0.1));
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(sound.frequency, startTime);
        oscillator.frequency.setValueAtTime(sound.frequency * 0.8, startTime + sound.duration * 0.5);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gainNode.gain.setValueAtTime(0.25, startTime + sound.duration * 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + sound.duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + sound.duration);
    }
}

// Deep tick
function playDeepTick(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + sound.duration);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
}

// Sinister descending penalty
function playSinister(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    oscillator2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(sound.startFreq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(sound.endFreq, ctx.currentTime + sound.duration);
    
    oscillator2.type = 'sawtooth';
    oscillator2.frequency.setValueAtTime(sound.startFreq * 0.5, ctx.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(sound.endFreq * 0.5, ctx.currentTime + sound.duration);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + sound.duration);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
    oscillator2.stop(ctx.currentTime + sound.duration);
}

// Heavy beat for countdown
function playHeavyBeat(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + sound.duration);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
}

// Dark triumph for victory
function playDarkTriumph(ctx, sound) {
    sound.frequencies.forEach((freq, index) => {
        const startTime = ctx.currentTime + (index * sound.duration * 0.5);
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, startTime);
        
        const noteDuration = index === sound.frequencies.length - 1 ? 0.8 : sound.duration;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
    });
}

// Ominous drone for time's up
function playDrone(ctx, sound) {
    sound.frequencies.forEach((freq) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime + sound.duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + sound.duration);
    });
}

// Deep pop for draft
function playDeepPop(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(sound.frequency * 0.3, ctx.currentTime + sound.duration);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
}

// Heavy shutter for photo
function playHeavyShutter(ctx) {
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    source.start(ctx.currentTime);
}

// Dark whoosh for share
function playDarkWhoosh(ctx, sound) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(sound.startFreq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(sound.endFreq, ctx.currentTime + sound.duration);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + sound.duration);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
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
