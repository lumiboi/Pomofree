import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const SupportModal = ({ onClose }) => {
  const { t } = useTranslation();

  const openPatreon = () => {
    window.open('https://www.patreon.com/c/lumiboi/membership', '_blank');
  };

  const openKreosus = () => {
    window.open('https://kreosus.com/lumi', '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t('support.title')}</h2>
        <p style={{ marginTop: '8px', fontWeight: 600 }}>{t('support.subtitle')}</p>
        <p style={{ marginTop: '8px' }}>{t('support.body1')}</p>
        <p style={{ marginTop: '8px' }}>{t('support.body2')}</p>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={openPatreon}>{t('support.patreon')}</button>
          <button className="btn btn-primary" onClick={openKreosus}>{t('support.kreosus')}</button>
          <button className="btn btn-secondary" onClick={onClose}>{t('support.notToday')}</button>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;






