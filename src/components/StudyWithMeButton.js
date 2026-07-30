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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="8" cy="7" r="3" />
            <circle cx="17" cy="8" r="2.5" />
            <path d="M2.75 20v-2.25A4.75 4.75 0 0 1 7.5 13h1A4.75 4.75 0 0 1 13 17.75V20" />
            <path d="M14.25 13.8A4.25 4.25 0 0 1 21.25 17v3" />
          </svg>
        </div>
        <span className="btn-text">{t('studyRoom.studyWithMe')}</span>
      </button>
    </div>
  );
};

export default StudyWithMeButton;
