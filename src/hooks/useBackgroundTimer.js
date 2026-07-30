import { useCallback, useEffect, useRef, useState } from 'react';
import { createTimerSnapshot, restoreTimerSnapshot } from '../focusModel';

const readStoredTimer = (storageKey, initialTime) => {
  try {
    return restoreTimerSnapshot(
      JSON.parse(localStorage.getItem(storageKey) || 'null'),
      new Date(),
      initialTime
    );
  } catch {
    return restoreTimerSnapshot(null, new Date(), initialTime);
  }
};

export const useBackgroundTimer = (
  initialTime,
  initialActive = false,
  storageKey = 'pomofree_active_session_v3'
) => {
  const [timer, setTimer] = useState(() => {
    const restored = readStoredTimer(storageKey, initialTime);
    return restored.time === initialTime && !restored.endsAt && initialActive
      ? createTimerSnapshot(initialTime, initialTime, true)
      : restored;
  });
  const timerRef = useRef(timer);

  const applyTimer = useCallback((next, persist = true) => {
    timerRef.current = next;
    setTimer(next);
    if (!persist) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // The timer still works in memory when storage is unavailable.
    }
  }, [storageKey]);

  const getRemaining = useCallback(current => {
    if (!current.isActive || !current.endsAt) return current.time;
    return Math.max(0, Math.ceil(
      (new Date(current.endsAt).getTime() - Date.now()) / 1000
    ));
  }, []);

  const toggleTimer = useCallback(() => {
    const current = timerRef.current;
    if (current.isActive) {
      applyTimer({
        ...current,
        time: getRemaining(current),
        isActive: false,
        endsAt: null,
        updatedAt: new Date().toISOString()
      });
      return;
    }

    const time = current.time > 0 ? current.time : current.totalTime;
    applyTimer(createTimerSnapshot(time, current.totalTime, true));
  }, [applyTimer, getRemaining]);

  const startTimer = useCallback(() => {
    const current = timerRef.current;
    if (current.isActive) return;
    const time = current.time > 0 ? current.time : current.totalTime;
    applyTimer(createTimerSnapshot(time, current.totalTime, true));
  }, [applyTimer]);

  const stopTimer = useCallback(() => {
    const current = timerRef.current;
    if (!current.isActive) return;
    applyTimer({
      ...current,
      time: getRemaining(current),
      isActive: false,
      endsAt: null,
      updatedAt: new Date().toISOString()
    });
  }, [applyTimer, getRemaining]);

  const resetTimer = useCallback(newTime => {
    const safeTime = Math.max(1, Math.min(24 * 60 * 60, Number(newTime) || initialTime));
    applyTimer(createTimerSnapshot(safeTime, safeTime, false));
  }, [applyTimer, initialTime]);

  useEffect(() => {
    if (!timer.isActive || !timer.endsAt) return undefined;

    const tick = () => {
      const current = timerRef.current;
      const time = getRemaining(current);
      if (time === current.time) return;
      if (time === 0) {
        applyTimer({
          ...current,
          time: 0,
          isActive: false,
          endsAt: null,
          updatedAt: new Date().toISOString()
        });
      } else {
        const next = { ...current, time };
        timerRef.current = next;
        setTimer(next);
      }
    };

    tick();
    const interval = window.setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [timer.isActive, timer.endsAt, applyTimer, getRemaining]);

  useEffect(() => {
    const syncTabs = event => {
      if (event.key !== storageKey || !event.newValue) return;
      try {
        applyTimer(
          restoreTimerSnapshot(JSON.parse(event.newValue), new Date(), initialTime),
          false
        );
      } catch {
        // Ignore malformed state written by an older app version.
      }
    };
    window.addEventListener('storage', syncTabs);
    return () => window.removeEventListener('storage', syncTabs);
  }, [storageKey, initialTime, applyTimer]);

  return {
    time: timer.time,
    totalTime: timer.totalTime,
    isTimerActive: timer.isActive,
    toggleTimer,
    startTimer,
    stopTimer,
    resetTimer,
    isFinished: timer.time === 0 && !timer.isActive
  };
};
