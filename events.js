import { initAudio, playString } from './audio-engine.js';
import { state, renderChordBar, setupModalListeners, updateCapoUI, updateToneUI } from './ui-config.js';

// --- INITIALIZATION ---
const openSettings = setupModalListeners(() => renderChordBar(openSettings));
renderChordBar(openSettings);

// Start Button Logic
document.getElementById('start-btn').addEventListener('click', () => {
    initAudio();
    document.getElementById('start-overlay').style.display = 'none';
    setTimeout(updateGeom, 100);
});

// --- SETTINGS INPUT HANDLERS ---
// Capo
document.getElementById('capo-up').addEventListener('click', () => {
    if(state.capo < 12) state.capo++;
    updateCapoUI();
});
document.getElementById('capo-down').addEventListener('click', () => {
    if(state.capo > 0) state.capo--;
    updateCapoUI();
});

// Tone Selectors
document.querySelectorAll('.sound-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        state.currentTone = e.target.dataset.tone;
        updateToneUI();
    });
});

// --- PHYSICS ENGINE (TOUCH & MOUSE) ---
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
            // Check crossing logic (Up or Down)
            if ((prevY < str.center && currY >= str.center) || 
                (prevY > str.center && currY <= str.center)) {
                
                const dist = Math.abs(currY - prevY);
                // Calculate progress (0.0 to 1.0) of the swipe to schedule sound
                const progress = dist === 0 ? 0 : Math.abs(str.center - prevY) / dist;
                hits.push({ idx, progress });
            }
        });

        // Sort hits by progress to play them in the exact order they were crossed
        hits.sort((a,b) => a.progress - b.progress);
        
        // Schedule sounds (0.04s spread for realistic strumming feel)
        hits.forEach(h => playString(h.idx, h.progress * 0.04));
        
        activeTouches[t.identifier] = currY;
    });
}

// Event Listeners
stringsContainer.addEventListener('touchstart', (e) => {
    initAudio();
    if(stringGeom.length === 0) updateGeom();
    Array.from(e.changedTouches).forEach(t => {
        activeTouches[t.identifier] = t.clientY;
        // Tap check
        stringGeom.forEach((str, idx) => {
            if (Math.abs(t.clientY - str.center) < 30) playString(idx);
        });
    });
}, {passive: false});

stringsContainer.addEventListener('touchmove', handleMove, {passive: false});

stringsContainer.addEventListener('touchend', (e) => {
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
    // Mock a touch event for the physics engine
    const mockE = { changedTouches: [{identifier: 'm', clientY: e.clientY}], preventDefault: ()=>{} };
    handleMove(mockE);
});
window.addEventListener('mouseup', () => { isMouseDown = false; delete activeTouches['m']; });