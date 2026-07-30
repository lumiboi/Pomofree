import React, { useEffect, useMemo, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { buildDataExports, calculateReportInsights } from '../focusModel';
import { useTranslation } from '../hooks/useTranslation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  ArcElement
);

const emptyReport = {
  dailyStats: [],
  projectStats: [],
  productivityTrends: [],
  bestHours: [],
  streaks: { current: 0, longest: 0, total: 0 },
  totalFocusTime: 0,
  completedPomodoros: 0,
  averageSessionLength: 0,
  insights: {
    successRate: null,
    bestHour: null,
    interruptionStats: [],
    estimateAccuracy: null,
    socialSessions: 0,
    suggestion: 'insufficient'
  }
};

const asDate = value => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const secondsOf = session => Math.max(
  0,
  Number(session.actualDurationSeconds ?? session.duration ?? 0) || 0
);

const calculateStreaks = sessions => {
  const dates = [...new Set(
    sessions
      .map(session => asDate(session.completedAt))
      .filter(Boolean)
      .map(date => format(date, 'yyyy-MM-dd'))
  )].sort();
  if (!dates.length) return { current: 0, longest: 0, total: 0 };

  let run = 1;
  let longest = 1;
  let total = 1;
  for (let index = 1; index < dates.length; index += 1) {
    const previous = new Date(`${dates[index - 1]}T12:00:00`);
    const current = new Date(`${dates[index]}T12:00:00`);
    if (Math.round((current - previous) / 86400000) === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
      total += 1;
    }
  }
  return { current: run, longest, total };
};

const download = (content, type, extension) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pomofree-report-${format(new Date(), 'yyyy-MM-dd')}.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const AdvancedReports = ({ user, closeModal }) => {
  const { t, language } = useTranslation();
  const locale = language === 'tr' ? tr : enUS;
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedTask, setSelectedTask] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [source, setSource] = useState({ sessions: [], projects: [], tasks: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setIsLoading(true);
    Promise.all([
      getDocs(collection(db, 'users', user.uid, 'focusSessions')),
      getDocs(collection(db, 'users', user.uid, 'projects')),
      getDocs(collection(db, 'users', user.uid, 'tasks'))
    ]).then(([sessionSnapshot, projectSnapshot, taskSnapshot]) => {
      if (!active) return;
      setSource({
        sessions: sessionSnapshot.docs.map(item => ({ id: item.id, ...item.data() })),
        projects: projectSnapshot.docs.map(item => ({ id: item.id, ...item.data() })),
        tasks: taskSnapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      });
    }).catch(error => {
      console.error('Rapor verisi yüklenirken hata:', error);
      if (active) setSource({ sessions: [], projects: [], tasks: [] });
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const reportData = useMemo(() => {
    const now = new Date();
    const startDate = selectedPeriod === 'week'
      ? startOfWeek(now, { weekStartsOn: 1 })
      : selectedPeriod === 'month'
        ? startOfMonth(now)
        : new Date(now.getFullYear(), 0, 1);
    const endDate = selectedPeriod === 'week'
      ? endOfWeek(now, { weekStartsOn: 1 })
      : selectedPeriod === 'month'
        ? endOfMonth(now)
        : now;
    const sessions = source.sessions.filter(session => {
      const date = asDate(session.completedAt);
      return date &&
        date >= startDate &&
        date <= endDate &&
        (selectedProject === 'all' || session.projectId === selectedProject) &&
        (selectedTask === 'all' || session.taskId === selectedTask) &&
        (selectedType === 'all' || session.type === selectedType);
    });
    const relevantTasks = source.tasks.filter(task => (
      selectedProject === 'all' || task.projectId === selectedProject
    ));
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyStats = days.map(date => {
      const daySessions = sessions.filter(session => isSameDay(asDate(session.completedAt), date));
      const completed = daySessions.filter(session => (
        !session.completionStatus || session.completionStatus === 'completed'
      )).length;
      return {
        date,
        focusTime: Math.round(daySessions.reduce((sum, session) => sum + secondsOf(session), 0) / 60),
        pomodoros: daySessions.length,
        productivity: daySessions.length ? Math.round((completed / daySessions.length) * 100) : 0
      };
    });
    const projectStats = source.projects.map(project => {
      const projectSessions = sessions.filter(session => session.projectId === project.id);
      return {
        name: project.name,
        time: Math.round(projectSessions.reduce((sum, session) => sum + secondsOf(session), 0) / 60),
        color: project.color || '#6c7ff2'
      };
    }).filter(project => project.time > 0);
    const totalMinutes = Math.round(sessions.reduce((sum, session) => sum + secondsOf(session), 0) / 60);
    const insights = calculateReportInsights(sessions, relevantTasks);

    return {
      ...emptyReport,
      dailyStats,
      projectStats,
      productivityTrends: dailyStats,
      bestHours: insights.hourly
        .map((focusTime, hour) => ({ hour, focusTime }))
        .filter(item => item.focusTime > 0),
      streaks: calculateStreaks(sessions),
      totalFocusTime: totalMinutes,
      completedPomodoros: insights.successfulSessions,
      totalSessions: sessions.length,
      averageSessionLength: sessions.length ? Math.round(totalMinutes / sessions.length) : 0,
      insights,
      sessions,
      relevantTasks
    };
  }, [selectedPeriod, selectedProject, selectedTask, selectedType, source]);

  const exportReport = extension => {
    const exports = buildDataExports({
      sessions: reportData.sessions,
      tasks: reportData.relevantTasks,
      projects: source.projects
    });
    download(
      exports[extension],
      extension === 'csv' ? 'text/csv;charset=utf-8' : 'application/json',
      extension
    );
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };
  const dailyChartData = {
    labels: reportData.dailyStats.map(day => format(day.date, 'dd MMM', { locale })),
    datasets: [{
      label: t('reports.focusTime'),
      data: reportData.dailyStats.map(day => day.focusTime),
      borderColor: '#68d7cb',
      backgroundColor: 'rgba(104, 215, 203, .18)',
      tension: .25
    }]
  };
  const projectChartData = {
    labels: reportData.projectStats.map(project => project.name),
    datasets: [{
      data: reportData.projectStats.map(project => project.time),
      backgroundColor: reportData.projectStats.map(project => project.color),
      borderWidth: 0
    }]
  };
  const productivityData = {
    labels: reportData.productivityTrends.map(day => format(day.date, 'dd MMM', { locale })),
    datasets: [{
      label: t('reports.productivity'),
      data: reportData.productivityTrends.map(day => day.productivity),
      borderColor: '#ffbd59',
      backgroundColor: 'rgba(255, 189, 89, .18)',
      tension: .25
    }]
  };
  const bestHoursData = {
    labels: reportData.bestHours.map(item => `${String(item.hour).padStart(2, '0')}:00`),
    datasets: [{
      label: t('reports.pomodoros'),
      data: reportData.bestHours.map(item => item.focusTime),
      backgroundColor: '#8a9cff'
    }]
  };
  const sessionOrderData = {
    labels: reportData.insights.sessionOrder?.map(item => `${item.order}.`) || [],
    datasets: [{
      label: t('reports.successRate'),
      data: reportData.insights.sessionOrder?.map(item => item.successRate) || [],
      borderColor: '#f18bc3',
      backgroundColor: 'rgba(241, 139, 195, .18)',
      tension: .25
    }]
  };
  const insightText = t(`reports.insight.${reportData.insights.suggestion}`);

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content advanced-reports" onClick={event => event.stopPropagation()}>
          <div className="loading-spinner" role="status">
            <div className="spinner" />
            <p>{t('reports.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content advanced-reports"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advanced-reports-title"
      >
        <div className="reports-header">
          <h2 id="advanced-reports-title">{t('report.advancedTitle')}</h2>
          <div className="reports-controls">
            <select value={selectedPeriod} onChange={event => setSelectedPeriod(event.target.value)} aria-label={t('reports.period')}>
              <option value="week">{t('reports.thisWeek')}</option>
              <option value="month">{t('reports.thisMonth')}</option>
              <option value="year">{t('reports.thisYear')}</option>
            </select>
            <select value={selectedProject} onChange={event => setSelectedProject(event.target.value)} aria-label={t('reports.projectFilter')}>
              <option value="all">{t('reports.allProjects')}</option>
              {source.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <select value={selectedTask} onChange={event => setSelectedTask(event.target.value)} aria-label={t('reports.taskFilter')}>
              <option value="all">{t('reports.allTasks')}</option>
              {source.tasks.map(task => <option key={task.id} value={task.id}>{task.text}</option>)}
            </select>
            <select value={selectedType} onChange={event => setSelectedType(event.target.value)} aria-label={t('reports.typeFilter')}>
              <option value="all">{t('reports.allTypes')}</option>
              <option value="pomodoro">Pomodoro</option>
              <option value="short-start">{t('focus.shortStart')}</option>
              <option value="shared">{t('reports.social')}</option>
            </select>
            <button onClick={() => exportReport('csv')} className="btn btn-secondary">{t('reports.exportCSV')}</button>
            <button onClick={() => exportReport('json')} className="btn btn-secondary">{t('reports.exportJSON')}</button>
            <button onClick={closeModal} className="btn btn-secondary" aria-label={t('reports.close')}>×</button>
          </div>
        </div>

        <div className="reports-grid">
          <div className="summary-cards">
            <div className="summary-card"><h3>{t('reports.totalFocusTime')}</h3><div className="big-number">{Math.floor(reportData.totalFocusTime / 60)}s {reportData.totalFocusTime % 60}d</div></div>
            <div className="summary-card"><h3>{t('reports.completedPomodoros')}</h3><div className="big-number">{reportData.completedPomodoros}/{reportData.totalSessions || 0}</div></div>
            <div className="summary-card"><h3>{t('reports.successRate')}</h3><div className="big-number">{reportData.insights.successRate ?? 0}%</div></div>
            <div className="summary-card"><h3>{t('reports.averageSession')}</h3><div className="big-number">{reportData.averageSessionLength}d</div></div>
            <div className="summary-card"><h3>{t('reports.estimateAccuracy')}</h3><div className="big-number">{reportData.insights.estimateAccuracy ?? '—'}{reportData.insights.estimateAccuracy === null ? '' : '%'}</div></div>
            <div className="summary-card"><h3>{t('reports.socialSessions')}</h3><div className="big-number">{reportData.insights.socialSessions}</div></div>
            <div className="summary-card"><h3>{t('reports.completedTasks')}</h3><div className="big-number">{reportData.insights.completedTasks}</div></div>
            <div className="summary-card"><h3>{t('reports.abandonedSessions')}</h3><div className="big-number">{reportData.insights.abandonedSessions}</div></div>
            <div className="summary-card"><h3>{t('reports.focusScore')}</h3><div className="big-number">{reportData.insights.averageFocusScore ?? '—'}/3</div></div>
          </div>

          <div className="report-insight" role="status">
            <strong>{t('reports.insightTitle')}</strong>
            <span>{insightText}</span>
            {reportData.insights.topInterruption && (
              <small>{t('reports.topInterruption')}: {reportData.insights.topInterruption}</small>
            )}
            <div className="report-evidence">
              <span>{t('reports.sample')}: {reportData.totalSessions || 0}</span>
              {reportData.insights.bestHour !== null && <span>{t('reports.bestHourEvidence')}: {String(reportData.insights.bestHour).padStart(2, '0')}:00</span>}
              {reportData.insights.bestDuration && <span>{t('reports.bestDuration')}: {reportData.insights.bestDuration} {t('stats.minutes')}</span>}
              {reportData.insights.averageFatigueOrder && <span>{t('reports.fatigueOrder')}: {reportData.insights.averageFatigueOrder}</span>}
              {reportData.insights.daySuccessRate !== null && <span>{t('reports.dayNight')}: %{reportData.insights.daySuccessRate} / %{reportData.insights.nightSuccessRate ?? 0}</span>}
              {reportData.insights.socialSuccessRate !== null && <span>{t('reports.socialSolo')}: %{reportData.insights.socialSuccessRate} / %{reportData.insights.soloSuccessRate ?? 0}</span>}
            </div>
          </div>

          <div className="chart-container">
            <h3>{t('reports.dailyTrend')}</h3>
            <div className="report-chart">{reportData.totalSessions ? <Line data={dailyChartData} options={chartOptions} /> : <p className="no-data-message">{t('reports.noData')}</p>}</div>
          </div>
          <div className="chart-container">
            <h3>{t('reports.projectDistribution')}</h3>
            <div className="report-chart">{reportData.projectStats.length ? <Doughnut data={projectChartData} options={chartOptions} /> : <p className="no-data-message">{t('reports.noProjectData')}</p>}</div>
          </div>
          <div className="chart-container">
            <h3>{t('reports.productivityTrend')}</h3>
            <div className="report-chart">{reportData.totalSessions ? <Line data={productivityData} options={{ ...chartOptions, scales: { y: { beginAtZero: true, max: 100 } } }} /> : <p className="no-data-message">{t('reports.noData')}</p>}</div>
          </div>
          <div className="chart-container">
            <h3>{t('reports.bestHours')}</h3>
            <div className="report-chart">{reportData.bestHours.length ? <Bar data={bestHoursData} options={chartOptions} /> : <p className="no-data-message">{t('reports.noData')}</p>}</div>
          </div>
          <div className="chart-container">
            <h3>{t('reports.sessionOrder')}</h3>
            <div className="report-chart">{reportData.insights.sessionOrder?.length ? <Line data={sessionOrderData} options={{ ...chartOptions, scales: { y: { beginAtZero: true, max: 100 } } }} /> : <p className="no-data-message">{t('reports.noData')}</p>}</div>
          </div>

          <div className="streak-info">
            <h3>{t('reports.streakStats')}</h3>
            <div className="streak-cards">
              <div className="streak-card"><span className="streak-label">{t('reports.currentStreak')}</span><span className="streak-value">{reportData.streaks.current} {t('reports.days')}</span></div>
              <div className="streak-card"><span className="streak-label">{t('reports.longestStreak')}</span><span className="streak-value">{reportData.streaks.longest} {t('reports.days')}</span></div>
              <div className="streak-card"><span className="streak-label">{t('reports.totalStreaks')}</span><span className="streak-value">{reportData.streaks.total}</span></div>
            </div>
          </div>

          <div className="streak-info">
            <h3>{t('reports.interruptions')}</h3>
            {reportData.insights.interruptionStats.length ? (
              <ul className="report-interruptions">
                {reportData.insights.interruptionStats.map(item => <li key={item.type}><span>{item.type}</span><strong>{item.count}</strong></li>)}
              </ul>
            ) : <p className="no-data-message">{t('reports.noInterruptions')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;
