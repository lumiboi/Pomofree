import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './PatreonSupport.css';

const PatreonSupport = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);

  const handlePatreonClick = () => {
    window.open('https://www.patreon.com/c/lumiboi/membership', '_blank');
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="patreon-support">
      <div className="patreon-content">
        <div className="patreon-icon">💝</div>
        <div className="patreon-text">
          <h3>{t('patreon.title')}</h3>
          <p>{t('patreon.description')}</p>
        </div>
        <button 
          className="patreon-button"
          onClick={handlePatreonClick}
          title={t('patreon.buttonTitle')}
        >
          {t('patreon.supportButton')}
        </button>
        <button 
          className="patreon-close"
          onClick={handleClose}
          title={t('patreon.close')}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default PatreonSupport;
