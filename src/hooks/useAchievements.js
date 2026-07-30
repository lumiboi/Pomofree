import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from './useTranslation';

export const useAchievements = (user, stats, weeklyFocusTime) => {
  const [achievements, setAchievements] = useState([]);
  const [newAchievements, setNewAchievements] = useState([]);
  const { t } = useTranslation();

  // Achievement tanımlarını oluştur
  const getAchievementDefinitions = () => [
    {
      id: 'first_pomodoro',
      title: t('achievements.firstPomodoro'),
      description: t('achievements.firstPomodoroDesc'),
      icon: '🍅',
      condition: (stats) => stats.completedPomodoros >= 1,
      unlocked: false
    },
    {
      id: 'pomodoro_5',
      title: t('achievements.pomodoroMaster'),
      description: t('achievements.pomodoroMasterDesc'),
      icon: '🔥',
      condition: (stats) => stats.completedPomodoros >= 5,
      unlocked: false
    },
    {
      id: 'pomodoro_10',
      title: t('achievements.pomodoroChampion'),
      description: t('achievements.pomodoroChampionDesc'),
      icon: '🏆',
      condition: (stats) => stats.completedPomodoros >= 10,
      unlocked: false
    },
    {
      id: 'pomodoro_25',
      title: t('achievements.pomodoroLegend'),
      description: t('achievements.pomodoroLegendDesc'),
      icon: '👑',
      condition: (stats) => stats.completedPomodoros >= 25,
      unlocked: false
    },
    {
      id: 'pomodoro_50',
      title: t('achievements.pomodoroGod'),
      description: t('achievements.pomodoroGodDesc'),
      icon: '⚡',
      condition: (stats) => stats.completedPomodoros >= 50,
      unlocked: false
    },
    {
      id: 'focus_1_hour',
      title: t('achievements.focusBeginner'),
      description: t('achievements.focusBeginnerDesc'),
      icon: '⏰',
      condition: (stats, weeklyFocusTime) => weeklyFocusTime >= 3600, // 1 saat = 3600 saniye
      unlocked: false
    },
    {
      id: 'focus_5_hours',
      title: t('achievements.focusMaster'),
      description: t('achievements.focusMasterDesc'),
      icon: '🎯',
      condition: (stats, weeklyFocusTime) => weeklyFocusTime >= 18000, // 5 saat = 18000 saniye
      unlocked: false
    },
    {
      id: 'focus_10_hours',
      title: t('achievements.focusChampion'),
      description: t('achievements.focusChampionDesc'),
      icon: '🚀',
      condition: (stats, weeklyFocusTime) => weeklyFocusTime >= 36000, // 10 saat = 36000 saniye
      unlocked: false
    },
    {
      id: 'focus_20_hours',
      title: t('achievements.focusLegend'),
      description: t('achievements.focusLegendDesc'),
      icon: '💎',
      condition: (stats, weeklyFocusTime) => weeklyFocusTime >= 72000, // 20 saat = 72000 saniye
      unlocked: false
    },
    {
      id: 'daily_streak_3',
      title: t('achievements.streak3'),
      description: t('achievements.streak3Desc'),
      icon: '🔥',
      condition: (stats) => stats.dailyStreak >= 3,
      unlocked: false
    },
    {
      id: 'daily_streak_7',
      title: t('achievements.streak7'),
      description: t('achievements.streak7Desc'),
      icon: '📅',
      condition: (stats) => stats.dailyStreak >= 7,
      unlocked: false
    },
    {
      id: 'daily_streak_30',
      title: t('achievements.streak30'),
      description: t('achievements.streak30Desc'),
      icon: '🗓️',
      condition: (stats) => stats.dailyStreak >= 30,
      unlocked: false
    },
    {
      id: 'social_focus_1',
      title: t('achievements.socialFirst'),
      description: t('achievements.socialFirstDesc'),
      icon: '🤝',
      condition: (stats) => stats.sharedSessions >= 1,
      unlocked: false
    },
    {
      id: 'social_focus_10',
      title: t('achievements.socialTen'),
      description: t('achievements.socialTenDesc'),
      icon: '🫶',
      condition: (stats) => stats.sharedSessions >= 10,
      unlocked: false
    }
  ];

  // Achievement'ları kontrol et
  const checkAchievements = async () => {
    if (!user) return;

    try {
      // Kullanıcının mevcut achievement'larını al
      const achievementsRef = collection(db, 'users', user.uid, 'achievements');
      const querySnapshot = await getDocs(achievementsRef);
      
      const unlockedAchievements = [];
      querySnapshot.forEach((doc) => {
        unlockedAchievements.push(doc.data());
      });

      // Yanlış kazanılmış achievement'ları kontrol et ve sil
      const achievementDefinitions = getAchievementDefinitions();
      const focusAchievements = ['focus_1_hour', 'focus_5_hours', 'focus_10_hours', 'focus_20_hours'];
      for (const achievementId of focusAchievements) {
        const isUnlocked = unlockedAchievements.some(ua => ua.achievementId === achievementId);
        if (isUnlocked) {
          const achievement = achievementDefinitions.find(a => a.id === achievementId);
          if (achievement && !achievement.condition(stats, weeklyFocusTime)) {
            // Yanlış kazanılmış, sil
            console.log(`Yanlış kazanılmış achievement siliniyor: ${achievementId}`);
            await deleteDoc(doc(db, 'users', user.uid, 'achievements', achievementId));
          }
        }
      }

      // Achievement'ları yeniden yükle
      const updatedQuerySnapshot = await getDocs(achievementsRef);
      const updatedUnlockedAchievements = [];
      updatedQuerySnapshot.forEach((doc) => {
        updatedUnlockedAchievements.push(doc.data());
      });

      const newUnlockedAchievements = [];

      // Her achievement'ı kontrol et
      for (const achievement of achievementDefinitions) {
        const isUnlocked = updatedUnlockedAchievements.some(ua => ua.achievementId === achievement.id);
        
        if (!isUnlocked && achievement.condition(stats, weeklyFocusTime)) {
          // Yeni achievement kazanıldı
          const newAchievement = {
            ...achievement,
            unlocked: true,
            unlockedAt: new Date(),
            userId: user.uid
          };

          // Firebase'e kaydet
          await setDoc(doc(db, 'users', user.uid, 'achievements', achievement.id), {
            achievementId: achievement.id,
            userId: user.uid,
            unlockedAt: new Date(),
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon
          });

          newUnlockedAchievements.push(newAchievement);
        }
      }

      // Yeni achievement'lar varsa göster (sadece daha önce gösterilmemiş olanlar)
      if (newUnlockedAchievements.length > 0) {
        // Daha önce gösterilen achievement'ları localStorage'dan al
        const shownAchievements = JSON.parse(localStorage.getItem('shownAchievements') || '[]');
        
        // Sadece daha önce gösterilmemiş olanları filtrele
        const notShownAchievements = newUnlockedAchievements.filter(achievement => 
          !shownAchievements.includes(achievement.id)
        );
        
        if (notShownAchievements.length > 0) {
          setNewAchievements(notShownAchievements);
          
          // Gösterilen achievement'ları localStorage'a kaydet
          const updatedShownAchievements = [...shownAchievements, ...notShownAchievements.map(a => a.id)];
          localStorage.setItem('shownAchievements', JSON.stringify(updatedShownAchievements));
          
          // 3 saniye sonra gizle
          setTimeout(() => {
            setNewAchievements([]);
          }, 3000);
        }
      }

      // Tüm achievement'ları güncelle
      const allAchievements = achievementDefinitions.map(achievement => ({
        ...achievement,
        unlocked: updatedUnlockedAchievements.some(ua => ua.achievementId === achievement.id)
      }));

      setAchievements(allAchievements);

    } catch (error) {
      console.error('Achievement kontrolü hatası:', error);
    }
  };

  // Stats, weeklyFocusTime veya dil değiştiğinde achievement'ları kontrol et
  useEffect(() => {
    if (user) {
      // Kullanıcı değiştiğinde localStorage'ı temizle
      const currentUserId = user.uid;
      const lastUserId = localStorage.getItem('lastUserId');
      if (lastUserId !== currentUserId) {
        localStorage.removeItem('shownAchievements');
        localStorage.setItem('lastUserId', currentUserId);
      }
      
      checkAchievements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, stats, weeklyFocusTime, t]);

  return {
    achievements,
    newAchievements,
    checkAchievements
  };
};
