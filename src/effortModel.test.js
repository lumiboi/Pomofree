import {
  CAT_STAGES,
  contributorName,
  DAILY_CONTRIBUTION_CAP,
  getCatMood,
  getCatStage,
  getEffortAward,
  getSeasonId,
  getSuggestedFocus,
  getUnlockedItems,
  isReturnAfterBreak,
  isWeeklyReviewDue
} from './effortModel';

const at = iso => new Date(iso);
const event = (type, contributionValue, iso) => ({
  type,
  contributionValue,
  createdAt: at(iso)
});

it('rewards effort even when the session is not completed', () => {
  const now = at('2026-08-06T10:00:00');

  expect(getEffortAward('focus_started', [], now).value).toBe(1);
  expect(getEffortAward('focus_stopped', [], now).value).toBe(1);
  expect(getEffortAward('rest_chosen', [], now).value).toBe(1);
  expect(getEffortAward('returned_after_break', [], now).value).toBe(4);
});

it('throttles the same action so contribution cannot be farmed', () => {
  const history = [event('focus_started', 1, '2026-08-06T10:00:00')];

  expect(getEffortAward('focus_started', history, at('2026-08-06T10:02:00'))).toEqual({
    value: 0,
    reason: 'throttled'
  });
  expect(getEffortAward('focus_started', history, at('2026-08-06T10:06:00')).value).toBe(1);
});

it('caps the daily contribution and never goes negative', () => {
  const history = [event('focus_completed', DAILY_CONTRIBUTION_CAP - 1, '2026-08-06T09:00:00')];
  const award = getEffortAward('focus_retried', history, at('2026-08-06T12:00:00'));

  expect(award.value).toBe(1);
  expect(getEffortAward('focus_retried', [...history, event('focus_retried', 1, '2026-08-06T12:00:00')], at('2026-08-06T15:00:00'))).toEqual({
    value: 0,
    reason: 'daily-cap'
  });
});

it('starts a fresh cap each day', () => {
  const history = [event('focus_completed', DAILY_CONTRIBUTION_CAP, '2026-08-05T09:00:00')];

  expect(getEffortAward('focus_completed', history, at('2026-08-06T09:00:00')).value).toBe(2);
});

it('grows the cat forward only and reports progress to the next stage', () => {
  expect(getCatStage(0).stage).toBe(1);
  expect(getCatStage(150).stage).toBe(2);
  expect(getCatStage(275).progress).toBeCloseTo(0.5);
  expect(getCatStage(-50).stage).toBe(1);

  const last = CAT_STAGES[CAT_STAGES.length - 1];
  expect(getCatStage(last.threshold + 5000)).toMatchObject({ stage: last.stage, isComplete: true });
});

it('never gives the cat a guilt-inducing mood', () => {
  expect(getCatMood({ recentContribution: 0, hour: 13 })).toBe('calm');
  expect(getCatMood({ recentContribution: 0, hour: 2 })).toBe('sleepy');
  expect(getCatMood({ recentContribution: 8, hour: 13 })).toBe('happy');
  expect(getCatMood({ userRested: true })).toBe('resting');
});

it('shrinks the suggested target when capacity is low', () => {
  expect(getSuggestedFocus('very_low').minutes).toBe(10);
  expect(getSuggestedFocus('good').minutes).toBe(25);
  expect(getSuggestedFocus('nonsense')).toEqual(getSuggestedFocus('medium'));
});

it('recognises a return after a break', () => {
  expect(isReturnAfterBreak(at('2026-08-01T10:00:00'), at('2026-08-06T10:00:00'))).toBe(true);
  expect(isReturnAfterBreak(at('2026-08-06T08:00:00'), at('2026-08-06T10:00:00'))).toBe(false);
  expect(isReturnAfterBreak(null, at('2026-08-06T10:00:00'))).toBe(false);
});

it('lets the weekly review through only once a week', () => {
  const history = [event('weekly_review', 3, '2026-08-01T10:00:00')];

  expect(getEffortAward('weekly_review', history, at('2026-08-05T10:00:00'))).toEqual({
    value: 0,
    reason: 'throttled'
  });
  expect(getEffortAward('weekly_review', history, at('2026-08-09T10:00:00')).value).toBe(3);
  expect(isWeeklyReviewDue(null)).toBe(true);
  expect(isWeeklyReviewDue(at('2026-08-05T10:00:00'), at('2026-08-06T10:00:00'))).toBe(false);
});

it('lets the community day lift the cat mood without personal pressure', () => {
  expect(getCatMood({ recentContribution: 0, communityContribution: 0, hour: 13 })).toBe('calm');
  expect(getCatMood({ recentContribution: 0, communityContribution: 30, hour: 13 })).toBe('curious');
  expect(getCatMood({ recentContribution: 0, communityContribution: 160, hour: 13 })).toBe('happy');
  expect(getCatMood({ recentContribution: 9, communityContribution: 300, userRested: true })).toBe('resting');
});

it('unlocks room items as stages are reached and never takes them back', () => {
  expect(getUnlockedItems(0)).toEqual(['kitten']);
  expect(getUnlockedItems(400)).toEqual(['kitten', 'bowl', 'cushion']);
  expect(getUnlockedItems(999999)).toHaveLength(CAT_STAGES.length);
  expect(getSeasonId(at('2026-08-06T10:00:00'))).toBe('2026-08');
});

it('never publishes a full name unless the profile is public', () => {
  expect(contributorName('Mert Ergun', true)).toBe('Mert Ergun');
  expect(contributorName('Mert Ergun', false)).toBe('M*** E****');
  expect(contributorName('', false)).toBe('P******* K**********');
});
