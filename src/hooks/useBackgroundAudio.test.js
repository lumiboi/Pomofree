import { SESSION_END_AUDIO } from './useBackgroundAudio';

test('seans bitiş kuşu kısa süreli yerel kaydı kullanır', () => {
  expect(SESSION_END_AUDIO).toEqual({
    url: '/sounds/session-birds.mp3',
    maxDurationMs: 2200
  });
});
