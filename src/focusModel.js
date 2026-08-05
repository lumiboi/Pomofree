export const DEFAULT_FOCUS_SETTINGS = {
  pomodoro: 25,
  short: 5,
  long: 15,
  emergencyMinutes: 5,
  goalRequired: false,
  notifications: true,
  notificationTypes: {
    sessionEnd: true,
    breakEnd: true,
    longBreak: true,
    roomStarted: true,
    participantJoined: true
  },
  adaptiveSuggestions: true,
  adaptiveFrequency: 'balanced',
  breakTips: true,
  breakCategories: {
    movement: true,
    eyes: true,
    hydration: true,
    planning: true
  },
  interruptionAction: 'continue',
  reducedMotion: false,
  highContrast: false,
  colorVision: 'default',
  socialProfilePublic: false,
  shortcutsEnabled: true,
  shortcuts: {
    task: 'n',
    distraction: 'd',
    interruption: 'i',
    project: 'p',
    taskSelect: 't',
    mixer: 'm'
  }
};

const clean = (value, limit) => String(value ?? '').trim().slice(0, limit);
const boundedNumber = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

export const restoreTimerSnapshot = (snapshot, now = new Date(), fallbackTime = 1500) => {
  const totalTime = boundedNumber(snapshot?.totalTime, 1, 24 * 60 * 60, fallbackTime);
  let time = boundedNumber(snapshot?.time, 0, totalTime, fallbackTime);
  let isActive = Boolean(snapshot?.isActive);
  let endsAt = typeof snapshot?.endsAt === 'string' ? snapshot.endsAt : null;

  if (isActive && endsAt) {
    const remaining = Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 1000);
    time = Math.max(0, Math.min(totalTime, remaining));
    if (time === 0) {
      isActive = false;
      endsAt = null;
    }
  } else {
    isActive = false;
    endsAt = null;
  }

  return { time, totalTime, isActive, endsAt };
};

export const createTimerSnapshot = (
  time,
  totalTime,
  isActive,
  now = new Date()
) => ({
  time: boundedNumber(time, 0, 24 * 60 * 60, 0),
  totalTime: boundedNumber(totalTime, 1, 24 * 60 * 60, 1500),
  isActive: Boolean(isActive),
  endsAt: isActive ? new Date(now.getTime() + time * 1000).toISOString() : null,
  updatedAt: now.toISOString()
});

export const createFocusSession = (input, now = new Date()) => {
  const allowedTypes = ['pomodoro', 'short-start', 'custom', 'shared'];
  const allowedStatuses = [
    'completed',
    'partially-completed',
    'not-completed',
    'distracted'
  ];
  const type = allowedTypes.includes(input.type) ? input.type : 'pomodoro';
  const completionStatus = allowedStatuses.includes(input.completionStatus)
    ? input.completionStatus
    : 'completed';

  return {
    type,
    plannedDurationSeconds: boundedNumber(
      input.plannedDurationSeconds,
      1,
      24 * 60 * 60,
      1500
    ),
    actualDurationSeconds: boundedNumber(
      input.actualDurationSeconds,
      0,
      24 * 60 * 60,
      0
    ),
    duration: boundedNumber(input.actualDurationSeconds, 0, 24 * 60 * 60, 0),
    completionStatus,
    completionCriterion: clean(input.completionCriterion, 300),
    taskId: clean(input.taskId, 128) || null,
    projectId: clean(input.projectId, 128) || null,
    startedAt: input.startedAt instanceof Date ? input.startedAt : now,
    endedAt: input.endedAt instanceof Date ? input.endedAt : now,
    completedAt: input.endedAt instanceof Date ? input.endedAt : now,
    interruptions: (Array.isArray(input.interruptions) ? input.interruptions : [])
      .slice(0, 50)
      .map(item => ({
        type: clean(item.type, 40) || 'other',
        note: clean(item.note, 300),
        at: item.at instanceof Date ? item.at : now
      })),
    distractions: (Array.isArray(input.distractions) ? input.distractions : [])
      .slice(0, 50)
      .map(item => ({
        text: clean(item.text, 300),
        completed: Boolean(item.completed),
        at: item.at instanceof Date ? item.at : now
      }))
      .filter(item => item.text),
    adaptiveRecommendation: input.adaptiveRecommendation
      ? {
          recommendedMinutes: boundedNumber(
            input.adaptiveRecommendation.recommendedMinutes,
            1,
            180,
            25
          ),
          accepted: Boolean(input.adaptiveRecommendation.accepted),
          scope: clean(input.adaptiveRecommendation.scope, 20) || 'general',
          decidedAt: clean(input.adaptiveRecommendation.decidedAt, 40)
        }
      : null
  };
};

export const getAdaptiveSuggestion = (
  sessions,
  defaultMinutes = 25,
  {
    taskId = null,
    projectId = null,
    lastDecision = null,
    frequency = 'balanced'
  } = {}
) => {
  const cooldownHours = { frequent: 24, balanced: 72, rare: 168 }[frequency] || 72;
  const decisionTime = lastDecision?.decidedAt
    ? new Date(lastDecision.decidedAt).getTime()
    : 0;
  if (decisionTime && Date.now() - decisionTime < cooldownHours * 60 * 60 * 1000) {
    return null;
  }

  const allValid = sessions
    .filter(session => Number(session.actualDurationSeconds || session.duration) > 0)
    .slice(-15);
  const taskSessions = taskId
    ? allValid.filter(session => session.taskId === taskId)
    : [];
  const projectSessions = projectId
    ? allValid.filter(session => session.projectId === projectId)
    : [];
  const valid = taskSessions.length >= 10
    ? taskSessions
    : projectSessions.length >= 10
      ? projectSessions
      : allValid;
  if (valid.length < 10) return null;

  const averageMinutes = valid.reduce(
    (total, session) => total + Number(session.actualDurationSeconds || session.duration) / 60,
    0
  ) / valid.length;
  const recommendedMinutes = Math.min(
    60,
    Math.max(15, Math.round(averageMinutes / 5) * 5)
  );
  const completed = valid.filter(session => session.completionStatus === 'completed').length;

  if (Math.abs(recommendedMinutes - defaultMinutes) < 5) return null;
  return {
    recommendedMinutes,
    averageMinutes: Math.round(averageMinutes),
    sampleSize: valid.length,
    completionRate: Math.round((completed / valid.length) * 100),
    direction: recommendedMinutes < defaultMinutes ? 'shorter' : 'longer',
    scope: valid === taskSessions ? 'task' : valid === projectSessions ? 'project' : 'general'
  };
};

export const getBreakTip = ({
  hour = new Date().getHours(),
  completedPomodoros = 0,
  energy = 'normal',
  hasNextTask = true,
  categories = {}
} = {}) => {
  const enabled = {
    movement: categories.movement !== false,
    eyes: categories.eyes !== false,
    hydration: categories.hydration !== false,
    planning: categories.planning !== false
  };
  const preferred = hour >= 21 || hour < 7
    ? ['focus.break.eye', 'eyes']
    : completedPomodoros > 0 && completedPomodoros % 4 === 0
      ? ['focus.break.walk', 'movement']
      : energy === 'low'
        ? ['focus.break.stretch', 'movement']
        : !hasNextTask
          ? ['focus.break.plan', 'planning']
          : null;
  if (preferred && enabled[preferred[1]]) return preferred[0];

  const tips = [
    ['focus.break.water', 'hydration'],
    ['focus.break.stretch', 'movement'],
    ['focus.break.eye', 'eyes'],
    ['focus.break.plan', 'planning']
  ].filter(([, category]) => enabled[category]);
  return tips.length ? tips[completedPomodoros % tips.length][0] : null;
};

export const getProjectForecast = (project, now = new Date()) => {
  const target = boundedNumber(project.targetPomodoros, 0, 100000, 0);
  const completed = boundedNumber(project.completedPomodoros, 0, 100000, 0);
  const dailyTarget = boundedNumber(project.dailyTarget, 1, 1000, 1);
  const remainingPomodoros = Math.max(0, target - completed);
  const daysRemaining = remainingPomodoros === 0
    ? 0
    : Math.ceil(remainingPomodoros / dailyTarget);
  const estimated = new Date(now);
  estimated.setDate(estimated.getDate() + daysRemaining);

  return {
    remainingPomodoros,
    daysRemaining,
    estimatedDate: estimated.toISOString().slice(0, 10),
    atRisk: Boolean(project.dueDate && estimated > new Date(`${project.dueDate}T23:59:59`))
  };
};

const csvCell = value => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const buildDataExports = ({ tasks = [], projects = [], sessions = [] }) => {
  const rows = [
    ['type', 'name', 'status', 'date', 'durationSeconds'],
    ...projects.map(project => [
      'project',
      project.name,
      project.completed ? 'completed' : project.archived ? 'archived' : 'active',
      project.dueDate || '',
      ''
    ]),
    ...tasks.map(task => [
      'task',
      task.text,
      task.completed ? 'completed' : 'active',
      task.dueDate || '',
      ''
    ]),
    ...sessions.map(session => [
      'session',
      session.completionCriterion || '',
      session.completionStatus || 'completed',
      session.completedAt?.toDate?.()?.toISOString?.() || session.completedAt || '',
      session.actualDurationSeconds || session.duration || 0
    ])
  ];

  return {
    csv: rows.map(row => row.map(csvCell).join(',')).join('\n'),
    json: JSON.stringify({ exportedAt: new Date().toISOString(), projects, tasks, sessions }, null, 2)
  };
};

export const calculateReportInsights = (sessions = [], tasks = []) => {
  const isCompleted = session => (
    !session.completionStatus || session.completionStatus === 'completed'
  );
  const completed = sessions.filter(isCompleted).length;
  const hourly = Array.from({ length: 24 }, () => 0);
  const interruptions = {};
  const sessionOrder = {};
  const durationGroups = {};
  const focusScores = { low: 1, normal: 2, high: 3 };
  const ordered = [...sessions].sort((first, second) => {
    const firstDate = first.completedAt?.toDate?.() || new Date(first.completedAt || 0);
    const secondDate = second.completedAt?.toDate?.() || new Date(second.completedAt || 0);
    return firstDate - secondDate;
  });
  const dayCounters = {};
  let focusScoreTotal = 0;
  let focusScoreCount = 0;
  const tiredOrders = [];

  ordered.forEach(session => {
    const rawDate = session.completedAt?.toDate?.() || session.completedAt;
    const date = rawDate ? new Date(rawDate) : null;
    if (date && !Number.isNaN(date.getTime())) {
      hourly[date.getHours()] += 1;
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      dayCounters[dateKey] = (dayCounters[dateKey] || 0) + 1;
      const order = dayCounters[dateKey];
      sessionOrder[order] = sessionOrder[order] || { total: 0, completed: 0 };
      sessionOrder[order].total += 1;
      if (isCompleted(session)) sessionOrder[order].completed += 1;
      if (session.review?.focus === 'low') tiredOrders.push(order);
    }
    const plannedMinutes = Math.round(
      Number(session.plannedDurationSeconds || session.duration || 0) / 300
    ) * 5;
    if (plannedMinutes > 0) {
      durationGroups[plannedMinutes] = durationGroups[plannedMinutes] || { total: 0, completed: 0 };
      durationGroups[plannedMinutes].total += 1;
      if (isCompleted(session)) durationGroups[plannedMinutes].completed += 1;
    }
    if (focusScores[session.review?.focus]) {
      focusScoreTotal += focusScores[session.review.focus];
      focusScoreCount += 1;
    }
    (session.interruptions || []).forEach(item => {
      interruptions[item.type] = (interruptions[item.type] || 0) + 1;
    });
  });

  const bestHour = hourly.some(Boolean)
    ? hourly.indexOf(Math.max(...hourly))
    : null;
  const sortedInterruptions = Object.entries(interruptions)
    .sort((a, b) => b[1] - a[1]);
  const estimatedTasks = tasks.filter(task => (
    task.completed &&
    Number(task.estimatedPomodoros) > 0 &&
    Number.isFinite(Number(task.actualPomodoros))
  ));
  const estimateAccuracy = estimatedTasks.length
    ? Math.round(estimatedTasks.reduce((total, task) => {
      const ratio = Math.min(
        Number(task.actualPomodoros),
        Number(task.estimatedPomodoros)
      ) / Math.max(
        Number(task.actualPomodoros),
        Number(task.estimatedPomodoros)
      );
      return total + ratio * 100;
    }, 0) / estimatedTasks.length)
    : null;
  const successRate = group => group.length
    ? Math.round((group.filter(isCompleted).length / group.length) * 100)
    : null;
  const nightSessions = sessions.filter(session => {
    const date = asReportDate(session.completedAt);
    return date && (date.getHours() >= 21 || date.getHours() < 7);
  });
  const daySessions = sessions.filter(session => {
    const date = asReportDate(session.completedAt);
    return date && date.getHours() >= 7 && date.getHours() < 21;
  });
  const socialSessions = sessions.filter(session => session.type === 'shared');
  const soloSessions = sessions.filter(session => session.type !== 'shared');
  const durationPerformance = Object.entries(durationGroups)
    .map(([minutes, values]) => ({
      minutes: Number(minutes),
      sessions: values.total,
      successRate: Math.round((values.completed / values.total) * 100)
    }))
    .sort((first, second) => second.successRate - first.successRate || second.sessions - first.sessions);

  return {
    successRate: sessions.length ? Math.round((completed / sessions.length) * 100) : null,
    successfulSessions: completed,
    abandonedSessions: sessions.filter(session => (
      ['not-completed', 'distracted'].includes(session.completionStatus)
    )).length,
    completedTasks: tasks.filter(task => task.completed).length,
    averageFocusScore: focusScoreCount
      ? Math.round((focusScoreTotal / focusScoreCount) * 10) / 10
      : null,
    bestHour,
    hourly,
    interruptionStats: sortedInterruptions.map(([type, count]) => ({ type, count })),
    topInterruption: sortedInterruptions[0]?.[0] || null,
    estimateAccuracy,
    socialSessions: socialSessions.length,
    socialSuccessRate: successRate(socialSessions),
    soloSuccessRate: successRate(soloSessions),
    nightSuccessRate: successRate(nightSessions),
    daySuccessRate: successRate(daySessions),
    averageFatigueOrder: tiredOrders.length
      ? Math.round(tiredOrders.reduce((sum, order) => sum + order, 0) / tiredOrders.length)
      : null,
    sessionOrder: Object.entries(sessionOrder).map(([order, values]) => ({
      order: Number(order),
      sessions: values.total,
      successRate: Math.round((values.completed / values.total) * 100)
    })),
    durationPerformance,
    bestDuration: durationPerformance[0]?.minutes || null,
    suggestion: sessions.length < 3
      ? 'insufficient'
      : completed / sessions.length < 0.6
        ? 'shorter'
        : sortedInterruptions[0]?.[1] >= 3
          ? 'interruptions'
          : 'steady'
  };
};

const asReportDate = value => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date : null;
};
