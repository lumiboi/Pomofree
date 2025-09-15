import React from 'react';
import { themes } from '../themes';
import { useTranslation } from '../hooks/useTranslation';

const ThemeSelector = ({ closeModal, handleThemeChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="modal-overlay" onClick={closeModal}>
      {/* 
        Aşağıdaki div'e `theme-modal-content` class'ı eklendi.
        onClick olayına e.stopPropagation() eklendi ki modalın içine tıklandığında kapanmasın.
      */}
      <div className="modal-content theme-modal-content" onClick={(e) => e.stopPropagation()}>
        
        <h2>{t('themes.selectTheme')}</h2>
        
        <div className="theme-grid">
          {Object.entries(themes).map(([key, theme]) => (
            <button key={key} className="theme-option" onClick={() => {
              handleThemeChange(key);
              closeModal(); // Tema seçince de otomatik kapansın
            }}>
              <div className="theme-preview">
                <span style={{ backgroundColor: theme.colors['--bg-color-pomodoro'] }}></span>
                <span style={{ backgroundColor: theme.colors['--bg-color-short'] }}></span>
                <span style={{ backgroundColor: theme.colors['--bg-color-long'] }}></span>
              </div>
              {t(`themes.${key}`)}
            </button>
          ))}
        </div>

        {/* YENİ: Kapat butonu için footer alanı */}
        <div className="theme-modal-footer">
            <button onClick={closeModal} className="btn btn-secondary">{t('general.close')}</button>
        </div>

      </div>
    </div>
  );
};

export default ThemeSelector;