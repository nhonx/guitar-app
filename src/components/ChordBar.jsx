import React from 'react';

export default function ChordBar({ activeChords, currentChord, onSelectChord, onOpenSettings }) {
  return (
    <div id="chord-bar">
      {activeChords.map(chord => (
        <button
          key={chord}
          className={`chord-btn ${chord === currentChord ? 'active' : ''}`}
          style={{ fontSize: chord.length > 3 ? '0.8rem' : null }}
          onTouchStart={(e) => { e.preventDefault(); onSelectChord(chord); }} // Using touch start for instant response
          onMouseDown={(e) => { e.preventDefault(); onSelectChord(chord); }}
        >
          {chord}
        </button>
      ))}
      <button className="chord-btn add-btn" onClick={onOpenSettings}>+</button>
    </div>
  );
}
