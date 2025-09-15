import { useState, useEffect, useRef, useCallback } from 'react';

export const useBackgroundTimer = (initialTime, isActive) => {
  const [time, setTime] = useState(initialTime);
  const [isTimerActive, setIsTimerActive] = useState(isActive);
  
  const intervalRef = useRef(null);

  // Timer'ı başlat/durdur
  const toggleTimer = useCallback(() => {
    setIsTimerActive(prev => !prev);
  }, []);

  // Timer'ı sıfırla
  const resetTimer = useCallback((newTime) => {
    setTime(newTime);
    setIsTimerActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Ana timer effect'i
  useEffect(() => {
    if (isTimerActive) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 1) {
            setIsTimerActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTimerActive]);

  return {
    time,
    isTimerActive,
    toggleTimer,
    resetTimer,
    isFinished: time === 0 && !isTimerActive
  };
};