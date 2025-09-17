import React from 'react';
import { useWebRTC } from '../contexts/WebRTCContext';
import { useStudyRoom } from '../contexts/StudyRoomContext';
import { useTranslation } from '../hooks/useTranslation';
import './ParticipantAudioStatus.css';

const ParticipantAudioStatus = () => {
  const { t } = useTranslation();
  const { remoteStreams } = useWebRTC();
  const { roomParticipants } = useStudyRoom();

  const getParticipantAudioStatus = (participant) => {
    const hasAudio = remoteStreams.has(participant.uid);
    return {
      ...participant,
      hasAudio,
      isSpeaking: false // Bu özellik daha sonra audio level detection ile eklenebilir
    };
  };

  const participantsWithAudio = roomParticipants
    .map(getParticipantAudioStatus)
    .sort((a, b) => {
      // Audio enabled participants first
      if (a.hasAudio && !b.hasAudio) return -1;
      if (!a.hasAudio && b.hasAudio) return 1;
      return 0;
    });

  if (participantsWithAudio.length === 0) {
    return null;
  }

  return (
    <div className="participant-audio-status">
      <h3 className="participants-title">{t('audio.participants')}</h3>
      <div className="participants-list">
        {participantsWithAudio.map((participant) => (
          <div 
            key={participant.uid} 
            className={`participant-item ${participant.hasAudio ? 'has-audio' : 'no-audio'}`}
          >
            <div className="participant-info">
              <div className="participant-avatar">
                {participant.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="participant-name">{participant.displayName}</span>
            </div>
            <div className="participant-audio-indicator">
              {participant.hasAudio ? (
                <div className="audio-indicator">
                  <span className="audio-icon">🎤</span>
                  <div className="audio-level">
                    <div className="level-bar"></div>
                    <div className="level-bar"></div>
                    <div className="level-bar"></div>
                  </div>
                </div>
              ) : (
                <div className="no-audio-indicator">
                  <span className="no-audio-icon">🔇</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantAudioStatus;
