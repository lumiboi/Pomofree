import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Timer = ({
  mode,
  time,
  isActive,
  switchMode,
  toggleTimer,
  formatTime,
  totalTime,
  sessionGoal = '',
  setSessionGoal,
  goalRequired = false,
  onEmergencyStart,
  adaptiveSuggestion,
  onAcceptSuggestion,
  onRejectSuggestion,
  onOpenSettings
}) => {
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
      {onOpenSettings && (
        <button
          type="button"
          className="timer-quick-settings"
          onClick={onOpenSettings}
          aria-label={t('timer.quickSettings')}
          title={t('timer.quickSettings')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 4-.1-1.2 2-1.5-2-3.4-2.4 1a8 8 0 0 0-2-1.2L15.2 3h-4l-.4 2.7a8 8 0 0 0-2 1.2l-2.5-1-2 3.4 2 1.5A8 8 0 0 0 6.2 12l.1 1.2-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2 1.2l.4 2.7h4l.4-2.7a8 8 0 0 0 2-1.2l2.5 1 2-3.4-2-1.5.1-1.2Z" />
          </svg>
        </button>
      )}
      <div className="timer-modes">
        <button aria-pressed={mode === 'pomodoro'} onClick={() => handleModeChange('pomodoro')} className={`btn mode-btn ${mode === 'pomodoro' ? 'active' : ''}`}>{t('timer.pomodoro')}</button>
        <button aria-pressed={mode === 'short'} onClick={() => handleModeChange('short')} className={`btn mode-btn ${mode === 'short' ? 'active' : ''}`}>{t('timer.shortBreak')}</button>
        <button aria-pressed={mode === 'long'} onClick={() => handleModeChange('long')} className={`btn mode-btn ${mode === 'long' ? 'active' : ''}`}>{t('timer.longBreak')}</button>
      </div>

      {mode === 'pomodoro' && setSessionGoal && (
        <label className={`timer-session-goal ${isActive ? 'active' : ''}`}>
          <span>{t('timer.sessionGoal')}{goalRequired ? ' *' : ''}</span>
          {isActive ? (
            <strong>{sessionGoal || t('timer.noGoal')}</strong>
          ) : (
            <input
              value={sessionGoal}
              onChange={event => setSessionGoal(event.target.value)}
              maxLength={300}
              placeholder={t('timer.sessionGoalPlaceholder')}
              required={goalRequired}
            />
          )}
        </label>
      )}

      {mode === 'pomodoro' && !isActive && adaptiveSuggestion && (
        <div className="timer-adaptive-tip">
          <div>
            <strong>{t('timer.adaptiveTitle')}</strong>
            <span>
              {adaptiveSuggestion.sampleSize} {t('timer.sessionsBased')} · {adaptiveSuggestion.completionRate}% {t('timer.completion')}
            </span>
            <span>
              {t(`timer.scope.${adaptiveSuggestion.scope}`)} · {t('timer.averageDuration')} {adaptiveSuggestion.averageMinutes} {t('stats.minutes')}
            </span>
          </div>
          <div className="timer-adaptive-actions">
            <button type="button" onClick={() => onAcceptSuggestion(adaptiveSuggestion)}>
              {adaptiveSuggestion.recommendedMinutes} {t('stats.minutes')} {t('timer.try')}
            </button>
            <button type="button" className="btn-link" onClick={() => onRejectSuggestion(adaptiveSuggestion)}>
              {t('timer.notNow')}
            </button>
          </div>
        </div>
      )}
      
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
          <div className="timer-text" aria-live="off" aria-label={formatTime(time)}>
            <h2>{formatTime(time)}</h2>
          </div>
        </div>
      </div>
      
      <div className={`timer-primary-actions ${mode === 'pomodoro' && !isActive && onEmergencyStart ? 'has-emergency' : ''}`}>
        <button onClick={handleTimerToggle} className="btn btn-start" aria-pressed={isActive}>
          <span className="timer-toggle-icon" aria-hidden="true">{isActive ? '■' : '▶'}</span>
          {isActive ? t('timer.stop') : t('timer.start')}
        </button>
        {mode === 'pomodoro' && !isActive && onEmergencyStart && (
          <button type="button" className="timer-emergency-start" onClick={onEmergencyStart}>
            {t('timer.emergencyStart')}
          </button>
        )}
      </div>
    </div>
  );
};

export default Timer;
