import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdvancedReports = ({ user, closeModal }) => {
  const { t, language } = useTranslation();
  const [reportData, setReportData] = useState({
    dailyStats: [],
    weeklyStats: [],
    monthlyStats: [],
    projectStats: [],
    productivityTrends: [],
    bestHours: [],
    streaks: {},
    totalFocusTime: 0,
    completedPomodoros: 0,
    averageSessionLength: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);

  const dateLocale = language === 'tr' ? tr : enUS;

  useEffect(() => {
    if (user) {
      fetchAdvancedReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedPeriod]);

  const fetchAdvancedReportData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRealReportData();
      setReportData(data);
    } catch (error) {
      console.error('Rapor verisi yüklenirken hata:', error);
      // Hata durumunda boş veri döndür
      setReportData({
        dailyStats: [],
        weeklyStats: [],
        monthlyStats: [],
        projectStats: [],
        productivityTrends: [],
        bestHours: [],
        streaks: { current: 0, longest: 0, total: 0 },
        totalFocusTime: 0,
        completedPomodoros: 0,
        averageSessionLength: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase'den gerçek veri çekme
  const fetchRealReportData = async () => {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    const now = new Date();
    const startDate = selectedPeriod === 'week' 
      ? startOfWeek(now) 
      : selectedPeriod === 'month' 
      ? startOfMonth(now) 
      : new Date(now.getFullYear(), 0, 1);

    const endDate = selectedPeriod === 'week' 
      ? endOfWeek(now) 
      : selectedPeriod === 'month' 
      ? endOfMonth(now) 
      : now;

    // Tarihleri Timestamp'e çevir (şu an kullanılmıyor ama gelecekte gerekebilir)
    // const startTimestamp = Timestamp.fromDate(startDate);
    // const endTimestamp = Timestamp.fromDate(endDate);

    // Focus sessions'ları çek (gerçek veri kaynağı)
    const focusSessionsQuery = query(
      collection(db, 'users', user.uid, 'focusSessions')
    );
    
    const focusSessionsSnapshot = await getDocs(focusSessionsQuery);
    const allFocusSessions = focusSessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate()
    }));

    // Tarihe göre filtrele
    const pomodoros = allFocusSessions.filter(s => {
      if (!s.completedAt) return false;
      const sessionDate = new Date(s.completedAt);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    // Kullanıcının projelerini çek
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid)
    );
    
    const projectsSnapshot = await getDocs(projectsQuery);
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Günlük istatistikleri hesapla
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyStats = days.map(day => {
      const dayPomodoros = pomodoros.filter(p => 
        p.completedAt && isSameDay(p.completedAt, day)
      );
      
      const focusTime = dayPomodoros.reduce((total, p) => total + (p.duration || 25), 0) / 60; // Saniyeyi dakikaya çevir
      const pomodorosCount = dayPomodoros.length;
      
      return {
        date: day,
        focusTime,
        pomodoros: pomodorosCount,
        tasks: 0 // Bu bilgiyi tasks koleksiyonundan çekebiliriz
      };
    });

    // Proje istatistikleri hesapla
    const projectStats = projects.map(project => {
      const projectPomodoros = pomodoros.filter(p => p.projectId === project.id);
      const totalTime = projectPomodoros.reduce((total, p) => total + (p.duration || 25), 0) / 60; // Saniyeyi dakikaya çevir
      
      return {
        name: project.name,
        time: totalTime,
        pomodoros: projectPomodoros.length,
        color: project.color || '#FF6B6B'
      };
    }).filter(p => p.time > 0);

    // Toplam istatistikler
    const totalFocusTime = pomodoros.reduce((total, p) => total + (p.duration || 25), 0) / 60; // Saniyeyi dakikaya çevir
    const completedPomodoros = pomodoros.length;
    const averageSessionLength = completedPomodoros > 0 ? totalFocusTime / completedPomodoros : 0;

    // Streak hesaplama (basit versiyon)
    const streaks = calculateStreaks(pomodoros);

    return {
      dailyStats,
      weeklyStats: [],
      monthlyStats: [],
      projectStats,
      productivityTrends: [],
      bestHours: [],
      streaks,
      totalFocusTime,
      completedPomodoros,
      averageSessionLength: Math.round(averageSessionLength)
    };
  };

  // Streak hesaplama fonksiyonu
  const calculateStreaks = (pomodoros) => {
    if (pomodoros.length === 0) {
      return { current: 0, longest: 0, total: 0 };
    }

    // Tarihleri sırala
    const sortedDates = pomodoros
      .map(p => p.completedAt)
      .filter(date => date)
      .sort((a, b) => a - b);

    if (sortedDates.length === 0) {
      return { current: 0, longest: 0, total: 0 };
    }

    // Günlük streak hesapla
    const dailyStreaks = [];
    let currentStreak = 1;
    let longestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currDate = sortedDates[i];
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        dailyStreaks.push(currentStreak);
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }

    dailyStreaks.push(currentStreak);
    longestStreak = Math.max(longestStreak, currentStreak);

    return {
      current: currentStreak,
      longest: longestStreak,
      total: dailyStreaks.length
    };
  };

  const exportToCSV = () => {
    const csvData = reportData.dailyStats.map(day => ({
      Date: format(day.date, 'yyyy-MM-dd', { locale: dateLocale }),
      'Focus Time (minutes)': day.focusTime,
      'Pomodoros': day.pomodoros,
      'Tasks Completed': day.tasks
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomofree-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false
      }
    }
  };

  const dailyChartData = {
    labels: reportData.dailyStats.length > 0 
      ? reportData.dailyStats.map(day => format(day.date, 'MMM dd', { locale: dateLocale }))
      : [],
    datasets: [
      {
        label: t('reports.focusTime'),
        data: reportData.dailyStats.length > 0 
          ? reportData.dailyStats.map(day => day.focusTime)
          : [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: t('reports.pomodoros'),
        data: reportData.dailyStats.length > 0 
          ? reportData.dailyStats.map(day => day.pomodoros)
          : [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  };

  const projectChartData = {
    labels: reportData.projectStats.length > 0 
      ? reportData.projectStats.map(project => project.name)
      : [],
    datasets: [{
      data: reportData.projectStats.length > 0 
        ? reportData.projectStats.map(project => project.time)
        : [],
      backgroundColor: reportData.projectStats.length > 0 
        ? reportData.projectStats.map(project => project.color)
        : [],
      borderWidth: 2
    }]
  };

  const productivityChartData = {
    labels: reportData.productivityTrends.length > 0 
      ? reportData.productivityTrends.map(trend => `D${trend.day}`)
      : [],
    datasets: [{
      label: t('reports.productivity'),
      data: reportData.productivityTrends.length > 0 
        ? reportData.productivityTrends.map(trend => trend.productivity)
        : [],
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      tension: 0.1
    }]
  };

  const productivityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 10
        }
      }
    }
  };

  const bestHoursData = {
    labels: reportData.bestHours.length > 0 
      ? reportData.bestHours.map(hour => `${hour.hour}:00`)
      : [],
    datasets: [{
      label: t('reports.focusTime'),
      data: reportData.bestHours.length > 0 
        ? reportData.bestHours.map(hour => hour.focusTime)
        : [],
      backgroundColor: 'rgba(153, 102, 255, 0.6)',
      borderColor: 'rgba(153, 102, 255, 1)',
      borderWidth: 1
    }]
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content advanced-reports" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t('reports.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content advanced-reports" onClick={(e) => e.stopPropagation()}>
        <div className="reports-header">
          <h2>{t('report.advancedTitle')}</h2>
          <div className="reports-controls">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="period-selector"
            >
              <option value="week">{t('reports.thisWeek')}</option>
              <option value="month">{t('reports.thisMonth')}</option>
              <option value="year">{t('reports.thisYear')}</option>
            </select>
            <button onClick={exportToCSV} className="btn btn-secondary">
              {t('reports.exportCSV')}
            </button>
            <button onClick={closeModal} className="btn btn-secondary">
              {t('reports.close')}
            </button>
          </div>
        </div>

        <div className="reports-grid">
          {/* Özet Kartları */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>{t('reports.totalFocusTime')}</h3>
              <div className="big-number">{Math.floor(reportData.totalFocusTime / 60)}h {reportData.totalFocusTime % 60}m</div>
            </div>
            <div className="summary-card">
              <h3>{t('reports.completedPomodoros')}</h3>
              <div className="big-number">{reportData.completedPomodoros}</div>
            </div>
            <div className="summary-card">
              <h3>{t('reports.currentStreak')}</h3>
              <div className="big-number">{reportData.streaks.current} {t('reports.days')}</div>
            </div>
            <div className="summary-card">
              <h3>{t('reports.averageSession')}</h3>
              <div className="big-number">{reportData.averageSessionLength}m</div>
            </div>
          </div>

          {/* Günlük Trend Grafiği */}
          <div className="chart-container">
            <h3>{t('reports.dailyTrend')}</h3>
            <div style={{ height: '300px' }}>
              {reportData.dailyStats.length > 0 ? (
                <Line data={dailyChartData} options={chartOptions} />
              ) : (
                <div className="no-data-message">
                  <p>Bu dönemde veri bulunmuyor. Pomodoro tamamlayarak veri oluşturun.</p>
                </div>
              )}
            </div>
          </div>

          {/* Proje Dağılımı */}
          <div className="chart-container">
            <h3>{t('reports.projectDistribution')}</h3>
            <div style={{ height: '300px' }}>
              {reportData.projectStats.length > 0 ? (
                <Doughnut data={projectChartData} options={donutOptions} />
              ) : (
                <div className="no-data-message">
                  <p>Proje verisi bulunmuyor. Projeler oluşturup Pomodoro tamamlayın.</p>
                </div>
              )}
            </div>
          </div>

          {/* Verimlilik Trendi */}
          <div className="chart-container">
            <h3>{t('reports.productivityTrend')}</h3>
            <div style={{ height: '300px' }}>
              {reportData.productivityTrends.length > 0 ? (
                <Line data={productivityChartData} options={productivityOptions} />
              ) : (
                <div className="no-data-message">
                  <p>Verimlilik verisi bulunmuyor. Daha fazla Pomodoro tamamlayın.</p>
                </div>
              )}
            </div>
          </div>

          {/* En Verimli Saatler */}
          <div className="chart-container">
            <h3>{t('reports.bestHours')}</h3>
            <div style={{ height: '300px' }}>
              {reportData.bestHours.length > 0 ? (
                <Bar data={bestHoursData} options={chartOptions} />
              ) : (
                <div className="no-data-message">
                  <p>Saatlik veri bulunmuyor. Farklı saatlerde Pomodoro tamamlayın.</p>
                </div>
              )}
            </div>
          </div>

          {/* Streak Bilgileri */}
          <div className="streak-info">
            <h3>{t('reports.streakStats')}</h3>
            <div className="streak-cards">
              <div className="streak-card">
                <span className="streak-label">{t('reports.currentStreak')}</span>
                <span className="streak-value">{reportData.streaks.current} {t('reports.days')}</span>
              </div>
              <div className="streak-card">
                <span className="streak-label">{t('reports.longestStreak')}</span>
                <span className="streak-value">{reportData.streaks.longest} {t('reports.days')}</span>
              </div>
              <div className="streak-card">
                <span className="streak-label">{t('reports.totalStreaks')}</span>
                <span className="streak-value">{reportData.streaks.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;
