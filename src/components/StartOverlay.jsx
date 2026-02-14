import React from 'react';
import { initAudio } from '../utils/audioEngine';

export default function StartOverlay({ onStart, currentTone, setTone }) {
  const handleStart = () => {
    initAudio();
    onStart();
  };

  return (
    <div id="start-overlay" style={{ display: 'flex' }}>
      <h1 className="app-title">Pocket Guitar</h1>
      <p className="subtitle">Select tone</p>
      <div className="sound-options overlay-options">
        <button 
          className={`sound-btn ${currentTone === 'acoustic' ? 'selected' : ''}`} 
          onClick={() => setTone('acoustic')}>Acoustic</button>
        <button 
          className={`sound-btn ${currentTone === 'distortion' ? 'selected' : ''}`} 
          onClick={() => setTone('distortion')}>Rock</button>
      </div>
      <button id="start-btn" onClick={handleStart}>PLAY</button>
    </div>
  );
}
