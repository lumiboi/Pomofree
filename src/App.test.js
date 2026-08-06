import { shouldShowSeoContent, shouldShowUserDataContent } from './authModel';

it('shows SEO content only after auth resolves without a user', () => {
  expect(shouldShowSeoContent(false, null)).toBe(false);
  expect(shouldShowSeoContent(true, null)).toBe(true);
  expect(shouldShowSeoContent(true, { uid: 'user-1' })).toBe(false);
});

it('keeps signed-in content hidden until Firestore data is ready', () => {
  const user = { uid: 'user-1' };

  expect(shouldShowUserDataContent(user, 'loading')).toBe(false);
  expect(shouldShowUserDataContent(user, 'error')).toBe(false);
  expect(shouldShowUserDataContent(user, 'ready')).toBe(true);
  expect(shouldShowUserDataContent(null, 'idle')).toBe(true);
});
