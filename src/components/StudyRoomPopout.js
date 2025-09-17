import React, { useState, useRef, useEffect } from 'react';
import { useStudyRoom } from '../contexts/StudyRoomContext';
import { useTranslation } from '../hooks/useTranslation';
import AgoraVoiceChat from './AgoraVoiceChat';
import './StudyRoomPopout.css';

const StudyRoomPopout = ({ syncedTimer, onTimerSync }) => {
  const { t } = useTranslation();
  const {
    currentRoom,
    isInRoom,
    roomParticipants,
    isRoomMinimized,
    roomMessages,
    leaveRoom,
    sendMessage,
    toggleRoomMinimized
  } = useStudyRoom();
  
  // Jitsi Voice Chat kullanıyoruz, WebRTC gerekmiyor

  const [message, setMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Jitsi Voice Chat kullanıyoruz, device detection gerekmiyor

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  // Jitsi Voice Chat kullanıyoruz, WebRTC gerekmiyor

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Jitsi Voice Chat kullanıyoruz, voice detection gerekmiyor

  // Jitsi Voice Chat kullanıyoruz, mikrofon kontrolü gerekmiyor

  // Jitsi Voice Chat kullanıyoruz, kamera kontrolü gerekmiyor

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  const handleCopyRoomLink = async () => {
    try {
      const roomLink = `${window.location.origin}/room/${currentRoom.id}`;
      await navigator.clipboard.writeText(roomLink);
      alert(`Oda linki kopyalandı!\n\n${roomLink}\n\nBu linki arkadaşlarına gönder ki sesli sohbete katılabilsinler!`);
    } catch (error) {
      console.error('Failed to copy room link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `${window.location.origin}/room/${currentRoom.id}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`Oda linki kopyalandı!\n\n${window.location.origin}/room/${currentRoom.id}\n\nBu linki arkadaşlarına gönder ki sesli sohbete katılabilsinler!`);
    }
  };


  if (!isInRoom || !currentRoom) return null;

  return (
    <div className={`study-room-popout ${isRoomMinimized ? 'minimized' : ''}`}>
      <div className="popout-header">
        <div className="room-info">
          <h3>{currentRoom.name}</h3>
          <span className="participant-count">
            {roomParticipants.length}/{currentRoom.capacity}
          </span>
        </div>
        <div className="header-controls">
          <button 
            className="control-btn copy-link-btn"
            onClick={handleCopyRoomLink}
            title="Oda linkini kopyala - Arkadaşların sesli sohbete katılsın!"
          >
            📤
          </button>
          <button 
            className="control-btn settings-btn"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title={t('studyRoom.settings')}
          >
            ⚙️
          </button>
          <button 
            className="control-btn minimize-btn"
            onClick={toggleRoomMinimized}
            title={isRoomMinimized ? t('studyRoom.maximize') : t('studyRoom.minimize')}
          >
            {isRoomMinimized ? '🔼' : '🔽'}
          </button>
          <button 
            className="control-btn close-btn"
            onClick={handleLeaveRoom}
            title={t('studyRoom.leaveRoom')}
          >
            ✕
          </button>
        </div>
      </div>

      {!isRoomMinimized && (
        <div className="popout-content">
          {/* Voice Chat */}
          <AgoraVoiceChat />

          {/* Participants List */}
          <div className="participants-section">
            <h4>{t('room.participants')}</h4>
            <div className="participants-list">
              {roomParticipants.map((participant) => (
                <div 
                  key={participant.uid} 
                  className="participant-item"
                >
                  <div className="participant-avatar">
                    {participant.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="participant-name">
                    {participant.displayName || 'Anonim'}
                  </span>
                </div>
              ))}
            </div>
          </div>



          {/* Jitsi Voice Chat kullanıyoruz, settings gerekmiyor */}

          {/* Chat */}
          <div className="chat-container">
            <div className="chat-messages">
              {roomMessages.map((msg) => (
                <div key={msg.id} className="chat-message">
                  <span className="message-sender">{msg.sender}:</span>
                  <span className="message-text">{msg.text}</span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('studyRoom.typeMessage')}
                maxLength={200}
              />
              <button onClick={handleSendMessage} disabled={!message.trim()}>
                📤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyRoomPopout;
