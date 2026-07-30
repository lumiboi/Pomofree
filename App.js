import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  AppState,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

// Timer settings
const TIMER_SETTINGS = {
  pomodoro: 25 * 60, // 25 dakika
  short: 5 * 60,     // 5 dakika  
  long: 15 * 60,     // 15 dakika
};

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [timerState, setTimerState] = useState({
    time: TIMER_SETTINGS.pomodoro,
    totalTime: TIMER_SETTINGS.pomodoro,
    isActive: false,
    mode: 'pomodoro',
    completedPomodoros: 0,
    startTime: null,
  });

  const intervalRef = useRef(null);

  // Initialize app
  useEffect(() => {
    setupNotifications();
    loadTimerState();
    
    // App state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Setup notifications
  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Bildirim İzni', 'Uygulamanın düzgün çalışması için bildirim izni gerekli!');
    }

    // Notification channel (Android)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('timer', {
        name: 'Pomodoro Timer',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
        sound: true,
      });
    }
  };

  // Load timer state from storage
  const loadTimerState = async () => {
    try {
      const saved = await AsyncStorage.getItem('timerState');
      if (saved) {
        const parsedState = JSON.parse(saved);
        
        // Eğer timer aktifse ve başlangıç zamanı varsa, geçen süreyi hesapla
        if (parsedState.isActive && parsedState.startTime) {
          const elapsed = Math.floor((Date.now() - parsedState.startTime) / 1000);
          const remaining = Math.max(0, parsedState.totalTime - elapsed);
          
          if (remaining > 0) {
            setTimerState({
              ...parsedState,
              time: remaining,
            });
            startInterval();
          } else {
            // Timer background'da tamamlanmış
            setTimerState({
              ...parsedState,
              time: 0,
              isActive: false,
              startTime: null,
            });
            handleTimerComplete();
          }
        } else {
          setTimerState(parsedState);
        }
      }
    } catch (error) {
      console.error('Timer state yüklenemedi:', error);
    }
  };

  // Save timer state
  const saveTimerState = async (state) => {
    try {
      await AsyncStorage.setItem('timerState', JSON.stringify(state));
    } catch (error) {
      console.error('Timer state kaydedilemedi:', error);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start interval
  const startInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setTimerState(prev => {
        const newTime = prev.time - 1;
        
        if (newTime <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          handleTimerComplete();
          return {
            ...prev,
            time: 0,
            isActive: false,
            startTime: null,
          };
        }
        
        return {
          ...prev,
          time: newTime,
        };
      });
    }, 1000);
  };

  // Handle timer complete
  const handleTimerComplete = async () => {
    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (timerState.mode === 'pomodoro') {
      // Pomodoro tamamlandı
      const newCompletedCount = timerState.completedPomodoros + 1;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍅 Pomodoro Tamamlandı!',
          body: `${newCompletedCount}. pomodoro tamamlandı! Harika iş! Şimdi mola zamanı.`,
          sound: true,
          data: { type: 'pomodoro_complete' },
        },
        trigger: null,
      });

      setTimerState(prev => ({
        ...prev,
        completedPomodoros: newCompletedCount,
      }));

      // Mola öner
      Alert.alert(
        '🍅 Pomodoro Tamamlandı!',
        `${newCompletedCount}. pomodoro tamamlandı! Harika iş!`,
        [
          {
            text: 'Kısa Mola (5dk)',
            onPress: () => switchMode('short'),
          },
          {
            text: 'Uzun Mola (15dk)',
            onPress: () => switchMode('long'),
          },
          {
            text: 'Devam Et',
            onPress: () => switchMode('pomodoro'),
            style: 'cancel',
          },
        ]
      );
    } else {
      // Mola tamamlandı
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Mola Bitti!',
          body: 'Mola zamanı sona erdi. Yeni bir pomodoro başlatmaya hazır mısın?',
          sound: true,
          data: { type: 'break_complete' },
        },
        trigger: null,
      });

      Alert.alert(
        '⏰ Mola Bitti!',
        'Mola zamanı sona erdi. Yeni bir pomodoro başlatmaya hazır mısın?',
        [
          {
            text: 'Pomodoro Başlat',
            onPress: () => switchMode('pomodoro'),
          },
          {
            text: 'Biraz Daha Mola',
            onPress: () => {}, // Hiçbir şey yapmaz
            style: 'cancel',
          },
        ]
      );
    }

    deactivateKeepAwake();
  };

  // Switch mode
  const switchMode = (mode) => {
    const newTime = TIMER_SETTINGS[mode];
    const newState = {
      ...timerState,
      mode,
      time: newTime,
      totalTime: newTime,
      isActive: false,
      startTime: null,
    };
    
    setTimerState(newState);
    saveTimerState(newState);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Toggle timer
  const toggleTimer = async () => {
    if (timerState.isActive) {
      // Durdur
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      const newState = {
        ...timerState,
        isActive: false,
        startTime: null,
      };
      
      setTimerState(newState);
      saveTimerState(newState);
      deactivateKeepAwake();
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Başlat
      const startTime = Date.now();
      const newState = {
        ...timerState,
        isActive: true,
        startTime,
      };
      
      setTimerState(newState);
      saveTimerState(newState);
      startInterval();
      activateKeepAwake();
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Reset timer
  const resetTimer = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const newTime = TIMER_SETTINGS[timerState.mode];
    const newState = {
      ...timerState,
      time: newTime,
      totalTime: newTime,
      isActive: false,
      startTime: null,
    };
    
    setTimerState(newState);
    saveTimerState(newState);
    deactivateKeepAwake();
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Handle app state change
  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background' && timerState.isActive) {
      // Background'a geçerken bildirim schedule et
      const remainingTime = timerState.time;
      if (remainingTime > 0) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: timerState.mode === 'pomodoro' ? '🍅 Pomodoro Bitti!' : '⏰ Mola Bitti!',
            body: timerState.mode === 'pomodoro' 
              ? 'Odaklanma seansın tamamlandı!' 
              : 'Mola zamanı sona erdi!',
            sound: true,
          },
          trigger: {
            seconds: remainingTime,
          },
        });
      }
    }
  };

  // Calculate progress
  const getProgress = () => {
    if (timerState.totalTime === 0) return 0;
    return ((timerState.totalTime - timerState.time) / timerState.totalTime) * 100;
  };

  // Get mode color
  const getModeColor = () => {
    switch (timerState.mode) {
      case 'pomodoro': return ['#FF6B6B', '#FF5722'];
      case 'short': return ['#4ECDC4', '#26A69A'];
      case 'long': return ['#45B7D1', '#2196F3'];
      default: return ['#FF6B6B', '#FF5722'];
    }
  };

  const progress = getProgress();
  const modeColors = getModeColor();

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>🍅 Pomofree</Text>
          <Text style={styles.completedCount}>
            Tamamlanan: {timerState.completedPomodoros}
          </Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeContainer}>
          {['pomodoro', 'short', 'long'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                timerState.mode === mode && styles.activeModeButton,
                timerState.mode === mode && { backgroundColor: modeColors[0] },
              ]}
              onPress={() => switchMode(mode)}
              disabled={timerState.isActive}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  timerState.mode === mode && styles.activeModeButtonText,
                ]}
              >
                {mode === 'pomodoro' ? 'Pomodoro' : mode === 'short' ? 'Kısa' : 'Uzun'}
              </Text>
              <Text
                style={[
                  styles.modeTime,
                  timerState.mode === mode && styles.activeModeTime,
                ]}
              >
                {formatTime(TIMER_SETTINGS[mode])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <View style={styles.progressRing}>
            {/* Progress background */}
            <View style={[styles.progressBackground, { borderColor: 'rgba(255,255,255,0.1)' }]} />
            
            {/* Progress indicator */}
            <View
              style={[
                styles.progressIndicator,
                {
                  borderColor: modeColors[0],
                  transform: [{ rotate: `${(progress - 25) * 3.6}deg` }],
                },
              ]}
            />
          </View>
          
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerText}>{formatTime(timerState.time)}</Text>
            <Text style={styles.modeText}>
              {timerState.mode === 'pomodoro' 
                ? 'Odaklanma Zamanı' 
                : timerState.mode === 'short' 
                  ? 'Kısa Mola' 
                  : 'Uzun Mola'}
            </Text>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: timerState.isActive ? '#F39C12' : modeColors[0] },
            ]}
            onPress={toggleTimer}
          >
            <Ionicons
              name={timerState.isActive ? 'pause' : 'play'}
              size={32}
              color="white"
            />
            <Text style={styles.primaryButtonText}>
              {timerState.isActive ? 'Durdur' : 'Başlat'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={resetTimer}
          >
            <Ionicons name="refresh" size={24} color="#8E8E93" />
            <Text style={styles.secondaryButtonText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  completedCount: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 50,
    paddingHorizontal: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#FF6B6B',
  },
  modeButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeModeButtonText: {
    color: '#FFFFFF',
  },
  modeTime: {
    color: '#666',
    fontSize: 12,
  },
  activeModeTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  progressRing: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
  },
  progressIndicator: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#FF6B6B',
    transform: [{ rotate: '-90deg' }],
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modeText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
    minWidth: 200,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});


