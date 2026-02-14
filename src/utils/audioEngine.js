import { chordLibrary, toneProfiles, baseFreqs } from "../constants";

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let guitarWave = null;

export function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();

  if (!guitarWave) {
    const real = new Float32Array(32);
    const imag = new Float32Array(32);
    for (let i = 1; i < 32; i++) {
      imag[i] = i === 1 ? 1.0 : 0.6 / (i * i);
    }
    guitarWave = audioCtx.createPeriodicWave(real, imag);
  }
}

export function playString(index, currentChord, capo, currentTone, delay = 0) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime + delay;

  // 1. Calculate Pitch
  const shape = chordLibrary[currentChord] || chordLibrary["C"];
  if (shape[index] === -1) return; // Muted

  const totalFret = shape[index] + capo;
  const freq = baseFreqs[index] * Math.pow(2, totalFret / 12);

  // 2. Setup Nodes
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filterNode = audioCtx.createBiquadFilter();

  const profile = toneProfiles[currentTone] || toneProfiles["acoustic"];

  // 3. Configure Sound
  if (currentTone === "acoustic" && guitarWave) {
    osc.setPeriodicWave(guitarWave);
  } else {
    osc.type = profile.type;
  }
  osc.frequency.setValueAtTime(freq, now);

  // Filter (Physics)
  filterNode.type = "lowpass";
  filterNode.Q.value = 1;
  filterNode.frequency.setValueAtTime(profile.filterStart, now);
  filterNode.frequency.exponentialRampToValueAtTime(
    profile.filterEnd + freq,
    now + profile.duration,
  );

  // Gain (Volume)
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(profile.gain, now + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + profile.duration);

  // 4. Connect
  osc.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + profile.duration);
}
