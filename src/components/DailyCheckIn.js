import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { CAPACITY_LEVELS, getSuggestedFocus } from '../effortModel';
import './DailyCheckIn.css';

/**
 * Günlük kapasite seçimi (plan §9.1). Seçim başarısızlık puanı üretmez;
 * yalnızca önerilen hedefi küçültür.
 */
const DailyCheckIn = ({ capacity, onSelect, onApplySuggestion }) => {
  const { t } = useTranslation();
  const suggestion = capacity ? getSuggestedFocus(capacity) : null;

  return (
    <section className="daily-checkin card" aria-labelledby="daily-checkin-title">
      <h2 id="daily-checkin-title">{t('checkIn.title')}</h2>
      <p className="daily-checkin-note">{t('checkIn.subtitle')}</p>

      <div className="daily-checkin-options" role="group" aria-labelledby="daily-checkin-title">
        {CAPACITY_LEVELS.map(level => (
          <button
            key={level}
            type="button"
            className={`daily-checkin-option${capacity === level ? ' is-active' : ''}`}
            aria-pressed={capacity === level}
            onClick={() => onSelect(level)}
          >
            {t(`checkIn.capacity.${level}`)}
          </button>
        ))}
      </div>

      {suggestion && (
        <div className="daily-checkin-suggestion">
          <p>
            {t('checkIn.suggestionPrefix')} {suggestion.minutes} {t('checkIn.suggestionSuffix')}
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => onApplySuggestion(suggestion.minutes)}>
            {t('checkIn.applySuggestion')}
          </button>
        </div>
      )}
    </section>
  );
};

export default DailyCheckIn;
