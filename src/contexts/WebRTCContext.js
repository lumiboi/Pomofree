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

const WebRTCContext = createContext();

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

export const WebRTCProvider = ({ children }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [peers, setPeers] = useState(new Map());
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  const { currentRoom, isInRoom } = useStudyRoom();
  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const signalingListenerRef = useRef(null);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
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
    peerConnectionsRef.current.forEach(peerConnection => {
      peerConnection.close();
    });
    peerConnectionsRef.current.clear();

    // Clear remote streams
    setRemoteStreams(new Map());
    setPeers(new Map());

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

            if (data.type === 'offer' && (!data.to || data.to === userId)) {
              await handleOffer(data);
            } else if (data.type === 'answer' && (!data.to || data.to === userId)) {
              await handleAnswer(data);
            } else if (data.type === 'ice-candidate' && (!data.to || data.to === userId)) {
              await handleIceCandidate(data);
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
      peerConnectionsRef.current.forEach(peerConnection => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();

      setRemoteStreams(new Map());
      setPeers(new Map());
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

  const createPeerConnection = async (userId) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnectionsRef.current.set(userId, peerConnection);

    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev.set(userId, remoteStream)));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({
          type: 'ice-candidate',
          to: userId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed') {
        setConnectionError('Bağlantı hatası oluştu');
      }
    };

    return peerConnection;
  };

  const sendSignalingMessage = async (message) => {
    if (!currentRoom || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'studyRooms', currentRoom.id, 'signaling'), {
        ...message,
        from: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  };

  const handleUserJoined = async (data) => {
    if (!localStream) return; // Only create offer if we have audio enabled

    const userId = data.userInfo.uid;
    if (userId === auth.currentUser.uid) return;

    console.log('👤 User joined, creating offer for:', userId);

    try {
      const peerConnection = await createPeerConnection(userId);
      
      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      await sendSignalingMessage({
        type: 'offer',
        to: userId,
        offer: offer
      });
      
      console.log('📤 Offer sent to:', userId);
    } catch (error) {
      console.error('Error handling user joined:', error);
    }
  };

  const handleUserLeft = async (data) => {
    const userId = data.from;
    
    // Close peer connection
    const peerConnection = peerConnectionsRef.current.get(userId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(userId);
    }

    // Remove remote stream
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });

    setPeers(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  };

  const handleOffer = async (data) => {
    const userId = data.from;
    
    console.log('📥 Received offer from:', userId);
    
    try {
      const peerConnection = await createPeerConnection(userId);
      
      await peerConnection.setRemoteDescription(data.offer);
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await sendSignalingMessage({
        type: 'answer',
        to: userId,
        answer: answer
      });
      
      console.log('📤 Answer sent to:', userId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (data) => {
    const userId = data.from;
    const peerConnection = peerConnectionsRef.current.get(userId);
    
    console.log('📥 Received answer from:', userId);
    
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(data.answer);
        console.log('✅ Answer processed for:', userId);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    } else {
      console.warn('No peer connection found for user:', userId);
    }
  };

  const handleIceCandidate = async (data) => {
    const userId = data.from;
    const peerConnection = peerConnectionsRef.current.get(userId);
    
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(data.candidate);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    }
  };

  const value = {
    isAudioEnabled,
    isMuted,
    localStream,
    remoteStreams,
    peers,
    isConnecting,
    connectionError,
    startAudio,
    stopAudio,
    toggleMute,
    localVideoRef
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};
