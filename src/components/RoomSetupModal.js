import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './RoomSetupModal.css';

const RoomSetupModal = ({ closeModal, onCreateRoom, onJoinRoom }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('create');
  const [roomName, setRoomName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError(t('studyRoom.enterRoomName'));
      return;
    }

    if (hasPassword && !password.trim()) {
      setError(t('studyRoom.enterPassword'));
      return;
    }

    const roomConfig = {
      name: roomName.trim(),
      capacity: parseInt(capacity),
      hasPassword,
      password: hasPassword ? password.trim() : ''
    };

    try {
      setError('');
      const roomId = await onCreateRoom(roomConfig);
      closeModal();
      // Show room ID to user
      alert(`${t('studyRoom.roomCreated')}\n${t('studyRoom.roomId')}: ${roomId}\n${t('studyRoom.shareLink')}: ${window.location.origin}/room/${roomId}`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      setError(t('studyRoom.enterRoomId'));
      return;
    }

    try {
      setError('');
      await onJoinRoom(joinRoomId.trim().toUpperCase(), joinPassword.trim());
      closeModal();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      if (action === 'create') {
        handleCreateRoom();
      } else {
        handleJoinRoom();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="room-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('studyRoom.studyWithMe')}</h2>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>

        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {setActiveTab('create'); setError('');}}
          >
            {t('studyRoom.createRoom')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => {setActiveTab('join'); setError('');}}
          >
            {t('studyRoom.joinRoom')}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'create' && (
          <div className="tab-content">
            <div className="form-group">
              <label>{t('studyRoom.roomName')}</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'create')}
                placeholder={t('studyRoom.roomNamePlaceholder')}
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label>{t('studyRoom.capacity')}</label>
              <select 
                value={capacity} 
                onChange={(e) => setCapacity(e.target.value)}
              >
                <option value={2}>2 {t('studyRoom.people')}</option>
                <option value={4}>4 {t('studyRoom.people')}</option>
                <option value={6}>6 {t('studyRoom.people')}</option>
                <option value={8}>8 {t('studyRoom.people')}</option>
                <option value={10}>10 {t('studyRoom.people')}</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasPassword}
                  onChange={(e) => setHasPassword(e.target.checked)}
                />
                <span className="checkmark"></span>
                {t('studyRoom.passwordProtected')}
              </label>
            </div>

            {hasPassword && (
              <div className="form-group">
                <label>{t('studyRoom.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'create')}
                  placeholder={t('studyRoom.passwordPlaceholder')}
                  maxLength={20}
                />
              </div>
            )}

            <button className="btn btn-primary create-btn" onClick={handleCreateRoom}>
              {t('studyRoom.createRoom')}
            </button>
          </div>
        )}

        {activeTab === 'join' && (
          <div className="tab-content">
            <div className="form-group">
              <label>{t('studyRoom.roomId')}</label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                onKeyPress={(e) => handleKeyPress(e, 'join')}
                placeholder={t('studyRoom.roomIdPlaceholder')}
                maxLength={8}
                style={{textTransform: 'uppercase'}}
              />
            </div>

            <div className="form-group">
              <label>{t('studyRoom.password')} ({t('studyRoom.optional')})</label>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'join')}
                placeholder={t('studyRoom.passwordPlaceholder')}
                maxLength={20}
              />
            </div>

            <button className="btn btn-primary join-btn" onClick={handleJoinRoom}>
              {t('studyRoom.joinRoom')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSetupModal;
