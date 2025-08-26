import React from 'react';
import { themes } from '../themes';

const ThemeSelector = ({ closeModal, handleThemeChange }) => {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Tema Seç</h2>
        <div className="theme-grid">
          {Object.entries(themes).map(([key, theme]) => (
            <button key={key} className="theme-option" onClick={() => handleThemeChange(key)}>
              <div className="theme-preview">
                <span style={{ backgroundColor: theme.colors['--bg-color-pomodoro'] }}></span>
                <span style={{ backgroundColor: theme.colors['--bg-color-short'] }}></span>
                <span style={{ backgroundColor: theme.colors['--bg-color-long'] }}></span>
              </div>
              {theme.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;