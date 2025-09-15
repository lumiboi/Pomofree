import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const formatFocusTime = (totalSeconds, t) => {
  // YENİ: Süre sıfır ise "0 dakika" yaz
  if (totalSeconds === 0) return `0 ${t('stats.minutes')}`;
  
  if (totalSeconds < 60) return `1 ${t('stats.minutes')} ${t('stats.less')}`;
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let result = '';
  if (hours > 0) {
    result += `${hours} ${t('stats.hours')} `;
  }
  if (minutes > 0) {
    result += `${minutes} ${t('stats.minutes')}`;
  }
  
  return result.trim();
};

const WeeklyStats = ({ totalSeconds }) => {
  const { t } = useTranslation();
  return (
    <div className="weekly-stats-container">
      {t('stats.thisWeek')} <strong>{formatFocusTime(totalSeconds, t)}</strong> {t('stats.focused')}
    </div>
  );
};

export default WeeklyStats;