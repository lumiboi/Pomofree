import {
  authorLabel,
  buildReflection,
  containsPersonalInfo,
  getCatFeedMessage,
  isPublishable,
  looksSensitive,
  normalizeVisibility,
  orderReflections,
  REFLECTION_MAX_LENGTH
} from './reflectionModel';

it('defaults to private and never trusts an unknown visibility', () => {
  expect(normalizeVisibility(undefined)).toBe('private');
  expect(normalizeVisibility('everyone')).toBe('private');
  expect(normalizeVisibility('anonymous')).toBe('anonymous');
});

it('keeps the author name out of anonymous and private posts', () => {
  const input = { authorId: 'user-1', displayName: 'Mert', body: 'bugün zordu' };

  expect(buildReflection({ ...input, visibility: 'anonymous' }).displayName).toBe('');
  expect(buildReflection({ ...input, visibility: 'private' }).displayName).toBe('');
  expect(buildReflection({ ...input, visibility: 'public' }).displayName).toBe('Mert');
});

it('trims the body to the limit and flags sensitive content', () => {
  const long = buildReflection({ authorId: 'u', body: 'a'.repeat(REFLECTION_MAX_LENGTH + 50) });
  expect(long.body).toHaveLength(REFLECTION_MAX_LENGTH);

  expect(buildReflection({ authorId: 'u', body: 'kendime zarar vermeyi düşünüyorum' }).isSensitive).toBe(true);
  expect(buildReflection({ authorId: 'u', body: 'bugün 10 dakika çalıştım' }).isSensitive).toBe(false);
  expect(looksSensitive('I want to die')).toBe(true);
});

it('warns about personal information before publishing', () => {
  expect(containsPersonalInfo('bana mert@example.com adresinden yaz')).toBe(true);
  expect(containsPersonalInfo('numaram 0532 111 22 33')).toBe(true);
  expect(containsPersonalInfo('instagram hesabımdan yazabilirsin')).toBe(true);
  expect(containsPersonalInfo('bugün kendime iyi davrandım')).toBe(false);
});

it('refuses to publish an empty body', () => {
  expect(isPublishable('   ')).toBe(false);
  expect(isPublishable('bir satır')).toBe(true);
});

it('shows the anonymous label unless the post is public', () => {
  expect(authorLabel({ visibility: 'anonymous', displayName: '' }, 'Bir Pomofree kullanıcısı'))
    .toBe('Bir Pomofree kullanıcısı');
  expect(authorLabel({ visibility: 'public', displayName: 'Mert' }, 'Bir Pomofree kullanıcısı'))
    .toBe('Mert');
});

it('surfaces the least supported posts first and honours hidden lists', () => {
  const feed = [
    { id: 'a', authorId: 'u1', supportCount: 5, createdAt: new Date('2026-08-06T10:00:00') },
    { id: 'b', authorId: 'u2', supportCount: 0, createdAt: new Date('2026-08-06T09:00:00') },
    { id: 'c', authorId: 'u3', supportCount: 0, createdAt: new Date('2026-08-06T11:00:00') }
  ];

  expect(orderReflections(feed).map(item => item.id)).toEqual(['c', 'b', 'a']);
  expect(orderReflections(feed, { hiddenIds: ['c'] }).map(item => item.id)).toEqual(['b', 'a']);
  expect(orderReflections(feed, { hiddenAuthorIds: ['u2'] }).map(item => item.id)).toEqual(['c', 'a']);
});

it('never writes an author id onto an anonymous post', () => {
  const anonymous = buildReflection({ authorId: 'user-1', displayName: 'Mert', body: 'not', visibility: 'anonymous' });
  const open = buildReflection({ authorId: 'user-1', displayName: 'Mert', body: 'not', visibility: 'public' });

  expect(anonymous.authorId).toBe('');
  expect(anonymous.displayName).toBe('');
  expect(open.authorId).toBe('user-1');
  expect(anonymous.moderationStatus).toBe('published');
  expect(anonymous.kind).toBe('reflection');
});

it('splits the feed by kind, day and ownership instead of popularity', () => {
  const now = new Date('2026-08-06T12:00:00');
  const feed = [
    { id: 'a', kind: 'reflection', createdAt: new Date('2026-08-06T09:00:00') },
    { id: 'b', kind: 'rest', createdAt: new Date('2026-08-05T09:00:00') },
    { id: 'c', kind: 'progress', createdAt: new Date('2026-08-06T11:00:00') }
  ];

  expect(orderReflections(feed, { tab: 'today', now }).map(i => i.id).sort()).toEqual(['a', 'c']);
  expect(orderReflections(feed, { tab: 'rest', now }).map(i => i.id)).toEqual(['b']);
  expect(orderReflections(feed, { tab: 'mine', ownedIds: ['c'], now }).map(i => i.id)).toEqual(['c']);
});

it('keeps removed posts out of the feed but leaves limited ones visible', () => {
  const feed = [
    { id: 'a', moderationStatus: 'removed', createdAt: new Date() },
    { id: 'b', moderationStatus: 'limited', createdAt: new Date() },
    { id: 'c', createdAt: new Date() }
  ];

  expect(orderReflections(feed).map(i => i.id).sort()).toEqual(['b', 'c']);
});

it('gives the cat a feed line that never diagnoses anyone', () => {
  expect(getCatFeedMessage([])).toBe('quiet');
  expect(getCatFeedMessage([{ kind: 'rest' }, { kind: 'rest' }])).toBe('restingTogether');
  expect(getCatFeedMessage([{ kind: 'progress' }, { kind: 'progress' }])).toBe('smallSteps');
  expect(getCatFeedMessage([{ kind: 'reflection' }])).toBe('sittingNearby');
});
