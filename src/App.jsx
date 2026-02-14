import React, { useState, useEffect } from 'react';
import GuitarBody from './components/GuitarBody';
import ChordBar from './components/ChordBar';
import SettingsModal from './components/SettingsModal';
import StartOverlay from './components/StartOverlay';
import RotateMessage from './components/RotateMessage';

const DEFAULT_CHORDS = ["C", "G", "Am", "Em", "D", "F"];

export default function App() {
  const [started, setStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Persisted Logic
  const [activeChords, setActiveChords] = useState(() => {
    try {
      const stored = localStorage.getItem("activeChords");
      return stored ? JSON.parse(stored) : DEFAULT_CHORDS;
    } catch { return DEFAULT_CHORDS; }
  });

  const [currentChord, setCurrentChord] = useState(activeChords[0]);
  const [capo, setCapo] = useState(0);
  const [currentTone, setCurrentTone] = useState("acoustic");

  // Keep Persistence
  useEffect(() => {
    localStorage.setItem("activeChords", JSON.stringify(activeChords));
    // If current chord was removed, reset to first
    if (!activeChords.includes(currentChord)) {
      setCurrentChord(activeChords[0]);
    }
  }, [activeChords]);

  return (
    <>
      <RotateMessage />
      
      {!started && (
        <StartOverlay 
          onStart={() => setStarted(true)} 
          currentTone={currentTone}
          setTone={setCurrentTone}
        />
      )}

      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        activeChords={activeChords}
        setActiveChords={setActiveChords}
        capo={capo}
        setCapo={setCapo}
        currentTone={currentTone}
        setTone={setCurrentTone}
        currentChord={currentChord}
      />

      <div id="main-app">
        <div id="settings-trigger" onClick={() => setSettingsOpen(true)}>⚙</div>
        
        <GuitarBody 
          currentChord={currentChord} 
          capo={capo} 
          currentTone={currentTone} 
        />
        
        <ChordBar 
          activeChords={activeChords} 
          currentChord={currentChord} 
          onSelectChord={setCurrentChord}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>
    </>
  );
}
