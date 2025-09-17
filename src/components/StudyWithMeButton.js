import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './StudyWithMeButton.css';

const StudyWithMeButton = ({ onCreateRoom, activeTheme }) => {
  const { t } = useTranslation();

  return (
    <div className="study-with-me-container">
      <button 
        className={`study-with-me-btn theme-${activeTheme}`}
        onClick={onCreateRoom}
      >
        <div className="btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-2.99 4 1.6 1.2L15.99 11H17v11h3zm-12.5 0v-6.5H9L7.1 6.63C6.8 5.55 5.85 5 4.82 5H4c-.8 0-1.54.37-2.01 1L-.01 10l1.6 1.2L3.99 8H5v14h2.5z"/>
          </svg>
        </div>
        <span className="btn-text">{t('studyRoom.studyWithMe')}</span>
      </button>
    </div>
  );
};

export default StudyWithMeButton;
