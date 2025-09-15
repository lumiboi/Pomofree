import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

const ProductivityDashboard = ({ user, closeModal }) => {
  const { t, language } = useTranslation();
  const [dashboardData, setDashboardData] = useState({
    today: { focusTime: 0, pomodoros: 0, tasks: 0, efficiency: 0 },
    yesterday: { focusTime: 0, pomodoros: 0, tasks: 0, efficiency: 0 },
    thisWeek: { focusTime: 0, pomodoros: 0, tasks: 0, efficiency: 0 },
    goals: { daily: 6, weekly: 20, monthly: 160 },
    achievements: [],
    insights: []
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const [isLoading, setIsLoading] = useState(true);

  const dateLocale = language === 'tr' ? tr : enUS;

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedTimeframe, language]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRealDashboardData();
      const achievements = await fetchAchievements();
      setDashboardData({
        ...data,
        achievements
      });
    } catch (error) {
      console.error('Dashboard verisi yüklenirken hata:', error);
      // Hata durumunda boş veri döndür
      setDashboardData({
        today: { focusTime: 0, pomodoros: 0, tasks: 0, efficiency: 0 },
        yesterday: { focusTime: 0, pomodoros: 0, tasks: 0, efficiency: 0 },
        thisWeek: { focusTime: 0, pomodoros: 0, tasks: 0, efficiency: 0 },
        goals: { daily: 6, weekly: 20, monthly: 160 },
        achievements: [],
        insights: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase'den gerçek veri çekme
  const fetchAchievements = async () => {
    try {
      const { collection, query, getDocs, where } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const achievementsQuery = query(
        collection(db, 'achievements'),
        where('userId', '==', user.uid)
      );
      
      const achievementsSnapshot = await getDocs(achievementsQuery);
      return achievementsSnapshot.docs.map(doc => {
        const data = doc.data();
        let date = null;
        if (data.unlockedAt) {
          if (data.unlockedAt.toDate) {
            date = data.unlockedAt.toDate();
          } else if (data.unlockedAt instanceof Date) {
            date = data.unlockedAt;
          } else {
            date = new Date(data.unlockedAt);
          }
        }
        
        // Achievement ID'ye göre çevirileri al
        const getAchievementTranslation = (achievementId) => {
          const translations = {
            'first_pomodoro': {
              title: t('achievements.firstPomodoro'),
              description: t('achievements.firstPomodoroDesc'),
              icon: '🍅'
            },
            'pomodoro_5': {
              title: t('achievements.pomodoroMaster'),
              description: t('achievements.pomodoroMasterDesc'),
              icon: '🔥'
            },
            'pomodoro_10': {
              title: t('achievements.pomodoroChampion'),
              description: t('achievements.pomodoroChampionDesc'),
              icon: '🏆'
            },
            'pomodoro_25': {
              title: t('achievements.pomodoroLegend'),
              description: t('achievements.pomodoroLegendDesc'),
              icon: '👑'
            },
            'pomodoro_50': {
              title: t('achievements.pomodoroGod'),
              description: t('achievements.pomodoroGodDesc'),
              icon: '⚡'
            },
            'focus_1_hour': {
              title: t('achievements.focusBeginner'),
              description: t('achievements.focusBeginnerDesc'),
              icon: '⏰'
            },
            'focus_5_hours': {
              title: t('achievements.focusMaster'),
              description: t('achievements.focusMasterDesc'),
              icon: '🎯'
            },
            'focus_10_hours': {
              title: t('achievements.focusChampion'),
              description: t('achievements.focusChampionDesc'),
              icon: '🚀'
            },
            'focus_20_hours': {
              title: t('achievements.focusLegend'),
              description: t('achievements.focusLegendDesc'),
              icon: '💎'
            },
            'daily_streak_3': {
              title: t('achievements.streak3'),
              description: t('achievements.streak3Desc'),
              icon: '🔥'
            },
            'daily_streak_7': {
              title: t('achievements.streak7'),
              description: t('achievements.streak7Desc'),
              icon: '📅'
            },
            'daily_streak_30': {
              title: t('achievements.streak30'),
              description: t('achievements.streak30Desc'),
              icon: '🗓️'
            }
          };
          return translations[achievementId] || {
            title: data.title,
            description: data.description,
            icon: data.icon
          };
        };
        
        const translation = getAchievementTranslation(data.achievementId);
        
        return {
          id: data.achievementId,
          title: translation.title,
          description: translation.description,
          icon: translation.icon,
          unlocked: true,
          date: date
        };
      });
    } catch (error) {
      console.error('Achievement yükleme hatası:', error);
      return [];
    }
  };

  const fetchRealDashboardData = async () => {
    const { collection, query, getDocs, where } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // Tarihleri Timestamp'e çevir (şu an kullanılmıyor ama gelecekte gerekebilir)
    // const todayStart = Timestamp.fromDate(today);
    // const todayEnd = Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
    // const yesterdayStart = Timestamp.fromDate(yesterday);
    // const yesterdayEnd = Timestamp.fromDate(today);
    // const weekStartTimestamp = Timestamp.fromDate(weekStart);

    // Focus sessions'ları çek (gerçek veri kaynağı)
    const focusSessionsQuery = query(
      collection(db, 'users', user.uid, 'focusSessions')
    );

    // Tamamlanan görevleri çek
    const tasksQuery = query(
      collection(db, 'users', user.uid, 'tasks'),
      where('completed', '==', true)
    );

    console.log('Firebase sorguları çalıştırılıyor...');
    
    try {
      const [focusSessionsSnapshot, tasksSnapshot] = await Promise.all([
        getDocs(focusSessionsQuery),
        getDocs(tasksQuery)
      ]);
      
      console.log('Firebase bağlantısı başarılı!');
      console.log('Toplam focus sessions:', focusSessionsSnapshot.docs.length);
      console.log('Toplam tamamlanan görevler:', tasksSnapshot.docs.length);

      // Tüm focus sessions'ları al ve tarihe göre filtrele
    const allFocusSessions = focusSessionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : data.completedAt
      };
    });

    // Tamamlanan görevleri işle
    const allCompletedTasks = tasksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : data.completedAt,
        projectId: data.projectId,
        pomodorosCompleted: data.pomodorosCompleted || 0
      };
    });

    // Bugünkü focus sessions
    const todaySessions = allFocusSessions.filter(s => {
      if (!s.completedAt) return false;
      const sessionDate = new Date(s.completedAt);
      return sessionDate >= today && sessionDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    // Dünkü focus sessions
    const yesterdaySessions = allFocusSessions.filter(s => {
      if (!s.completedAt) return false;
      const sessionDate = new Date(s.completedAt);
      return sessionDate >= yesterday && sessionDate < today;
    });

    // Bu haftaki focus sessions
    const weekSessions = allFocusSessions.filter(s => {
      if (!s.completedAt) return false;
      const sessionDate = new Date(s.completedAt);
      return sessionDate >= weekStart && sessionDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    // Bugünkü tamamlanan görevler
    const todayTasks = allCompletedTasks.filter(t => {
      if (!t.completedAt) return false;
      const taskDate = new Date(t.completedAt);
      return taskDate >= today && taskDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    // Dünkü tamamlanan görevler
    const yesterdayTasks = allCompletedTasks.filter(t => {
      if (!t.completedAt) return false;
      const taskDate = new Date(t.completedAt);
      return taskDate >= yesterday && taskDate < today;
    });

    // Bu haftaki tamamlanan görevler
    const weekTasks = allCompletedTasks.filter(t => {
      if (!t.completedAt) return false;
      const taskDate = new Date(t.completedAt);
      return taskDate >= weekStart && taskDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    console.log('Bugünkü focus sessions:', todaySessions.length);
    console.log('Dünkü focus sessions:', yesterdaySessions.length);
    console.log('Bu haftaki focus sessions:', weekSessions.length);
    console.log('Bugünkü tamamlanan görevler:', todayTasks.length);
    console.log('Dünkü tamamlanan görevler:', yesterdayTasks.length);
    console.log('Bu haftaki tamamlanan görevler:', weekTasks.length);
    
    // Debug: İlk session'ın duration değerini kontrol et
    if (weekSessions.length > 0) {
      console.log('İlk session duration:', weekSessions[0].duration);
      console.log('İlk session:', weekSessions[0]);
    }

    // Verimlilik hesaplama (basit versiyon)
    const calculateEfficiency = (sessions) => {
      if (sessions.length === 0) return 0;
      const totalTime = sessions.reduce((total, s) => total + (s.duration || 25), 0) / 60; // Saniyeyi dakikaya çevir
      const expectedTime = sessions.length * 25; // Her session 25 dakika
      return Math.round((totalTime / expectedTime) * 100);
    };

    return {
      today: {
        focusTime: todaySessions.reduce((total, s) => total + (s.duration || 25), 0) / 60, // Saniyeyi dakikaya çevir
        pomodoros: todaySessions.length,
        tasks: todayTasks.length, // Bugünkü tamamlanan görevler
        efficiency: calculateEfficiency(todaySessions)
      },
      yesterday: {
        focusTime: yesterdaySessions.reduce((total, s) => total + (s.duration || 25), 0) / 60, // Saniyeyi dakikaya çevir
        pomodoros: yesterdaySessions.length,
        tasks: yesterdayTasks.length, // Dünkü tamamlanan görevler
        efficiency: calculateEfficiency(yesterdaySessions)
      },
      thisWeek: {
        focusTime: weekSessions.reduce((total, s) => total + (s.duration || 25), 0) / 60, // Saniyeyi dakikaya çevir
        pomodoros: weekSessions.length,
        tasks: weekTasks.length, // Bu haftaki tamamlanan görevler
        efficiency: calculateEfficiency(weekSessions)
      },
      goals: {
        daily: 6,
        weekly: 20,
        monthly: 160
      },
      achievements: [],
      insights: []
    };
    } catch (error) {
      console.error('Firebase bağlantı hatası:', error);
      throw error;
    }
  };

  const getCurrentData = () => {
    switch (selectedTimeframe) {
      case 'today':
        return dashboardData.today;
      case 'yesterday':
        return dashboardData.yesterday;
      case 'week':
        return dashboardData.thisWeek;
      default:
        return dashboardData.today;
    }
  };

  const getGoalProgress = () => {
    const current = getCurrentData();
    const goal = selectedTimeframe === 'week' ? dashboardData.goals.weekly : dashboardData.goals.daily;
    return Math.min((current.focusTime / 60) / goal * 100, 100);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content productivity-dashboard" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t('dashboard.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentData = getCurrentData();
  const goalProgress = getGoalProgress();

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content productivity-dashboard" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <h2>{t('dashboard.title')}</h2>
          <div className="timeframe-selector">
            <button 
              className={selectedTimeframe === 'today' ? 'active' : ''}
              onClick={() => setSelectedTimeframe('today')}
            >
              {t('dashboard.today')}
            </button>
            <button 
              className={selectedTimeframe === 'yesterday' ? 'active' : ''}
              onClick={() => setSelectedTimeframe('yesterday')}
            >
              {t('dashboard.yesterday')}
            </button>
            <button 
              className={selectedTimeframe === 'week' ? 'active' : ''}
              onClick={() => setSelectedTimeframe('week')}
            >
              {t('dashboard.thisWeek')}
            </button>
          </div>
          <button onClick={closeModal} className="btn btn-secondary">
            {t('dashboard.close')}
          </button>
        </div>

        <div className="dashboard-grid">
          {/* Ana Metrikler */}
          <div className="main-metrics">
            <div className="metric-card primary">
              <div className="metric-icon">⏱️</div>
              <div className="metric-content">
                <h3>{t('dashboard.focusTime')}</h3>
                <div className="metric-value">{formatTime(currentData.focusTime)}</div>
                <div className="metric-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${goalProgress}%` }}
                  ></div>
                </div>
                <div className="metric-goal">
                  {t('dashboard.goalProgress')}: {Math.round(goalProgress)}%
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🍅</div>
              <div className="metric-content">
                <h3>{t('dashboard.pomodoros')}</h3>
                <div className="metric-value">{currentData.pomodoros}</div>
                <div className="metric-subtitle">{t('dashboard.completed')}</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">✅</div>
              <div className="metric-content">
                <h3>{t('dashboard.tasks')}</h3>
                <div className="metric-value">{currentData.tasks}</div>
                <div className="metric-subtitle">{t('dashboard.completed')}</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-content">
                <h3>{t('dashboard.efficiency')}</h3>
                <div className="metric-value">{currentData.efficiency}%</div>
                <div className="metric-subtitle">{t('dashboard.average')}</div>
              </div>
            </div>
          </div>

          {/* Başarılar */}
          <div className="achievements-section">
            <h3>{t('dashboard.achievements')}</h3>
            <div className="achievements-grid">
              {dashboardData.achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon">
                    {achievement.unlocked ? '🏆' : '🔒'}
                  </div>
                  <div className="achievement-content">
                    <h4>{achievement.title}</h4>
                    <p className="achievement-description">{achievement.description}</p>
                    {achievement.unlocked && achievement.date && (
                      <div className="achievement-date">
                        {format(new Date(achievement.date), 'dd MMM yyyy', { locale: dateLocale })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* İçgörüler */}
          <div className="insights-section">
            <h3>{t('dashboard.insights')}</h3>
            <div className="insights-list">
              {dashboardData.insights.map((insight, index) => (
                <div key={index} className={`insight-item ${insight.type}`}>
                  <div className="insight-icon">
                    {insight.type === 'success' && '✅'}
                    {insight.type === 'info' && 'ℹ️'}
                    {insight.type === 'warning' && '⚠️'}
                  </div>
                  <div className="insight-message">{insight.message}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hedefler */}
          <div className="goals-section">
            <h3>{t('dashboard.goals')}</h3>
            <div className="goals-list">
              <div className="goal-item">
                <div className="goal-label">{t('dashboard.dailyGoal')}</div>
                <div className="goal-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${Math.min((currentData.focusTime / 60) / dashboardData.goals.daily * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="goal-value">
                  {Math.floor(currentData.focusTime / 60)}h / {dashboardData.goals.daily}h
                </div>
              </div>
              
              <div className="goal-item">
                <div className="goal-label">{t('dashboard.weeklyGoal')}</div>
                <div className="goal-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${Math.min((dashboardData.thisWeek.focusTime / 60) / dashboardData.goals.weekly * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="goal-value">
                  {Math.floor(dashboardData.thisWeek.focusTime / 60)}h / {dashboardData.goals.weekly}h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityDashboard;
