// Bu, Service Worker'ın kendi kapsamıdır, 'window' yerine 'self' kullanılır.

self.addEventListener('message', event => {
  // Sadece 'START_TIMER' tipinde bir mesaj geldiğinde çalış
  if (event.data && event.data.type === 'START_TIMER') {
    const duration = event.data.duration; // App.js'ten gelen süre (saniye)
    const mode = event.data.mode; // 'pomodoro' veya mola modu

    // Belirtilen süre kadar bekledikten sonra bildirimi göster
    setTimeout(() => {
      const title = mode === 'pomodoro' ? 'Odaklanma Süresi Bitti!' : 'Mola Bitti!';
      const body = mode === 'pomodoro' ? 'Harika iş, şimdi kısa bir molanın tadını çıkar.' : 'Tekrar odaklanma zamanı!';
      
      // Service Worker'ın bildirim gösterme fonksiyonu
      self.registration.showNotification(title, {
        body: body,
        icon: '/logo192.png' // public klasöründeki bir ikonu kullanabilirsiniz
      });
    }, duration * 1000); // Saniyeyi milisaniyeye çevir
  }
});