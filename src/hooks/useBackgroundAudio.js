import { useCallback, useEffect, useRef } from 'react';

export const useBackgroundAudio = () => {
  const audioRef = useRef(null);
  const isAudioUnlockedRef = useRef(false);

  // Ses kilidini aç
  const unlockAudio = useCallback(() => {
    if (!isAudioUnlockedRef.current) {
      // Kullanıcı etkileşimi ile ses kilidini aç
      const dummyAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      dummyAudio.play().catch(() => {});
      isAudioUnlockedRef.current = true;
    }
  }, []);

  // Ses çal
  const playSound = useCallback((audioUrl) => {
    if (!audioUrl) return;

    try {
      // Önceki sesi durdur
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Yeni ses oluştur
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Ses ayarları
      audio.volume = 0.7;
      audio.loop = false;
      
      // Ses çalmayı dene
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Ses başarıyla çalındı');
          })
          .catch((error) => {
            console.warn('Ses çalınamadı:', error);
            // Kullanıcı etkileşimi gerekebilir
            unlockAudio();
          });
      }
    } catch (error) {
      console.error('Ses çalma hatası:', error);
    }
  }, [unlockAudio]);

  // Notification ile ses çal (daha güvenilir)
  const playNotificationSound = useCallback((audioUrl) => {
    // Önce normal ses çalmayı dene
    playSound(audioUrl);
    
    // Eğer sayfa arkaplandayken, notification ile de bildir
    if (document.hidden && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Pomofree', {
          body: 'Timer tamamlandı!',
          icon: '/logo192.png',
          tag: 'pomofree-timer'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Pomofree', {
              body: 'Timer tamamlandı!',
              icon: '/logo192.png',
              tag: 'pomofree-timer'
            });
          }
        });
      }
    }
  }, [playSound]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return {
    playSound,
    playNotificationSound,
    unlockAudio
  };
};

