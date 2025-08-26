import React from 'react';

const SettingsModal = ({ closeModal, tempSettings, setTempSettings, handleSaveSettings }) => {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Ayarlar</h2>
        <div className="form-group">
          <label>Pomodoro (dakika)</label>
          <input 
            type="number" 
            value={tempSettings.pomodoro} 
            onChange={(e) => setTempSettings({...tempSettings, pomodoro: Number(e.target.value)})} 
          />
        </div>
        <div className="form-group">
          <label>Kısa Mola (dakika)</label>
          <input 
            type="number" 
            value={tempSettings.short} 
            onChange={(e) => setTempSettings({...tempSettings, short: Number(e.target.value)})} 
          />
        </div>
        <div className="form-group">
          <label>Uzun Mola (dakika)</label>
          <input 
            type="number" 
            value={tempSettings.long} 
            onChange={(e) => setTempSettings({...tempSettings, long: Number(e.target.value)})} 
          />
        </div>
        <button onClick={handleSaveSettings} className="btn btn-primary">Kaydet</button>
        <button onClick={closeModal} className="btn btn-secondary">Kapat</button>
      </div>
    </div>
  );
};

export default SettingsModal;