import { state, chordLibrary, animateString } from "./ui-config.js";

const AudioContext = window.AudioContext || window.webkitAudioContext;
export let audioCtx;
let guitarWave = null;

const baseFreqs = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

const toneProfiles = {
  // BOOSTED GAIN: Increased from ~0.4 to 0.6 to match Rock volume
  acoustic: {
    type: "custom",
    filterStart: 3000,
    filterEnd: 0.1,
    duration: 2.0,
    gain: 0.8,
  },
  // Removed 'electric' (Clean) as requested
  distortion: {
    type: "sawtooth",
    filterStart: 6000,
    filterEnd: 100, // Lower end frequency to make it "crunch" more
    duration: 1.5,
    gain: 0.15, // Sawtooth is naturally loud, so gain stays lower
  },
};

export function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();

  // Create Custom Wave for Acoustic Sound
  if (!guitarWave) {
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
  const shape = chordLibrary[state.currentChord] || chordLibrary["C"];
  if (shape[index] === -1) return; // Muted

  const totalFret = shape[index] + state.capo;
  const freq = baseFreqs[index] * Math.pow(2, totalFret / 12);

  // 2. Setup Nodes
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filterNode = audioCtx.createBiquadFilter();

  // Safety fallback if tone doesn't exist (e.g. if user had 'clean' selected before reload)
  const profile = toneProfiles[state.currentTone] || toneProfiles["acoustic"];

  // 3. Configure Sound
  if (state.currentTone === "acoustic" && guitarWave) {
    osc.setPeriodicWave(guitarWave);
  } else {
    osc.type = profile.type;
  }
  osc.frequency.setValueAtTime(freq, now);

  // Filter (Physics)
  filterNode.type = "lowpass";
  filterNode.Q.value = 1;
  filterNode.frequency.setValueAtTime(profile.filterStart, now);
  // Sweep filter down to create "pluck" sound
  filterNode.frequency.exponentialRampToValueAtTime(
    profile.filterEnd + freq,
    now + profile.duration,
  );

  // Gain (Volume) - NOW USES PROFILE DATA
  gainNode.gain.setValueAtTime(0, now);
  // Fast attack to profile.gain
  gainNode.gain.linearRampToValueAtTime(profile.gain, now + 0.015);
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
