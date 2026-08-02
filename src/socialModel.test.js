import {
  buildSocialProfile,
  cleanSocialText,
  rankProfiles
} from './socialModel';

test('sosyal profil kullanıcının kayıtlı tüm seanslarını özetler', () => {
  const now = new Date('2026-08-05T12:00:00.000Z');
  const sessions = [
    { duration: 1500, completedAt: new Date('2026-08-03T09:00:00.000Z'), projectId: 'a' },
    { actualDurationSeconds: 1800, completedAt: new Date('2026-08-04T09:00:00.000Z'), projectId: 'b' },
    { duration: 900, completedAt: new Date('2026-07-31T09:00:00.000Z'), projectId: 'old' }
  ];

  expect(buildSocialProfile({
    sessions,
    user: { uid: 'u1', displayName: '  Ada  ', email: 'private@example.com' },
    now
  })).toEqual({
    userId: 'u1',
    displayName: 'Ada',
    totalMinutes: 70,
    completedSessions: 3,
    activeDays: 3,
    projectCount: 3
  });
});

test('sosyal metinleri ve sıralama sonuçlarını sınırlı tutar', () => {
  expect(cleanSocialText('  merhaba dünya  ', 20)).toBe('merhaba dünya');
  expect(cleanSocialText('123456', 4)).toBe('1234');

  expect(rankProfiles([
    { userId: 'b', totalMinutes: 30, completedSessions: 3 },
    { userId: 'a', totalMinutes: 60, completedSessions: 2 },
    { userId: 'c', totalMinutes: 60, completedSessions: 4 }
  ], 'totalMinutes', 2).map(item => item.userId)).toEqual(['c', 'a']);
});
