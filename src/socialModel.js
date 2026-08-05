export const SOCIAL_LIMITS = {
  profiles: 300,
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

export const maskDisplayName = value => cleanSocialText(value, 50)
  .split(/\s+/)
  .filter(Boolean)
  .map(part => {
    const characters = Array.from(part);
    return `${characters[0].toLocaleUpperCase('tr-TR')}${'*'.repeat(Math.max(0, characters.length - 1))}`;
  })
  .join(' ');

const asDate = value => {
  if (value?.toDate) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const buildSocialProfile = ({
  sessions = [],
  user,
  now = new Date(),
  publicProfile = false,
  profilePhoto = ''
}) => {
  const completed = sessions.filter(session => {
    const completedAt = asDate(session.completedAt || session.endedAt);
    return completedAt && completedAt <= now;
  });
  const activeDays = new Set();
  const projectIds = new Set();
  let seconds = 0;

  completed.forEach(session => {
    const completedAt = asDate(session.completedAt || session.endedAt);
    const duration = Number(
      session.duration ?? session.actualDurationSeconds ?? session.plannedDurationSeconds ?? 0
    );
    seconds += Math.max(0, Math.min(Number.isFinite(duration) ? duration : 0, 43200));
    activeDays.add(completedAt.toISOString().slice(0, 10));
    if (session.projectId) projectIds.add(String(session.projectId));
  });

  const displayName = cleanSocialText(user.displayName, 50) || 'Pomofree Kullanıcısı';
  return {
    userId: user.uid,
    displayName: publicProfile ? displayName : maskDisplayName(displayName),
    profilePhoto: publicProfile ? cleanSocialText(profilePhoto, 100000) : '',
    publicProfile: Boolean(publicProfile),
    totalMinutes: Math.min(5256000, Math.floor(seconds / 60)),
    completedSessions: completed.length,
    activeDays: activeDays.size,
    projectCount: projectIds.size
  };
};

export const rankProfiles = (profiles, metric, limit = 5) => [...profiles]
  .sort((first, second) => (
    (Number(second[metric]) || 0) - (Number(first[metric]) || 0) ||
    (Number(second.totalMinutes) || 0) - (Number(first.totalMinutes) || 0) ||
    (Number(second.completedSessions) || 0) - (Number(first.completedSessions) || 0) ||
    String(first.displayName || '').localeCompare(String(second.displayName || ''), 'tr')
  ))
  .slice(0, limit);
