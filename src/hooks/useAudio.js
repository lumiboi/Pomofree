import { useState, useEffect, useCallback } from 'react';

// Bu "hook", ses çalma işlemini yönetir.
export const useAudio = (url) => {
  const [audioContext, setAudioContext] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Ses dosyasını indir ve Web Audio API için hazırla
  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
      .then(decodedAudio => setAudioBuffer(decodedAudio))
      .catch(error => console.error("Audio loading error:", error));

    return () => context.close();
  }, [url]);

  // Tarayıcının ses kilidini açan fonksiyon
  const unlockAudio = useCallback(() => {
    if (audioContext && audioContext.state === 'suspended' && !isUnlocked) {
      audioContext.resume().then(() => {
        setIsUnlocked(true);
      });
    }
  }, [audioContext, isUnlocked]);

  // Sesi çalan fonksiyon
  const play = useCallback(() => {
    if (audioBuffer && audioContext && audioContext.state === 'running') {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  }, [audioBuffer, audioContext]);

  return [play, unlockAudio];
};