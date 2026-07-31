import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './FocusSoundMixer.css';

const SOUND_TYPES = [
  ['rain', 'focusSound.rain', 'highpass'],
  ['cafe', 'focusSound.cafe', 'bandpass'],
  ['keyboard', 'focusSound.keyboard', 'highpass'],
  ['train', 'focusSound.train', 'lowpass'],
  ['brown', 'focusSound.brown', 'lowpass'],
  ['white', 'focusSound.white', 'allpass'],
  ['fire', 'focusSound.fire', 'lowpass'],
  ['nature', 'focusSound.nature', 'bandpass']
];
const STORAGE_KEY = 'pomofree_sound_profiles_v1';
const SAMPLE_URLS = {
  rain: `${process.env.PUBLIC_URL}/sounds/gentle-rain.mp3`,
  keyboard: `${process.env.PUBLIC_URL}/sounds/chill-keyboard.mp3`
};
const EMPTY_LEVELS = {
  rain: 0,
  cafe: 0,
  keyboard: 0,
  train: 0,
  brown: 0,
  white: 0,
  fire: 0,
  nature: 0
};

const readProfile = projectId => {
  try {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...EMPTY_LEVELS, ...(profiles[projectId || 'general'] || {}) };
  } catch {
    return EMPTY_LEVELS;
  }
};

const FocusSoundMixer = ({ isOpen, onClose, projectId, isFocusActive }) => {
  const { t } = useTranslation();
  const [levels, setLevels] = useState(() => readProfile(projectId));
  const audioRef = useRef({ context: null, master: null, gains: {}, samples: {} });

  useEffect(() => setLevels(readProfile(projectId)), [projectId]);

  const ensureSample = id => {
    if (!audioRef.current.samples[id]) {
      const sample = new Audio(SAMPLE_URLS[id]);
      sample.loop = true;
      sample.preload = 'auto';
      audioRef.current.samples[id] = sample;
    }
    return audioRef.current.samples[id];
  };

  const ensureAudio = () => {
    if (audioRef.current.context) {
      audioRef.current.context.resume();
      return audioRef.current;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = isFocusActive ? 1 : 0.25;
    master.connect(context.destination);
    const gains = {};

    SOUND_TYPES.forEach(([id, , filterType], soundIndex) => {
      if (SAMPLE_URLS[id]) return;
      const length = context.sampleRate * 3;
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      let brown = 0;
      for (let index = 0; index < length; index += 1) {
        const white = Math.random() * 2 - 1;
        brown = (brown + 0.02 * white) / 1.02;
        if (id === 'keyboard') {
          data[index] = Math.random() > 0.992 ? white * 0.8 : 0;
        } else if (['brown', 'fire', 'cafe', 'train'].includes(id)) {
          const pulse = id === 'train' ? 0.45 + Math.sin(index / 1700) * 0.3 : 1;
          data[index] = brown * 3.2 * pulse;
        } else if (id === 'nature') {
          data[index] = brown * 1.6 + white * 0.08;
        } else {
          data[index] = white * 0.35;
        }
      }

      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      filter.type = filterType;
      filter.frequency.value = id === 'fire' ? 420 : 650 + soundIndex * 230;
      gain.gain.value = 0;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start();
      gains[id] = gain;
    });

    audioRef.current = { ...audioRef.current, context, master, gains };
    return audioRef.current;
  };

  useEffect(() => {
    const audio = audioRef.current;
    Object.entries(audio.samples).forEach(([id, sample]) => {
      sample.volume = (levels[id] / 100) * (isFocusActive ? 1 : 0.25);
    });
    if (audio.context && audio.master) {
      const now = audio.context.currentTime;
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.linearRampToValueAtTime(isFocusActive ? 1 : 0.25, now + 1.2);
    }
  }, [isFocusActive, levels]);

  useEffect(() => () => {
    audioRef.current.context?.close();
    Object.values(audioRef.current.samples).forEach(sample => sample.pause());
  }, []);

  const setLevel = (id, value) => {
    const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
    const next = { ...levels, [id]: safeValue };
    setLevels(next);
    if (SAMPLE_URLS[id]) {
      const sample = ensureSample(id);
      sample.volume = (safeValue / 100) * (isFocusActive ? 1 : 0.25);
      if (safeValue > 0) {
        sample.play().catch(() => {});
      } else {
        sample.pause();
      }
    } else {
      const audio = ensureAudio();
      if (audio?.gains[id]) {
        audio.gains[id].gain.setTargetAtTime(safeValue / 100, audio.context.currentTime, 0.04);
      }
    }
    try {
      const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      profiles[projectId || 'general'] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // The mixer still works without profile persistence.
    }
  };

  const muteAll = () => {
    const next = { ...EMPTY_LEVELS };
    setLevels(next);
    const audio = audioRef.current;
    Object.values(audio.samples).forEach(sample => {
      sample.volume = 0;
      sample.pause();
    });
    Object.values(audio.gains).forEach(gain => {
      gain.gain.setTargetAtTime(0, audio.context.currentTime, 0.04);
    });
    try {
      const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      profiles[projectId || 'general'] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // The mixer still works without profile persistence.
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="focus-sound-mixer" aria-label={t('focusSound.title')}>
      <header>
        <div>
          <strong>{t('focusSound.title')}</strong>
          <small>{t('focusSound.projectProfile')}</small>
        </div>
        <button type="button" onClick={onClose} aria-label={t('general.close')}>×</button>
      </header>
      <div className="focus-sound-list">
        {SOUND_TYPES.map(([id, label]) => (
          <label key={id}>
            <span>{t(label)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={levels[id]}
              onChange={event => setLevel(id, event.target.value)}
            />
            <output>{levels[id]}%</output>
          </label>
        ))}
      </div>
      <footer>
        <span>{isFocusActive ? t('focusSound.focusLevel') : t('focusSound.breakLevel')}</span>
        <button type="button" onClick={muteAll}>
          {t('focusSound.muteAll')}
        </button>
      </footer>
    </aside>
  );
};

export default FocusSoundMixer;
