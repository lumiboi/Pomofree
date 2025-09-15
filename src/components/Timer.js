import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Timer = ({ mode, time, isActive, switchMode, toggleTimer, formatTime, totalTime }) => {
  const { t } = useTranslation();
  
  // Progress hesaplama (0-100 arası)
  const progress = totalTime > 0 ? ((totalTime - time) / totalTime) * 100 : 0;
  
  // Dairesel progress bar için SVG
  const radius = 80;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const handleModeChange = (newMode) => {
    switchMode(newMode);
  };

  const handleTimerToggle = () => {
    toggleTimer();
  };

  return (
    <div className="card timer-card">
      <div className="timer-modes">
        <button onClick={() => handleModeChange('pomodoro')} className={`btn mode-btn ${mode === 'pomodoro' ? 'active' : ''}`}>{t('timer.pomodoro')}</button>
        <button onClick={() => handleModeChange('short')} className={`btn mode-btn ${mode === 'short' ? 'active' : ''}`}>{t('timer.shortBreak')}</button>
        <button onClick={() => handleModeChange('long')} className={`btn mode-btn ${mode === 'long' ? 'active' : ''}`}>{t('timer.longBreak')}</button>
      </div>
      
      <div className="timer-display">
        <div className="circular-progress">
          <svg
            className="progress-ring"
            width={radius * 2}
            height={radius * 2}
          >
            {/* Background circle */}
            <circle
              className="progress-ring-circle-bg"
              stroke="var(--progress-bg-color, #e0e0e0)"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Progress circle */}
            <circle
              className={`progress-ring-circle ${isActive ? 'active' : 'inactive'}`}
              stroke="var(--progress-color, #4ECDC4)"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <div className="timer-text">
            <h2>{formatTime(time)}</h2>
          </div>
        </div>
      </div>
      
      <button onClick={handleTimerToggle} className="btn btn-start">
        {isActive ? t('timer.stop') : t('timer.start')}
      </button>
    </div>
  );
};

export default Timer;