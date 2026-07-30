import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { TimerState, TimerSettings } from '../types';

const STORAGE_KEY = 'pomofree_timer_state';

export const useTimer = (settings: TimerSettings) => {
  const [timerState, setTimerState] = useState<TimerState>({
    time: settings.pomodoro,
    totalTime: settings.pomodoro,
    isActive: false,
    mode: 'pomodoro',
    completedPomodoros: 0,
    startTime: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Save state to storage
  const saveState = useCallback(async (state: TimerState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }, []);

  // Load state from storage
  const loadState = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState: TimerState = JSON.parse(saved);
        
        // Calculate elapsed time if timer was active
        if (parsedState.isActive && parsedState.startTime) {
          const elapsed = Math.floor((Date.now() - parsedState.startTime) / 1000);
          const remaining = Math.max(0, parsedState.totalTime - elapsed);
          
          if (remaining > 0) {
            setTimerState({
              ...parsedState,
              time: remaining,
            });
            return parsedState;
          } else {
            // Timer finished while app was closed
            setTimerState({
              ...parsedState,
              time: 0,
              isActive: false,
              startTime: null,
            });
            setIsFinished(true);
            return parsedState;
          }
        } else {
          setTimerState(parsedState);
          return parsedState;
        }
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
    return null;
  }, []);

  // Initialize timer
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Update timer when settings change
  useEffect(() => {
    if (!timerState.isActive && timerState.time === 0) {
      const newTime = settings[timerState.mode];
      setTimerState(prev => ({
        ...prev,
        time: newTime,
        totalTime: newTime,
      }));
    }
  }, [settings, timerState.mode, timerState.isActive, timerState.time]);

  // Start interval
  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setTimerState(prev => {
        const newTime = prev.time - 1;
        
        if (newTime <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsFinished(true);
          
          const finalState = {
            ...prev,
            time: 0,
            isActive: false,
            startTime: null,
          };
          
          // Update completed pomodoros if it was a pomodoro session
          if (prev.mode === 'pomodoro') {
            finalState.completedPomodoros = prev.completedPomodoros + 1;
          }
          
          return finalState;
        }
        
        return {
          ...prev,
          time: newTime,
        };
      });
    }, 1000);
  }, []);

  // Timer control functions
  const startTimer = useCallback(async () => {
    const startTime = Date.now();
    const newState = {
      ...timerState,
      isActive: true,
      startTime,
    };
    
    setTimerState(newState);
    await saveState(newState);
    startInterval();
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [timerState, saveState, startInterval]);

  const stopTimer = useCallback(async () => {
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
    await saveState(newState);
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [timerState, saveState]);

  const resetTimer = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const newTime = settings[timerState.mode];
    const newState = {
      ...timerState,
      time: newTime,
      totalTime: newTime,
      isActive: false,
      startTime: null,
    };
    
    setTimerState(newState);
    await saveState(newState);
    setIsFinished(false);
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [settings, timerState, saveState]);

  const switchMode = useCallback(async (mode: 'pomodoro' | 'short' | 'long') => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const newTime = settings[mode];
    const newState = {
      ...timerState,
      mode,
      time: newTime,
      totalTime: newTime,
      isActive: false,
      startTime: null,
    };
    
    setTimerState(newState);
    await saveState(newState);
    setIsFinished(false);
  }, [settings, timerState, saveState]);

  const toggleTimer = useCallback(async () => {
    if (timerState.isActive) {
      await stopTimer();
    } else {
      await startTimer();
    }
  }, [timerState.isActive, startTimer, stopTimer]);

  // Auto-start interval when timer becomes active
  useEffect(() => {
    if (timerState.isActive && timerState.time > 0 && !intervalRef.current) {
      startInterval();
    }
  }, [timerState.isActive, timerState.time, startInterval]);

  // Save state when it changes
  useEffect(() => {
    saveState(timerState);
  }, [timerState, saveState]);

  // Schedule background notification
  const scheduleBackgroundNotification = useCallback(async () => {
    if (timerState.isActive && timerState.time > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: timerState.mode === 'pomodoro' ? '🍅 Pomodoro Tamamlandı!' : '⏰ Mola Bitti!',
          body: timerState.mode === 'pomodoro' 
            ? 'Odaklanma seansın tamamlandı! Şimdi mola zamanı.' 
            : 'Mola sona erdi. Yeni bir pomodoro başlatmaya hazır mısın?',
          sound: true,
        },
        trigger: {
          seconds: timerState.time,
        },
      });
    }
  }, [timerState]);

  // Clear finished state
  const clearFinished = useCallback(() => {
    setIsFinished(false);
  }, []);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress
  const getProgress = useCallback((): number => {
    if (timerState.totalTime === 0) return 0;
    return ((timerState.totalTime - timerState.time) / timerState.totalTime) * 100;
  }, [timerState.totalTime, timerState.time]);

  return {
    timerState,
    isFinished,
    startTimer,
    stopTimer,
    resetTimer,
    switchMode,
    toggleTimer,
    clearFinished,
    formatTime,
    getProgress,
    scheduleBackgroundNotification,
  };
};

