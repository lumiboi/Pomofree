import { shouldShowSeoContent } from './authModel';

it('shows SEO content only after auth resolves without a user', () => {
  expect(shouldShowSeoContent(false, null)).toBe(false);
  expect(shouldShowSeoContent(true, null)).toBe(true);
  expect(shouldShowSeoContent(true, { uid: 'user-1' })).toBe(false);
});
