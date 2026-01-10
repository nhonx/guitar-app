/* --- STATE MANAGEMENT & DATA --- */

// Format: [Low E, A, D, G, B, High e]
// -1 means muted/not played (handled in audio engine)
export const chordLibrary = {
    // --- Major ---
    'C':  [3, 3, 2, 0, 1, 0], 
    'D':  [-1, 0, 0, 2, 3, 2], 
    'E':  [0, 2, 2, 1, 0, 0], 
    'F':  [1, 3, 3, 2, 1, 1], 
    'G':  [3, 2, 0, 0, 0, 3], 
    'A':  [-1, 0, 2, 2, 2, 0], 
    'B':  [-1, 2, 4, 4, 4, 2],

    // --- Minor ---
    'Cm': [-1, 3, 5, 5, 4, 3], 
    'Dm': [-1, 0, 0, 2, 3, 1], 
    'Em': [0, 2, 2, 0, 0, 0], 
    'Fm': [1, 3, 3, 1, 1, 1], 
    'Gm': [3, 5, 5, 3, 3, 3], 
    'Am': [-1, 0, 2, 2, 1, 0], 
    'Bm': [-1, 2, 4, 4, 3, 2],

    // --- Dominant 7th (7) ---
    'C7': [-1, 3, 2, 3, 1, 0],
    'D7': [-1, 0, 0, 2, 1, 2],
    'E7': [0, 2, 0, 1, 0, 0],
    'F7': [1, 3, 1, 2, 1, 1],
    'G7': [3, 2, 0, 0, 0, 1],
    'A7': [-1, 0, 2, 0, 2, 0],
    'B7': [-1, 2, 1, 2, 0, 2],

    // --- Major 7th (maj7) ---
    'Cmaj7': [-1, 3, 2, 0, 0, 0],
    'Fmaj7': [-1, -1, 3, 2, 1, 0],
    'Gmaj7': [3, 2, 0, 0, 0, 2],
    'Amaj7': [-1, 0, 2, 1, 2, 0],

    // --- Minor 7th (m7) ---
    'Am7': [-1, 0, 2, 0, 1, 0],
    'Dm7': [-1, 0, 0, 2, 1, 1],
    'Em7': [0, 2, 2, 0, 3, 0],
    'Bm7': [-1, 2, 0, 2, 0, 2], // Open Bm7 variation

    // --- Sharps & Flats (#/b) ---
    'Bb':  [-1, 1, 3, 3, 3, 1],
    'Eb':  [-1, 6, 8, 8, 8, 6], // Higher voicing or [-1, -1, 1, 3, 4, 3]
    'F#':  [2, 4, 4, 3, 2, 2],
    'F#m': [2, 4, 4, 2, 2, 2],
    'C#m': [-1, 4, 6, 6, 5, 4],
    'Ab':  [4, 6, 6, 5, 4, 4]
};

// Global State
export const state = {
    activeChords: ['C', 'G', 'Am', 'Em', 'D', 'C7', 'F', 'Bb'], // Added examples
    currentChord: 'C',
    capo: 0,
    currentTone: 'acoustic'
};

/* --- DOM ELEMENTS --- */
const chordBar = document.getElementById('chord-bar');
const settingsModal = document.getElementById('settings-modal');
const libraryGrid = document.getElementById('library-grid');
const capoDisplay = document.getElementById('capo-display');
const settingsTrigger = document.getElementById('settings-trigger');
const closeSettingsBtn = document.getElementById('close-settings');

/* --- RENDER FUNCTIONS --- */
export function updateCapoUI() {
    capoDisplay.textContent = state.capo === 0 ? "0" : `+${state.capo}`;
}

export function updateToneUI() {
    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.tone === state.currentTone);
    });
}

export function renderChordBar(openSettingsCallback) {
    chordBar.innerHTML = ''; 
    
    state.activeChords.forEach(chord => {
        const btn = document.createElement('button');
        btn.className = `chord-btn ${chord === state.currentChord ? 'active' : ''}`;
        
        // Adjust font size for longer names (e.g., C#m7)
        if(chord.length > 3) btn.style.fontSize = '0.8rem';
        
        btn.textContent = chord;
        
        const activate = (e) => {
            e.preventDefault(); e.stopPropagation();
            document.querySelectorAll('.chord-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentChord = chord;
        };
        btn.addEventListener('touchstart', activate);
        btn.addEventListener('mousedown', activate);
        chordBar.appendChild(btn);
    });
    
    // Add Button
    const addBtn = document.createElement('button');
    addBtn.className = 'chord-btn add-btn';
    addBtn.textContent = '+';
    addBtn.onclick = openSettingsCallback;
    chordBar.appendChild(addBtn);
}

export function renderSettings(renderBarCallback) {
    libraryGrid.innerHTML = '';
    
    // Group chords for easier reading in Modal
    const categories = {
        'Basic': ['C','D','E','F','G','A','B','Cm','Dm','Em','Fm','Gm','Am','Bm'],
        '7ths': ['C7','D7','E7','F7','G7','A7','B7'],
        'Misc': ['Cmaj7','Fmaj7','Gmaj7','Amaj7','Am7','Dm7','Em7','Bm7','Bb','Eb','F#','F#m','C#m','Ab']
    };

    // Flatten keys to match available library
    const availableKeys = Object.keys(chordLibrary);

    availableKeys.sort().forEach(chord => {
        const btn = document.createElement('button');
        const isAdded = state.activeChords.includes(chord);
        
        // Visual class for minor/sharp chords
        const typeClass = chord.includes('#') || chord.includes('b') ? 'sharp' : (chord.includes('m') ? 'minor' : '');
        
        btn.className = `lib-btn ${isAdded ? 'added' : ''} ${typeClass}`;
        btn.textContent = chord;
        btn.onclick = () => {
            if (state.activeChords.includes(chord)) {
                state.activeChords = state.activeChords.filter(c => c !== chord);
                btn.classList.remove('added');
            } else {
                state.activeChords.push(chord);
                btn.classList.add('added');
            }
            if(state.activeChords.length === 0) state.activeChords = ['C']; 
            if(!state.activeChords.includes(state.currentChord)) state.currentChord = state.activeChords[0];
            
            renderBarCallback(); 
        };
        libraryGrid.appendChild(btn);
    });
    
    updateToneUI();
    updateCapoUI();
}

/* --- ANIMATION --- */
export function animateString(index) {
    const el = document.querySelectorAll('.string-line')[index];
    if(el) {
        el.classList.remove('vibrating');
        void el.offsetWidth; 
        el.classList.add('vibrating');
        setTimeout(() => el.classList.remove('vibrating'), 200);
    }
}

/* --- MODAL CONTROLS --- */
export function setupModalListeners(renderBarCallback) {
    const open = () => {
        renderSettings(renderBarCallback);
        settingsModal.style.display = 'flex';
    };
    settingsTrigger.addEventListener('click', open);
    closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');
    return open;
}