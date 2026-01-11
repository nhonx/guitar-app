import { initAudio, playString } from './audio-engine.js';
import { state, renderChordBar, setupModalListeners, updateCapoUI, updateToneUI } from './ui-config.js';

// --- INITIALIZATION ---
const openSettings = setupModalListeners(() => renderChordBar(openSettings));
renderChordBar(openSettings);

document.getElementById('start-btn').addEventListener('click', () => {
    initAudio();
    document.getElementById('start-overlay').style.display = 'none';
    setTimeout(updateGeom, 100);
});

// --- SETTINGS INPUT HANDLERS ---
document.getElementById('capo-up').addEventListener('click', () => {
    if(state.capo < 12) state.capo++;
    updateCapoUI();
});
document.getElementById('capo-down').addEventListener('click', () => {
    if(state.capo > 0) state.capo--;
    updateCapoUI();
});
document.querySelectorAll('.sound-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        state.currentTone = e.target.dataset.tone;
        updateToneUI();
    });
});

// --- PHYSICS ENGINE (ORIENTATION AWARE) ---
const stringsContainer = document.getElementById('strings-container');
const stringElements = document.querySelectorAll('.string');

let stringRatios = []; 
let activeTouches = {};

function updateGeom() {
    const totalHeight = stringsContainer.offsetHeight;
    stringRatios = Array.from(stringElements).map(el => {
        const centerY = el.offsetTop + el.offsetHeight / 2;
        return centerY / totalHeight; 
    });
}
window.addEventListener('resize', updateGeom);

function getNormalizedY(touch) {
    let val;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    
    if (isPortrait) {
        // Portrait (Rotated 90deg): Right Edge = Top String (0.0)
        val = 1.0 - (touch.clientX / window.innerWidth);
    } else {
        // Landscape: Top Edge = Top String (0.0)
        val = touch.clientY / window.innerHeight;
    }

    // EDGE FIX: Clamp values slightly outside the bounding box to 0.0 or 1.0
    // This ensures touching the bezel/edge triggers the top/bottom strings
    if (val < 0.05) val = 0.0;
    if (val > 0.95) val = 1.0;

    return val;
}

function handleMove(e) {
    e.preventDefault();
    
    Array.from(e.changedTouches).forEach(t => {
        const prevRatio = activeTouches[t.identifier];
        const currRatio = getNormalizedY(t);
        
        if (prevRatio === undefined) {
            activeTouches[t.identifier] = currRatio;
            return;
        }

        let hits = [];
        
        stringRatios.forEach((strRatio, idx) => {
            // Check crossing logic
            if ((prevRatio < strRatio && currRatio >= strRatio) || 
                (prevRatio > strRatio && currRatio <= strRatio)) {
                
                const swipeDist = Math.abs(currRatio - prevRatio);
                const progress = swipeDist === 0 ? 0 : Math.abs(strRatio - prevRatio) / swipeDist;
                hits.push({ idx, progress });
            }
        });

        hits.sort((a,b) => a.progress - b.progress);
        hits.forEach(h => playString(h.idx, h.progress * 0.04));
        
        activeTouches[t.identifier] = currRatio;
    });
}

stringsContainer.addEventListener('touchstart', (e) => {
    initAudio();
    if(stringRatios.length === 0) updateGeom();
    
    Array.from(e.changedTouches).forEach(t => {
        const yRatio = getNormalizedY(t);
        activeTouches[t.identifier] = yRatio;
        
        // Direct Tap Check with Increased Tolerance (0.05)
        stringRatios.forEach((strRatio, idx) => {
            if (Math.abs(yRatio - strRatio) < 0.05) playString(idx);
        });
    });
}, {passive: false});

stringsContainer.addEventListener('touchmove', handleMove, {passive: false});

stringsContainer.addEventListener('touchend', (e) => {
    Array.from(e.changedTouches).forEach(t => delete activeTouches[t.identifier]);
});

// Mouse Fallback
let isMouseDown = false; 
stringsContainer.addEventListener('mousedown', e => {
    isMouseDown = true;
    const yRatio = getNormalizedY(e);
    activeTouches['m'] = yRatio;
    stringRatios.forEach((strRatio, idx) => {
        if (Math.abs(yRatio - strRatio) < 0.05) playString(idx);
    });
});
window.addEventListener('mousemove', e => {
    if(!isMouseDown) return;
    const mockTouch = { identifier: 'm', clientX: e.clientX, clientY: e.clientY };
    const mockE = { changedTouches: [mockTouch], preventDefault: ()=>{} };
    handleMove(mockE);
});
window.addEventListener('mouseup', () => { isMouseDown = false; delete activeTouches['m']; });