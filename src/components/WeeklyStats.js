import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export const formatFocusTime = (totalSeconds, t) => {
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

export const sumFocusSessions = (sessions, startOfToday) => sessions.reduce(
  (totals, session) => {
    const duration = Number(session.duration) || 0;
    const completedAt = session.completedAt?.toDate
      ? session.completedAt.toDate()
      : new Date(session.completedAt);

    totals.totalSeconds += duration;
    if (!Number.isNaN(completedAt.getTime()) && completedAt >= startOfToday) {
      totals.todaySeconds += duration;
    }
    return totals;
  },
  { totalSeconds: 0, todaySeconds: 0 }
);

const WeeklyStats = ({ todaySeconds = 0, totalSeconds = 0 }) => {
  const { t } = useTranslation();
  return (
    <div className="focus-stats-container" aria-label={t('stats.focusSummary')}>
      <div>
        <span>{t('stats.today')}</span>
        <strong>{formatFocusTime(todaySeconds, t)}</strong>
      </div>
      <div>
        <span>{t('stats.thisWeek')}</span>
        <strong>{formatFocusTime(totalSeconds, t)}</strong>
      </div>
    </div>
  );
};

export default WeeklyStats;
