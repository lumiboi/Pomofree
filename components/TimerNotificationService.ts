import PushNotification, {PushNotificationScheduleObject} from 'react-native-push-notification';
import {Platform} from 'react-native';

export interface NotificationData {
  title: string;
  message: string;
  scheduleDate?: Date;
  playSound?: boolean;
  vibration?: number;
  priority?: 'high' | 'normal' | 'low';
}

class TimerNotificationService {
  private static instance: TimerNotificationService;
  private notificationId = 1;

  private constructor() {
    this.configure();
  }

  public static getInstance(): TimerNotificationService {
    if (!TimerNotificationService.instance) {
      TimerNotificationService.instance = new TimerNotificationService();
    }
    return TimerNotificationService.instance;
  }

  private configure() {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('Push notification token:', token);
      },
      onNotification: function (notification) {
        console.log('Notification received:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Android için channel oluştur
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'pomodoro-timer',
          channelName: 'Pomodoro Timer',
          channelDescription: 'Pomodoro timer notifications',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Channel created: ${created}`)
      );
    }
  }

  public showInstantNotification(data: NotificationData) {
    const notificationConfig = {
      id: this.notificationId++,
      title: data.title,
      message: data.message,
      playSound: data.playSound !== false,
      soundName: 'default',
      vibrate: data.vibration || true,
      vibration: data.vibration || 300,
      priority: data.priority || 'high',
      channelId: 'pomodoro-timer',
      autoCancel: true,
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
      bigText: data.message,
      subText: 'Pomofree App',
      bigLargeIcon: 'ic_launcher',
      color: 'red',
      ongoing: false,
      invokeApp: true,
      actions: Platform.OS === 'android' ? ['OK'] : undefined,
    };

    PushNotification.localNotification(notificationConfig);
  }

  public scheduleNotification(data: NotificationData) {
    if (!data.scheduleDate) {
      console.error('Schedule date is required for scheduled notifications');
      return;
    }

    const notificationConfig: PushNotificationScheduleObject = {
      id: this.notificationId++,
      title: data.title,
      message: data.message,
      date: data.scheduleDate,
      playSound: data.playSound !== false,
      soundName: 'default',
      vibrate: data.vibration || true,
      vibration: data.vibration || 300,
      priority: data.priority || 'high',
      channelId: 'pomodoro-timer',
      autoCancel: true,
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
      bigText: data.message,
      subText: 'Pomofree App',
      color: 'red',
      ongoing: false,
      invokeApp: true,
      actions: Platform.OS === 'android' ? ['Başlat', 'Ertele'] : undefined,
    };

    PushNotification.localNotificationSchedule(notificationConfig);
  }

  public cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  public cancelNotification(id: number) {
    PushNotification.cancelLocalNotifications({id: id.toString()});
  }

  // Pomodoro tamamlanma bildirimi
  public showPomodoroCompletedNotification() {
    this.showInstantNotification({
      title: '🍅 Pomodoro Tamamlandı!',
      message: 'Harika iş! 25 dakikalık odaklanma seansını tamamladın. Şimdi 5 dakikalık mola zamanı!',
      vibration: 500,
      priority: 'high',
    });
  }

  // Mola tamamlanma bildirimi
  public showBreakCompletedNotification() {
    this.showInstantNotification({
      title: '⏰ Mola Bitti!',
      message: 'Mola zamanı sona erdi. Yeni bir pomodoro seansı başlatmaya hazır mısın?',
      vibration: 300,
      priority: 'high',
    });
  }

  // Timer background'da çalışırken bildirim schedule et
  public scheduleTimerNotification(remainingSeconds: number, isPomodoroMode: boolean) {
    const scheduleDate = new Date(Date.now() + remainingSeconds * 1000);
    
    if (isPomodoroMode) {
      this.scheduleNotification({
        title: '🍅 Pomodoro Tamamlandı!',
        message: 'Odaklanma seansın bitti! Şimdi kısa bir mola ver.',
        scheduleDate,
        vibration: 500,
        priority: 'high',
      });
    } else {
      this.scheduleNotification({
        title: '⏰ Mola Bitti!',
        message: 'Mola zamanı sona erdi. Yeni pomodoro için hazır mısın?',
        scheduleDate,
        vibration: 300,
        priority: 'high',
      });
    }
  }

  // Günlük motivasyon bildirimi
  public scheduleDailyMotivation() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Sabah 9'da

    this.scheduleNotification({
      title: '🌟 Yeni Gün, Yeni Hedefler!',
      message: 'Bugün kaç pomodoro tamamlamayı planlıyorsun? Hadi başlayalım!',
      scheduleDate: tomorrow,
      priority: 'normal',
    });
  }

  // Haftalık başarı özeti
  public showWeeklySuccessNotification(completedPomodoros: number) {
    this.showInstantNotification({
      title: '📊 Haftalık Başarın',
      message: `Bu hafta ${completedPomodoros} pomodoro tamamladın! ${completedPomodoros > 20 ? 'Muhteşem!' : 'Devam et!'}`,
      priority: 'normal',
    });
  }
}

export default TimerNotificationService;


