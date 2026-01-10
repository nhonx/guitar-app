import { state, chordLibrary, animateString } from './ui-config.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;
export let audioCtx;
let guitarWave = null; 

const baseFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

const toneProfiles = {
    acoustic: { type: 'custom', filterStart: 3000, filterEnd: 0.1, duration: 2.0 },
    electric: { type: 'sawtooth', filterStart: 2000, filterEnd: 0.5, duration: 3.5 },
    distortion: { type: 'sawtooth', filterStart: 5000, filterEnd: 0.8, duration: 1.5 } 
};

export function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Create Custom Wave for Acoustic Sound
    if(!guitarWave) {
        const real = new Float32Array(32);
        const imag = new Float32Array(32);
        for (let i = 1; i < 32; i++) {
            imag[i] = i === 1 ? 1.0 : 0.6 / (i * i);
        }
        guitarWave = audioCtx.createPeriodicWave(real, imag);
    }
}

export function playString(index, delay = 0) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime + delay;

    // 1. Calculate Pitch
    const shape = chordLibrary[state.currentChord] || chordLibrary['C'];
    if (shape[index] === -1) return; // Muted

    const totalFret = shape[index] + state.capo;
    const freq = baseFreqs[index] * Math.pow(2, totalFret / 12);

    // 2. Setup Nodes
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filterNode = audioCtx.createBiquadFilter();
    const profile = toneProfiles[state.currentTone];

    // 3. Configure Sound
    if (state.currentTone === 'acoustic' && guitarWave) {
        osc.setPeriodicWave(guitarWave);
    } else {
        osc.type = profile.type;
    }
    osc.frequency.setValueAtTime(freq, now);

    // Filter (Physics)
    filterNode.type = 'lowpass';
    filterNode.Q.value = 1;
    const startFreq = state.currentTone === 'distortion' ? 6000 : 3000;
    filterNode.frequency.setValueAtTime(startFreq, now); 
    filterNode.frequency.exponentialRampToValueAtTime(freq + 100, now + profile.duration); 

    // Gain (Volume)
    const volume = state.currentTone === 'distortion' ? 0.15 : 0.4;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + profile.duration); 

    // 4. Connect
    osc.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + profile.duration);

    // 5. Trigger Visual
    setTimeout(() => animateString(index), delay * 1000);
}