import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const SettingsModal = ({ closeModal, tempSettings, setTempSettings, handleSaveSettings }) => {
  const { t } = useTranslation();
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t('settings.title')}</h2>
        <div className="form-group">
          <label>{t('settings.pomodoro')}</label>
          <input 
            type="number" 
            min="1"
            value={tempSettings.pomodoro} 
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value));
              setTempSettings({...tempSettings, pomodoro: value});
            }} 
          />
        </div>
        <div className="form-group">
          <label>{t('settings.shortBreak')}</label>
          <input 
            type="number" 
            min="1"
            value={tempSettings.short} 
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value));
              setTempSettings({...tempSettings, short: value});
            }} 
          />
        </div>
        <div className="form-group">
          <label>{t('settings.longBreak')}</label>
          <input 
            type="number" 
            min="1"
            value={tempSettings.long} 
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value));
              setTempSettings({...tempSettings, long: value});
            }} 
          />
        </div>
        <button onClick={handleSaveSettings} className="btn btn-primary">{t('settings.save')}</button>
        <button onClick={closeModal} className="btn btn-secondary">{t('settings.cancel')}</button>
      </div>
    </div>
  );
};

export default SettingsModal;