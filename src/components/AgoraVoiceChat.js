import React, { useState } from 'react';
import { useStudyRoom } from '../contexts/StudyRoomContext';
import './AgoraVoiceChat.css';

const AgoraVoiceChat = () => {
  const { currentRoom } = useStudyRoom();
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  // App Builder URL'si
  const appBuilderUrl = 'https://b4c0c6f5c511936fee17.vercel.app/create';
  
  // Agora channel ID'sini oda ID'si ile eşleştir
  const channelId = currentRoom ? `pomofree-${currentRoom.id}` : 'pomofree-test';
  
  // Oda ID'sini URL'ye ekle - farklı parametreleri test edelim
  const voiceChatUrl = currentRoom 
    ? `${appBuilderUrl}?channelId=${channelId}&roomId=${currentRoom.id}&roomName=${encodeURIComponent(currentRoom.name)}&channel=${channelId}`
    : `${appBuilderUrl}?channelId=${channelId}&channel=${channelId}`;


  if (isVoiceChatOpen) {
    return (
      <div className="agora-voice-chat">
        <div className="voice-chat-header">
          <h3>🎤 Agora Sesli Sohbet</h3>
          <div className="status-indicator">
            <span className="connected">✅ Bağlı</span>
          </div>
          <button 
            className="close-btn"
            onClick={() => setIsVoiceChatOpen(false)}
            title="Sesli sohbeti kapat"
          >
            ✕
          </button>
        </div>
        
        <div className="agora-container">
          <iframe
            src={voiceChatUrl}
            width="100%"
            height="400px"
            frameBorder="0"
            allow="microphone; camera; autoplay"
            title="Agora Voice Chat"
            className="agora-iframe"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="agora-voice-chat">
      <div className="voice-chat-header">
        <h3>🎤 Sesli Sohbet</h3>
        <div className="status-indicator">
          <span className="disconnected">❌ Kapalı</span>
        </div>
      </div>


      <div className="voice-chat-tutorial">
        <div className="tutorial-step">
          <span className="step-number">1</span>
          <span className="step-text">Agora'da oda kur</span>
        </div>
        <div className="tutorial-step">
          <span className="step-number">2</span>
          <span className="step-text">Linkin sonundaki ID'yi kopyala</span>
        </div>
        <div className="tutorial-step">
          <span className="step-number">3</span>
          <span className="step-text">ID'yi arkadaşına gönder</span>
        </div>
        <div className="tutorial-step">
          <span className="step-number">4</span>
          <span className="step-text">Aynı ID ile katılsın</span>
        </div>
      </div>

      <div className="voice-chat-controls">
        <button
          className="audio-toggle-btn"
          onClick={() => setIsVoiceChatOpen(true)}
        >
          🎤 Sesi Aç
        </button>
        <div className="voice-chat-info">
          <p>⚠️ Agora ID'niz bu odanın ID'sinden farklıdır</p>
          <p>📋 Linkin sonundaki ID'yi kopyalayın</p>
          <p>📱 ID'yi arkadaşlarınıza gönderin</p>
        </div>
      </div>
    </div>
  );
};

export default AgoraVoiceChat;
