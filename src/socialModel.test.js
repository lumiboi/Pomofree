import {
  buildWeeklyProfile,
  cleanSocialText,
  getWeekKey,
  rankProfiles
} from './socialModel';

test('haftalık profil yalnızca mevcut haftanın güvenli özetini çıkarır', () => {
  const now = new Date('2026-08-05T12:00:00.000Z');
  const sessions = [
    { duration: 1500, completedAt: new Date('2026-08-03T09:00:00.000Z'), projectId: 'a' },
    { actualDurationSeconds: 1800, completedAt: new Date('2026-08-04T09:00:00.000Z'), projectId: 'b' },
    { duration: 900, completedAt: new Date('2026-07-31T09:00:00.000Z'), projectId: 'old' }
  ];

  expect(buildWeeklyProfile({
    sessions,
    user: { uid: 'u1', displayName: '  Ada  ', email: 'private@example.com' },
    now
  })).toEqual({
    userId: 'u1',
    displayName: 'Ada',
    weekKey: '2026-08-03',
    weeklyMinutes: 55,
    completedSessions: 2,
    activeDays: 2,
    projectCount: 2
  });
});

test('sosyal metinleri ve sıralama sonuçlarını sınırlı tutar', () => {
  expect(cleanSocialText('  merhaba dünya  ', 20)).toBe('merhaba dünya');
  expect(cleanSocialText('123456', 4)).toBe('1234');
  expect(getWeekKey(new Date('2026-08-09T23:59:00.000Z'))).toBe('2026-08-03');

  expect(rankProfiles([
    { userId: 'b', weeklyMinutes: 30, completedSessions: 3 },
    { userId: 'a', weeklyMinutes: 60, completedSessions: 2 },
    { userId: 'c', weeklyMinutes: 60, completedSessions: 4 }
  ], 'weeklyMinutes', 2).map(item => item.userId)).toEqual(['c', 'a']);
});
