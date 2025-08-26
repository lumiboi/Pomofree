import React from 'react';

const Timer = ({ mode, time, isActive, switchMode, toggleTimer, formatTime }) => {
  return (
    <div className="card timer-card">
      <div className="timer-modes">
        <button onClick={() => switchMode('pomodoro')} className={`btn mode-btn ${mode === 'pomodoro' ? 'active' : ''}`}>Pomodoro</button>
        <button onClick={() => switchMode('short')} className={`btn mode-btn ${mode === 'short' ? 'active' : ''}`}>Kısa Mola</button>
        <button onClick={() => switchMode('long')} className={`btn mode-btn ${mode === 'long' ? 'active' : ''}`}>Uzun Mola</button>
      </div>
      <div className="timer-display">
        <h2>{formatTime(time)}</h2>
      </div>
      <button onClick={toggleTimer} className="btn btn-start">
        {isActive ? 'DURDUR' : 'BAŞLAT'}
      </button>
    </div>
  );
};

export default Timer;