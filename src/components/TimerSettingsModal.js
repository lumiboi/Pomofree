import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const fields = [
  ['pomodoro', 'pomodoro'],
  ['short', 'shortBreak'],
  ['long', 'longBreak']
];

const TimerSettingsModal = ({ settings, onSave, onClose }) => {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => ({
    pomodoro: settings.pomodoro,
    short: settings.short,
    long: settings.long
  }));
  const update = (key, value) => setValues(current => ({
    ...current,
    [key]: Math.min(180, Math.max(1, Number(value) || 1))
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-content quick-timer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-timer-title"
        onClick={event => event.stopPropagation()}
        onSubmit={event => {
          event.preventDefault();
          onSave(values);
        }}
      >
        <h2 id="quick-timer-title">{t('settings.quickTimerTitle')}</h2>
        <div className="timer-settings-grid">
          {fields.map(([key, label]) => (
            <label key={key} htmlFor={`quick-${key}`}>
              <span>{t(`settings.${label}`)}</span>
              <input
                id={`quick-${key}`}
                type="number"
                min="1"
                max="180"
                value={values[key]}
                onChange={event => update(key, event.target.value)}
              />
            </label>
          ))}
        </div>
        <footer className="settings-footer">
          <button type="submit" className="btn btn-primary">{t('settings.save')}</button>
          <button type="button" onClick={onClose} className="btn btn-secondary">{t('settings.cancel')}</button>
        </footer>
      </form>
    </div>
  );
};

export default TimerSettingsModal;
