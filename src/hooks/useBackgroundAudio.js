import { useCallback, useEffect, useRef } from 'react';

export const useBackgroundAudio = () => {
  const audioRef = useRef(null);
  const stopTimerRef = useRef(null);
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
  const playSound = useCallback((audioUrl, maxDurationMs = 2500) => {
    if (!audioUrl) return;

    try {
      // Önceki sesi durdur
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);

      // Yeni ses oluştur
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Ses ayarları
      audio.volume = 0.7;
      audio.loop = false;
      
      // Ses çalmayı dene
      const playPromise = audio.play();
      stopTimerRef.current = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, maxDurationMs);
      
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

  const showDesktopNotification = useCallback((body, tag = 'pomofree-timer') => {
    if (
      !document.hidden ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => registration.showNotification('Pomofree', {
          body,
          icon: '/logo192.png',
          tag
        }))
        .catch(() => {});
      return;
    }
    new Notification('Pomofree', { body, icon: '/logo192.png', tag });
  }, []);

  const playNotificationSound = useCallback((
    audioUrl,
    maxDurationMs = 2500,
    body = 'Pomofree timer completed.'
  ) => {
    playSound(audioUrl, maxDurationMs);
    showDesktopNotification(body);
  }, [playSound, showDesktopNotification]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  return {
    playSound,
    playNotificationSound,
    showDesktopNotification,
    unlockAudio
  };
};

