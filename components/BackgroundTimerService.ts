import BackgroundTimer from 'react-native-background-timer';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TimerData {
  startTime: number;
  duration: number;
  isActive: boolean;
  mode: 'pomodoro' | 'short' | 'long';
}

class BackgroundTimerService {
  private static instance: BackgroundTimerService;
  private intervalId: number | null = null;
  private onTickCallback?: (remainingTime: number) => void;
  private onCompleteCallback?: () => void;

  private constructor() {}

  public static getInstance(): BackgroundTimerService {
    if (!BackgroundTimerService.instance) {
      BackgroundTimerService.instance = new BackgroundTimerService();
    }
    return BackgroundTimerService.instance;
  }

  public startTimer(
    duration: number,
    onTick: (remainingTime: number) => void,
    onComplete: () => void,
  ) {
    this.onTickCallback = onTick;
    this.onCompleteCallback = onComplete;

    const startTime = Date.now();
    this.saveTimerState({
      startTime,
      duration,
      isActive: true,
      mode: 'pomodoro', // Bu değer dışarıdan gelmeli
    });

    this.intervalId = BackgroundTimer.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);

      if (remaining <= 0) {
        this.stopTimer();
        this.onCompleteCallback?.();
      } else {
        this.onTickCallback?.(remaining);
      }
    }, 1000);
  }

  public stopTimer() {
    if (this.intervalId) {
      BackgroundTimer.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.clearTimerState();
  }

  public pauseTimer() {
    if (this.intervalId) {
      BackgroundTimer.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public resumeTimer(
    remainingTime: number,
    onTick: (remainingTime: number) => void,
    onComplete: () => void,
  ) {
    this.startTimer(remainingTime, onTick, onComplete);
  }

  // App background/foreground durumlarını handle et
  public async handleAppStateChange(nextAppState: string) {
    if (nextAppState === 'background') {
      // Timer aktifse, başlangıç zamanını kaydet
      await this.saveAppStateToBackground();
    } else if (nextAppState === 'active') {
      // Foreground'a dönerken timer durumunu kontrol et
      await this.restoreFromBackground();
    }
  }

  private async saveAppStateToBackground() {
    try {
      const backgroundTime = Date.now();
      await AsyncStorage.setItem('timer_background_time', backgroundTime.toString());
    } catch (error) {
      console.error('Background time kaydedilemedi:', error);
    }
  }

  private async restoreFromBackground() {
    try {
      const backgroundTimeStr = await AsyncStorage.getItem('timer_background_time');
      const timerStateStr = await AsyncStorage.getItem('timer_state');
      
      if (backgroundTimeStr && timerStateStr) {
        const backgroundTime = parseInt(backgroundTimeStr);
        const timerState: TimerData = JSON.parse(timerStateStr);
        
        if (timerState.isActive) {
          const timeInBackground = Math.floor((Date.now() - backgroundTime) / 1000);
          const totalElapsed = Math.floor((backgroundTime - timerState.startTime) / 1000) + timeInBackground;
          const remaining = Math.max(0, timerState.duration - totalElapsed);
          
          if (remaining <= 0) {
            // Timer background'da tamamlanmış
            this.onCompleteCallback?.();
          } else {
            // Timer hala devam ediyor, kalan süreyi güncelle
            this.onTickCallback?.(remaining);
          }
        }
      }
      
      // Background time'ı temizle
      await AsyncStorage.removeItem('timer_background_time');
    } catch (error) {
      console.error('Background state restore edilemedi:', error);
    }
  }

  private async saveTimerState(timerData: TimerData) {
    try {
      await AsyncStorage.setItem('timer_state', JSON.stringify(timerData));
    } catch (error) {
      console.error('Timer state kaydedilemedi:', error);
    }
  }

  private async clearTimerState() {
    try {
      await AsyncStorage.removeItem('timer_state');
      await AsyncStorage.removeItem('timer_background_time');
    } catch (error) {
      console.error('Timer state temizlenemedi:', error);
    }
  }

  // Aktif timer olup olmadığını kontrol et
  public async hasActiveTimer(): Promise<boolean> {
    try {
      const timerStateStr = await AsyncStorage.getItem('timer_state');
      if (timerStateStr) {
        const timerState: TimerData = JSON.parse(timerStateStr);
        return timerState.isActive;
      }
      return false;
    } catch (error) {
      console.error('Timer state kontrol edilemedi:', error);
      return false;
    }
  }

  // Kalan süreyi hesapla
  public async getRemainingTime(): Promise<number> {
    try {
      const timerStateStr = await AsyncStorage.getItem('timer_state');
      if (timerStateStr) {
        const timerState: TimerData = JSON.parse(timerStateStr);
        const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
        return Math.max(0, timerState.duration - elapsed);
      }
      return 0;
    } catch (error) {
      console.error('Kalan süre hesaplanamadı:', error);
      return 0;
    }
  }
}

export default BackgroundTimerService;


