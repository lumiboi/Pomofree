export const SOCIAL_LIMITS = {
  profiles: 100,
  posts: 30,
  comments: 40,
  postLength: 400,
  commentLength: 240
};

export const SOCIAL_MOODS = ['progress', 'victory', 'question', 'break'];
export const SOCIAL_REACTIONS = ['support', 'spark', 'focus'];

export const cleanSocialText = (value, maxLength) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

export const getWeekStart = (value = new Date()) => {
  const date = new Date(value);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const getWeekKey = value => getWeekStart(value).toISOString().slice(0, 10);

const asDate = value => {
  if (value?.toDate) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const buildWeeklyProfile = ({ sessions = [], user, now = new Date() }) => {
  const start = getWeekStart(now);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const weekly = sessions.filter(session => {
    const completedAt = asDate(session.completedAt || session.endedAt);
    return completedAt && completedAt >= start && completedAt < end && completedAt <= now;
  });
  const activeDays = new Set();
  const projectIds = new Set();
  let seconds = 0;

  weekly.forEach(session => {
    const completedAt = asDate(session.completedAt || session.endedAt);
    const duration = Number(
      session.duration ?? session.actualDurationSeconds ?? session.plannedDurationSeconds ?? 0
    );
    seconds += Math.max(0, Math.min(Number.isFinite(duration) ? duration : 0, 43200));
    activeDays.add(completedAt.toISOString().slice(0, 10));
    if (session.projectId) projectIds.add(String(session.projectId));
  });

  return {
    userId: user.uid,
    displayName: cleanSocialText(user.displayName, 50) || 'Pomofree Kullanıcısı',
    weekKey: getWeekKey(now),
    weeklyMinutes: Math.min(10080, Math.floor(seconds / 60)),
    completedSessions: weekly.length,
    activeDays: activeDays.size,
    projectCount: projectIds.size
  };
};

export const rankProfiles = (profiles, metric, limit = 5) => [...profiles]
  .sort((first, second) => (
    (Number(second[metric]) || 0) - (Number(first[metric]) || 0) ||
    (Number(second.weeklyMinutes) || 0) - (Number(first.weeklyMinutes) || 0) ||
    (Number(second.completedSessions) || 0) - (Number(first.completedSessions) || 0) ||
    String(first.displayName || '').localeCompare(String(second.displayName || ''), 'tr')
  ))
  .slice(0, limit);
