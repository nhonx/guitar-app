import React, { useEffect, useRef, useState } from 'react';
import { playString, initAudio } from '../utils/audioEngine';

export default function GuitarBody({ currentChord, capo, currentTone }) {
  const stringsRef = useRef(null);
  const [activeTouches, setActiveTouches] = useState({});
  const stringGeom = useRef([]);

  const updateGeom = () => {
    if (!stringsRef.current) return;
    const strings = stringsRef.current.querySelectorAll('.string');
    const containerHeight = stringsRef.current.offsetHeight;
    
    stringGeom.current = Array.from(strings).map(el => {
      const centerY = el.offsetTop + el.offsetHeight / 2;
      return centerY / containerHeight;
    });
  };

  useEffect(() => {
    window.addEventListener('resize', updateGeom);
    // Initial update
    setTimeout(updateGeom, 100);
    return () => window.removeEventListener('resize', updateGeom);
  }, []);

  const getNormalizedY = (clientX, clientY) => {
    let val;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    
    if (isPortrait) {
      val = 1.0 - (clientX / window.innerWidth);
    } else {
      val = clientY / window.innerHeight;
    }

    if (val < 0.05) val = 0.0;
    if (val > 0.95) val = 1.0;
    return val;
  };

  const handleTouchStart = (e) => {
    if(e.cancelable) e.preventDefault(); 
    initAudio();
    if (stringGeom.current.length === 0) updateGeom();

    const newTouches = { ...activeTouches };

    Array.from(e.changedTouches).forEach(t => {
      const yRatio = getNormalizedY(t.clientX, t.clientY);
      newTouches[t.identifier] = yRatio;

      stringGeom.current.forEach((strRatio, idx) => {
        if (Math.abs(yRatio - strRatio) < 0.05) {
          triggerString(idx);
        }
      });
    });
    setActiveTouches(newTouches);
  };

  const handleTouchMove = (e) => {
    if(e.cancelable) e.preventDefault();
    const newTouches = { ...activeTouches };

    Array.from(e.changedTouches).forEach(t => {
      const prevRatio = activeTouches[t.identifier];
      const currRatio = getNormalizedY(t.clientX, t.clientY);

      if (prevRatio === undefined) {
        newTouches[t.identifier] = currRatio;
        return;
      }

      let hits = [];
      stringGeom.current.forEach((strRatio, idx) => {
        if ((prevRatio < strRatio && currRatio >= strRatio) || 
            (prevRatio > strRatio && currRatio <= strRatio)) {
          const swipeDist = Math.abs(currRatio - prevRatio);
          const progress = swipeDist === 0 ? 0 : Math.abs(strRatio - prevRatio) / swipeDist;
          hits.push({ idx, progress });
        }
      });

      hits.sort((a, b) => a.progress - b.progress);
      hits.forEach(h => triggerString(h.idx, h.progress * 0.04));

      newTouches[t.identifier] = currRatio;
    });
    setActiveTouches(newTouches);
  };

  const handleTouchEnd = (e) => {
    const newTouches = { ...activeTouches };
    Array.from(e.changedTouches).forEach(t => delete newTouches[t.identifier]);
    setActiveTouches(newTouches);
  };

  const triggerString = (index, delay = 0) => {
    playString(index, currentChord, capo, currentTone, delay);
    
    // Visual Animation
    const el = stringsRef.current.querySelectorAll('.string-line')[index];
    if (el) {
      el.classList.remove('vibrating');
      void el.offsetWidth; // Trigger reflow
      el.classList.add('vibrating');
      setTimeout(() => el.classList.remove('vibrating'), 200);
    }
  };

  return (
    <div id="guitar-body">
      <div id="sound-hole"></div>
      <div 
        id="strings-container" 
        ref={stringsRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // Passive false is important for preventing scrolling, but React handles event delegation differently.
        // We might need a ref-based event listener if React's synthetic events are passive by default.
        // For now, attempting React events. If scrolling issues occur, we will attach via ref.
        style={{ touchAction: 'none' }} 
      >
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`string s${i}`}><div className="string-line"></div></div>
        ))}
      </div>
    </div>
  );
}
