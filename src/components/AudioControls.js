import React from 'react';
import { useWebRTC } from '../contexts/WebRTCContext';
import { useTranslation } from '../hooks/useTranslation';
import './AudioControls.css';

const AudioControls = () => {
  const { t } = useTranslation();
  const {
    isAudioEnabled,
    isMuted,
    isConnecting,
    connectionError,
    startAudio,
    stopAudio,
    toggleMute
  } = useWebRTC();

  const handleAudioToggle = async () => {
    try {
      if (isAudioEnabled) {
        await stopAudio();
      } else {
        await startAudio();
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  };

  const handleMuteToggle = () => {
    toggleMute();
  };

  if (connectionError) {
    return (
      <div className="audio-controls error">
        <div className="audio-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{t('audio.error')}</span>
        </div>
        <button 
          className="audio-retry-btn"
          onClick={handleAudioToggle}
        >
          {t('audio.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="audio-controls">
      <div className="audio-status">
        {isConnecting ? (
          <div className="connecting">
            <div className="spinner"></div>
            <span>{t('audio.connecting')}</span>
          </div>
        ) : isAudioEnabled ? (
          <div className="connected">
            <span className="status-icon">🎤</span>
            <span>{t('audio.connected')}</span>
          </div>
        ) : (
          <div className="disconnected">
            <span className="status-icon">🔇</span>
            <span>{t('audio.disconnected')}</span>
          </div>
        )}
      </div>

      <div className="audio-buttons">
        <button
          className={`audio-toggle-btn ${isAudioEnabled ? 'enabled' : 'disabled'}`}
          onClick={handleAudioToggle}
          disabled={isConnecting}
        >
          {isAudioEnabled ? t('audio.stopAudio') : t('audio.startAudio')}
        </button>

        {isAudioEnabled && (
          <button
            className={`mute-btn ${isMuted ? 'muted' : 'unmuted'}`}
            onClick={handleMuteToggle}
            title={isMuted ? t('audio.unmute') : t('audio.mute')}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioControls;
