import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './RoomTimer.css';

const RoomTimer = ({ mode, time, isActive, switchMode, toggleTimer, formatTime, totalTime }) => {
  const { t } = useTranslation();
  
  // Progress hesaplama (0-100 arası)
  const progress = totalTime > 0 ? ((totalTime - time) / totalTime) * 100 : 0;
  
  // Dairesel progress bar için SVG
  const radius = 120;
  const strokeWidth = 12;
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
    <div className="room-timer-container-main">
      <div className="room-timer-modes">
        <button onClick={() => handleModeChange('pomodoro')} className={`room-mode-btn ${mode === 'pomodoro' ? 'active' : ''}`}>{t('timer.pomodoro')}</button>
        <button onClick={() => handleModeChange('short')} className={`room-mode-btn ${mode === 'short' ? 'active' : ''}`}>{t('timer.shortBreak')}</button>
        <button onClick={() => handleModeChange('long')} className={`room-mode-btn ${mode === 'long' ? 'active' : ''}`}>{t('timer.longBreak')}</button>
      </div>
      
      <div className="room-timer-display">
        <div className="room-circular-progress">
          <svg
            className="room-progress-ring"
            width={radius * 2}
            height={radius * 2}
          >
            {/* Background circle */}
            <circle
              className="room-progress-ring-circle-bg"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Progress circle */}
            <circle
              className={`room-progress-ring-circle ${isActive ? 'active' : 'inactive'}`}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <div className="room-timer-text">
            <h1>{formatTime(time)}</h1>
          </div>
        </div>
      </div>
      
      <button onClick={handleTimerToggle} className="room-timer-start-btn">
        {isActive ? t('timer.stop') : t('timer.start')}
      </button>
    </div>
  );
};

export default RoomTimer;
