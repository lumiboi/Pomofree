import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useStudyRoom } from './StudyRoomContext';
import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import SimplePeer from 'simple-peer';

const SimplePeerContext = createContext();

export const useSimplePeer = () => {
  const context = useContext(SimplePeerContext);
  if (!context) {
    throw new Error('useSimplePeer must be used within a SimplePeerProvider');
  }
  return context;
};

export const SimplePeerProvider = ({ children }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  const { currentRoom, isInRoom, roomParticipants } = useStudyRoom();
  const peersRef = useRef(new Map());
  const signalingListenerRef = useRef(null);
  const localVideoRef = useRef(null);

  // STUN servers for WebRTC
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Setup signaling when room changes
  useEffect(() => {
    if (isInRoom && currentRoom) {
      setupSignaling();
    } else {
      cleanup();
    }
  }, [isInRoom, currentRoom]);

  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close all peer connections
    peersRef.current.forEach(peer => {
      peer.destroy();
    });
    peersRef.current.clear();

    // Clear remote streams
    setRemoteStreams(new Map());

    // Stop signaling listener
    if (signalingListenerRef.current) {
      signalingListenerRef.current();
      signalingListenerRef.current = null;
    }

    setIsAudioEnabled(false);
    setIsMuted(false);
    setIsConnecting(false);
    setConnectionError(null);
  }, [localStream]);

  const setupSignaling = useCallback(() => {
    if (!currentRoom || !auth.currentUser) return;

    const roomId = currentRoom.id;
    const userId = auth.currentUser.uid;
    
    // Listen for signaling messages
    const signalingRef = collection(db, 'studyRooms', roomId, 'signaling');
    const unsubscribe = onSnapshot(signalingRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          
          // Ignore our own messages
          if (data.from === userId) return;

          console.log('📨 Received signaling message:', data.type, 'from:', data.from);

          if (data.type === 'signal') {
            await handleSignal(data);
          } else if (data.type === 'user-joined') {
            await handleUserJoined(data);
          } else if (data.type === 'user-left') {
            await handleUserLeft(data);
          }
        }
      });
    });

    signalingListenerRef.current = unsubscribe;

    // Announce user joined
    announceUserJoined();
  }, [currentRoom, auth.currentUser]);

  const announceUserJoined = async () => {
    if (!currentRoom || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'studyRooms', currentRoom.id, 'signaling'), {
        type: 'user-joined',
        from: auth.currentUser.uid,
        userInfo: {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0]
        },
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error announcing user joined:', error);
    }
  };

  const announceUserLeft = async () => {
    if (!currentRoom || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'studyRooms', currentRoom.id, 'signaling'), {
        type: 'user-left',
        from: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error announcing user left:', error);
    }
  };

  const startAudio = async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      setLocalStream(stream);
      setIsAudioEnabled(true);
      setIsConnecting(false);

      // Notify other users that we joined
      await announceUserJoined();

      return stream;
    } catch (error) {
      console.error('Error starting audio:', error);
      setConnectionError('Mikrofon erişimi reddedildi veya mevcut değil');
      setIsConnecting(false);
      throw error;
    }
  };

  const stopAudio = async () => {
    try {
      // Announce user left
      await announceUserLeft();

      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      // Close all peer connections
      peersRef.current.forEach(peer => {
        peer.destroy();
      });
      peersRef.current.clear();

      setRemoteStreams(new Map());
      setIsAudioEnabled(false);
      setIsMuted(false);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const sendSignal = async (signal, to) => {
    if (!currentRoom || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'studyRooms', currentRoom.id, 'signaling'), {
        type: 'signal',
        from: auth.currentUser.uid,
        to: to,
        signal: signal,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  };

  const createPeer = (userId, initiator = false) => {
    const peer = new SimplePeer({
      initiator: initiator,
      stream: localStream,
      config: rtcConfig
    });

    peer.on('signal', (signal) => {
      console.log('📤 Sending signal to:', userId);
      sendSignal(signal, userId);
    });

    peer.on('stream', (stream) => {
      console.log('🎵 Received stream from:', userId);
      setRemoteStreams(prev => new Map(prev.set(userId, stream)));
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
      setConnectionError('Bağlantı hatası oluştu');
    });

    peer.on('close', () => {
      console.log('🔌 Peer connection closed:', userId);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    });

    return peer;
  };

  const handleUserJoined = async (data) => {
    if (!localStream) return; // Only create peer if we have audio enabled

    const userId = data.userInfo.uid;
    if (userId === auth.currentUser.uid) return;

    console.log('👤 User joined, creating peer for:', userId);

    try {
      const peer = createPeer(userId, true);
      peersRef.current.set(userId, peer);
    } catch (error) {
      console.error('Error handling user joined:', error);
    }
  };

  const handleUserLeft = async (data) => {
    const userId = data.from;
    
    // Close peer connection
    const peer = peersRef.current.get(userId);
    if (peer) {
      peer.destroy();
      peersRef.current.delete(userId);
    }

    // Remove remote stream
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  };

  const handleSignal = async (data) => {
    const userId = data.from;
    
    console.log('📥 Received signal from:', userId);
    
    try {
      let peer = peersRef.current.get(userId);
      
      if (!peer) {
        // Create new peer if it doesn't exist
        peer = createPeer(userId, false);
        peersRef.current.set(userId, peer);
      }
      
      // Send the signal to the peer
      peer.signal(data.signal);
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  };

  const value = {
    isAudioEnabled,
    isMuted,
    localStream,
    remoteStreams,
    isConnecting,
    connectionError,
    startAudio,
    stopAudio,
    toggleMute,
    localVideoRef
  };

  return (
    <SimplePeerContext.Provider value={value}>
      {children}
    </SimplePeerContext.Provider>
  );
};

