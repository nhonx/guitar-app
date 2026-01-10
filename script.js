/* --- CONFIG & DATA --- */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let guitarWave = null; // We will store our custom wave shape here

// Standard EADGBE Tuning frequencies
const baseFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

// Tone Profiles (Adjusted for filter-based synthesis)
const toneProfiles = {
    acoustic: { type: 'custom', filterStart: 3000, filterEnd: 0.1, duration: 2.0 }, // Bright steel string
    electric: { type: 'sawtooth', filterStart: 2000, filterEnd: 0.5, duration: 3.5 }, // Warm sustain
    distortion: { type: 'sawtooth', filterStart: 5000, filterEnd: 0.8, duration: 1.5 } // Harsh
};
let currentTone = 'acoustic';

const chordLibrary = {
    'C':  [3, 3, 2, 0, 1, 0], 'Cm': [3, 3, 5, 5, 4, 3],
    'D':  [2, 0, 0, 2, 3, 2], 'Dm': [0, 0, 0, 2, 3, 1],
    'E':  [0, 2, 2, 1, 0, 0], 'Em': [0, 2, 2, 0, 0, 0],
    'F':  [1, 3, 3, 2, 1, 1], 'Fm': [1, 3, 3, 1, 1, 1],
    'G':  [3, 2, 0, 0, 0, 3], 'Gm': [3, 5, 5, 3, 3, 3],
    'A':  [0, 0, 2, 2, 2, 0], 'Am': [0, 0, 2, 2, 1, 0],
    'B':  [2, 2, 4, 4, 4, 2], 'Bm': [2, 2, 4, 4, 3, 2]
};

let activeChords = ['C', 'G', 'Am', 'Em', 'D', 'F'];
let currentChord = activeChords[0];

/* --- AUDIO ENGINE --- */
function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Create the "Acoustic Guitar" Wave Table
    // This adds harmonics to make it sound richer than a simple beep
    if(!guitarWave) {
        const real = new Float32Array(32);
        const imag = new Float32Array(32);
        // Harmonic series for a plucked string (rich in odd harmonics, decaying intensity)
        for (let i = 1; i < 32; i++) {
            imag[i] = i === 1 ? 1.0 : 0.6 / (i * i); // Amplitude drops rapidly for higher harmonics
        }
        guitarWave = audioCtx.createPeriodicWave(real, imag);
    }
}

function playString(index, delay = 0) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime + delay;

    // 1. Get Pitch
    const shape = chordLibrary[currentChord] || chordLibrary['C'];
    if (shape[index] === -1) return; // Muted string
    const freq = baseFreqs[index] * Math.pow(2, shape[index] / 12);

    // 2. Setup Nodes
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filterNode = audioCtx.createBiquadFilter();

    const profile = toneProfiles[currentTone];

    // 3. Configure Oscillator (The Source)
    if (currentTone === 'acoustic' && guitarWave) {
        osc.setPeriodicWave(guitarWave);
    } else {
        osc.type = profile.type;
    }
    osc.frequency.setValueAtTime(freq, now);

    // 4. Configure Filter (The Physics of damping)
    // Real strings start bright (high filter) and get duller (low filter) as they ring out
    filterNode.type = 'lowpass';
    filterNode.Q.value = 1; // Slight resonance
    
    // Filter Envelope
    const startFreq = currentTone === 'distortion' ? 6000 : 3000;
    filterNode.frequency.setValueAtTime(startFreq, now); 
    // Decay brightness quickly to simulate wood absorption
    filterNode.frequency.exponentialRampToValueAtTime(freq + 100, now + profile.duration); 

    // 5. Configure Gain (Volume Envelope)
    const volume = currentTone === 'distortion' ? 0.15 : 0.4;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Fast attack (Pluck)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + profile.duration); // Fade out

    // 6. Connect & Start
    // Distortion uses a waveshaper curve (optional enhancement, kept simple here via gain)
    osc.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + profile.duration);

    // 7. Visual Trigger
    setTimeout(() => animateString(index), delay * 1000);
}

function animateString(index) {
    const el = document.querySelectorAll('.string-line')[index];
    if(el) {
        el.classList.remove('vibrating');
        void el.offsetWidth;
        el.classList.add('vibrating');
        setTimeout(() => el.classList.remove('vibrating'), 200);
    }
}

/* --- UI LOGIC --- */
const chordBar = document.getElementById('chord-bar');
const settingsModal = document.getElementById('settings-modal');
const libraryGrid = document.getElementById('library-grid');

function renderChordBar() {
    chordBar.innerHTML = ''; 
    activeChords.forEach(chord => {
        const btn = document.createElement('button');
        btn.className = `chord-btn ${chord === currentChord ? 'active' : ''}`;
        btn.textContent = chord;
        
        const activate = (e) => {
            e.preventDefault(); e.stopPropagation();
            document.querySelectorAll('.chord-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentChord = chord;
        };
        btn.addEventListener('touchstart', activate);
        btn.addEventListener('mousedown', activate);
        chordBar.appendChild(btn);
    });
    
    const addBtn = document.createElement('button');
    addBtn.className = 'chord-btn add-btn';
    addBtn.textContent = '+';
    addBtn.onclick = openSettings;
    chordBar.appendChild(addBtn);
}

function renderSettings() {
    libraryGrid.innerHTML = '';
    Object.keys(chordLibrary).sort().forEach(chord => {
        const btn = document.createElement('button');
        const isAdded = activeChords.includes(chord);
        btn.className = `lib-btn ${isAdded ? 'added' : ''}`;
        btn.textContent = chord;
        btn.onclick = () => {
            if (activeChords.includes(chord)) {
                activeChords = activeChords.filter(c => c !== chord);
                btn.classList.remove('added');
            } else {
                activeChords.push(chord);
                btn.classList.add('added');
            }
            if(activeChords.length === 0) activeChords = ['C']; 
            if(!activeChords.includes(currentChord)) currentChord = activeChords[0];
            renderChordBar();
        };
        libraryGrid.appendChild(btn);
    });
    updateToneUI();
}

function setTone(tone) {
    currentTone = tone;
    updateToneUI();
}

function updateToneUI() {
    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.tone === currentTone);
    });
}

document.querySelectorAll('.sound-btn').forEach(btn => {
    btn.addEventListener('click', (e) => setTone(e.target.dataset.tone));
});

function openSettings() {
    renderSettings();
    settingsModal.style.display = 'flex';
}
document.getElementById('settings-trigger').addEventListener('click', openSettings);
document.getElementById('close-settings').addEventListener('click', () => settingsModal.style.display = 'none');

document.getElementById('start-btn').addEventListener('click', () => {
    initAudio();
    document.getElementById('start-overlay').style.display = 'none';
    renderChordBar();
    setTimeout(updateGeom, 100);
});

/* --- PHYSICS ENGINE --- */
const stringsContainer = document.getElementById('strings-container');
const stringElements = document.querySelectorAll('.string');
let stringGeom = [];
let activeTouches = {};

function updateGeom() {
    stringGeom = Array.from(stringElements).map(el => {
        const rect = el.getBoundingClientRect();
        return { center: rect.top + rect.height/2 };
    });
}
window.addEventListener('resize', updateGeom);

function handleMove(e) {
    e.preventDefault();
    Array.from(e.changedTouches).forEach(t => {
        const prevY = activeTouches[t.identifier];
        const currY = t.clientY;
        let hits = [];
        
        stringGeom.forEach((str, idx) => {
            if ((prevY < str.center && currY >= str.center) || 
                (prevY > str.center && currY <= str.center)) {
                const dist = Math.abs(currY - prevY);
                const progress = dist === 0 ? 0 : Math.abs(str.center - prevY) / dist;
                hits.push({ idx, progress });
            }
        });

        // Sort by progress to handle fast swipe order correctly
        hits.sort((a,b) => a.progress - b.progress);
        
        // Slightly delay each string to prevent "Audio Crash" on fast swipes
        hits.forEach(h => playString(h.idx, h.progress * 0.04));
        
        activeTouches[t.identifier] = currY;
    });
}

stringsContainer.addEventListener('touchstart', (e) => {
    initAudio();
    if(stringGeom.length === 0) updateGeom();
    Array.from(e.changedTouches).forEach(t => {
        activeTouches[t.identifier] = t.clientY;
        // Check for direct tap
        stringGeom.forEach((str, idx) => {
            if (Math.abs(t.clientY - str.center) < 30) playString(idx);
        });
    });
}, {passive: false});

stringsContainer.addEventListener('touchmove', handleMove, {passive: false});
stringsContainer.addEventListener('touchend', e => {
    Array.from(e.changedTouches).forEach(t => delete activeTouches[t.identifier]);
});

// Mouse Fallback
let isMouseDown = false; let lastMouseY = 0;
stringsContainer.addEventListener('mousedown', e => {
    isMouseDown = true; lastMouseY = e.clientY;
    stringGeom.forEach((str, idx) => { if (Math.abs(e.clientY - str.center) < 20) playString(idx); });
});
window.addEventListener('mousemove', e => {
    if(!isMouseDown) return;
    if(activeTouches['m'] === undefined) activeTouches['m'] = lastMouseY;
    const mockE = { changedTouches: [{identifier: 'm', clientY: e.clientY}], preventDefault: ()=>{} };
    handleMove(mockE);
});
window.addEventListener('mouseup', () => { isMouseDown = false; delete activeTouches['m']; });