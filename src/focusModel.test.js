import {
  buildDataExports,
  calculateReportInsights,
  createFocusSession,
  getAdaptiveSuggestion,
  getProjectForecast,
  restoreTimerSnapshot
} from './focusModel';

test('çalışan sayaç yenileme ve uyku sonrasında gerçek bitiş zamanından geri yüklenir', () => {
  const restored = restoreTimerSnapshot({
    time: 1500,
    totalTime: 1500,
    isActive: true,
    endsAt: '2026-07-30T10:25:00.000Z'
  }, new Date('2026-07-30T10:10:00.000Z'), 1500);

  expect(restored).toEqual({
    time: 900,
    totalTime: 1500,
    isActive: true,
    endsAt: '2026-07-30T10:25:00.000Z'
  });

  expect(restoreTimerSnapshot({
    time: 1500,
    totalTime: 1500,
    isActive: true,
    endsAt: '2026-07-30T10:05:00.000Z'
  }, new Date('2026-07-30T10:10:00.000Z'), 1500).time).toBe(0);
});

test('odak seansı güvenli sınırlarla oluşturulur ve aktif görevle ilişkilendirilir', () => {
  const now = new Date('2026-07-30T10:00:00.000Z');
  expect(createFocusSession({
    type: 'short-start',
    plannedDurationSeconds: 300,
    actualDurationSeconds: 280,
    completionCriterion: '  Taslağı tamamla  ',
    taskId: 'task-1',
    projectId: 'project-1',
    interruptions: [{ type: 'phone', note: ' Bildirim ' }],
    distractions: [{ text: ' Mail at ' }]
  }, now)).toMatchObject({
    type: 'short-start',
    plannedDurationSeconds: 300,
    actualDurationSeconds: 280,
    completionCriterion: 'Taslağı tamamla',
    taskId: 'task-1',
    projectId: 'project-1',
    startedAt: now,
    interruptions: [{ type: 'phone', note: 'Bildirim' }],
    distractions: [{ text: 'Mail at' }]
  });
});

test('adaptif öneri yalnızca yeterli veriden ve açıklanabilir biçimde üretilir', () => {
  expect(getAdaptiveSuggestion([], 25)).toBeNull();
  const sessions = Array.from({ length: 12 }, (_, index) => ({
    actualDurationSeconds: 19 * 60 + index,
    completionStatus: index < 9 ? 'completed' : 'distracted'
  }));

  expect(getAdaptiveSuggestion(sessions, 25)).toMatchObject({
    recommendedMinutes: 20,
    sampleSize: 12
  });
  expect(getAdaptiveSuggestion(sessions, 25, {
    lastDecision: { decidedAt: new Date().toISOString() },
    frequency: 'balanced'
  })).toBeNull();
});

test('proje tahmini ve CSV/JSON dışa aktarma aynı veriden üretilir', () => {
  expect(getProjectForecast({
    targetPomodoros: 12,
    completedPomodoros: 4,
    dailyTarget: 2
  }, new Date('2026-07-30T10:00:00.000Z'))).toMatchObject({
    remainingPomodoros: 8,
    daysRemaining: 4,
    estimatedDate: '2026-08-03'
  });

  const exports = buildDataExports({
    tasks: [{ text: 'Rapor, son hâli', completed: false }],
    projects: [],
    sessions: []
  });
  expect(exports.csv).toContain('"Rapor, son hâli"');
  expect(JSON.parse(exports.json).tasks).toHaveLength(1);
});

test('davranış raporu başarı, kesinti, tahmin ve sosyal seansları açıklar', () => {
  const sessions = [
    {
      completionStatus: 'completed',
      type: 'pomodoro',
      completedAt: new Date(2026, 6, 30, 10, 0, 0),
      interruptions: [{ type: 'phone' }]
    },
    {
      completionStatus: 'distracted',
      type: 'shared',
      completedAt: new Date(2026, 6, 30, 10, 30, 0),
      interruptions: [{ type: 'phone' }, { type: 'notification' }]
    }
  ];
  const insights = calculateReportInsights(sessions, [
    { completed: true, estimatedPomodoros: 4, actualPomodoros: 3 }
  ]);

  expect(insights).toMatchObject({
    successRate: 50,
    bestHour: 10,
    topInterruption: 'phone',
    estimateAccuracy: 75,
    socialSessions: 1,
    successfulSessions: 1,
    abandonedSessions: 1,
    averageFocusScore: null
  });
});
