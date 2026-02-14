import React, { useState, useEffect } from 'react';
import { chordLibrary } from '../constants';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  activeChords, 
  setActiveChords, 
  capo, 
  setCapo, 
  currentTone, 
  setTone,
  currentChord
}) {
  const [presets, setPresets] = useState({});

  useEffect(() => {
    const p = localStorage.getItem('guitarPresets');
    if (p) setPresets(JSON.parse(p));
  }, [isOpen]);

  const toggleChord = (chord) => {
    let newChords;
    if (activeChords.includes(chord)) {
      newChords = activeChords.filter(c => c !== chord);
    } else {
      newChords = [...activeChords, chord];
    }
    
    // Ensure at least one chord
    if(newChords.length === 0) newChords = ['C'];
    
    setActiveChords(newChords);
  };

  const savePreset = () => {
    const name = prompt("Enter preset name:", activeChords.join(" - "));
    if (name && name.trim()) {
      const newPresets = { ...presets, [name.trim()]: { chords: activeChords, capo } };
      setPresets(newPresets);
      localStorage.setItem("guitarPresets", JSON.stringify(newPresets));
    }
  };

  const loadPreset = (name) => {
    const data = presets[name];
    if (data.chords) {
      setActiveChords(data.chords);
      setCapo(data.capo || 0);
    } else {
      // Legacy support if just array
      setActiveChords(data);
      setCapo(0);
    }
  };

  const deletePreset = (name, e) => {
    e.stopPropagation();
    if (confirm("Delete preset?")) {
      const newPresets = { ...presets };
      delete newPresets[name];
      setPresets(newPresets);
      localStorage.setItem("guitarPresets", JSON.stringify(newPresets));
    }
  };

  if (!isOpen) return null;

  return (
    <div id="settings-modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-title">Settings</span>
          <span className="close-icon" onClick={onClose}>✕</span>
        </div>
        
        <div className="setting-label">Presets</div>
        <div className="preset-controls">
          <button className="action-btn" onClick={savePreset}>Save Current Set</button>
          <div id="preset-list">
            {Object.keys(presets).length === 0 ? (
               <div style={{color:'#666', fontSize:'0.8rem', fontStyle:'italic'}}>No saved presets</div>
            ) : (
              Object.keys(presets).map(name => (
                <div key={name} className="preset-item">
                  <span className="preset-name" onClick={() => loadPreset(name)}>{name}</span>
                  <button className="preset-del" onClick={(e) => deletePreset(name, e)}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="setting-label">Capo (Key Shift)</div>
        <div className="capo-controls">
          <button className="capo-btn" onClick={() => setCapo(Math.max(0, capo - 1))}>-</button>
          <span id="capo-display">{capo === 0 ? "0" : `+${capo}`}</span>
          <button className="capo-btn" onClick={() => setCapo(Math.min(12, capo + 1))}>+</button>
        </div>

        <div className="setting-label">Tone</div>
        <div className="sound-options">
          <button 
            className={`sound-btn ${currentTone === 'acoustic' ? 'selected' : ''}`} 
            onClick={() => setTone('acoustic')}>Acoustic</button>
          <button 
            className={`sound-btn ${currentTone === 'distortion' ? 'selected' : ''}`} 
            onClick={() => setTone('distortion')}>Rock</button>
        </div>

        <div className="setting-label">Chord Library</div>
        <div className="chord-grid" id="library-grid">
          {Object.keys(chordLibrary).sort().map(chord => (
             <button 
               key={chord}
               className={`lib-btn ${activeChords.includes(chord) ? 'added' : ''} ${
                 chord.includes('#') || chord.includes('b') ? 'sharp' : chord.includes('m') ? 'minor' : ''
               }`}
               onClick={() => toggleChord(chord)}
             >
               {chord}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
}
