import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayRemove,
  getDocs,
  where,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const StudyRoomContext = createContext();

const bytesToHex = bytes => [...bytes]
  .map(byte => byte.toString(16).padStart(2, '0'))
  .join('');

const hashPassword = async (password, salt) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: encoder.encode(salt),
    iterations: 100000,
    hash: 'SHA-256'
  }, key, 256);
  return bytesToHex(new Uint8Array(bits));
};

export const useStudyRoom = () => {
  const context = useContext(StudyRoomContext);
  if (!context) {
    throw new Error('useStudyRoom must be used within a StudyRoomProvider');
  }
  return context;
};

export const StudyRoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomParticipants, setRoomParticipants] = useState([]);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [roomMessages, setRoomMessages] = useState([]);
  const [syncedTimer, setSyncedTimer] = useState(null);
  const [roomListener, setRoomListener] = useState(null);
  const [chatListener, setChatListener] = useState(null);

  // Cleanup listeners when component unmounts
  useEffect(() => {
    return () => {
      if (roomListener) roomListener();
      if (chatListener) chatListener();
    };
  }, [roomListener, chatListener]);

  const generateRoomId = () => {
    return uuidv4().substring(0, 8).toUpperCase();
  };

  const createRoom = async (roomConfig) => {
    if (!auth.currentUser) {
      throw new Error('Giriş yapmalısınız');
    }

    const roomId = generateRoomId();
    const currentUser = auth.currentUser;
    const roomType = roomConfig.roomType === 'anonymous' ? 'anonymous' : 'private';
    const passwordSalt = roomConfig.hasPassword
      ? bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
      : '';
    
    const roomData = {
      id: roomId,
      name: roomConfig.name,
      roomType,
      capacity: parseInt(roomConfig.capacity),
      hasPassword: roomConfig.hasPassword,
      passwordSalt,
      passwordHash: roomConfig.hasPassword
        ? await hashPassword(roomConfig.password, passwordSalt)
        : '',
      hideTaskDetails: roomConfig.hideTaskDetails !== false,
      breakChatOnly: roomConfig.breakChatOnly !== false,
      createdAt: new Date(),
      createdBy: currentUser.uid,
      participantIds: [currentUser.uid],
      participants: [{
        uid: currentUser.uid,
        displayName: roomType === 'anonymous'
          ? `Odak Arkadaşı ${currentUser.uid.slice(-4).toUpperCase()}`
          : currentUser.displayName || currentUser.email.split('@')[0],
        joinedAt: new Date(),
        isOnline: true,
        status: 'preparing'
      }],
      timer: {
        mode: 'pomodoro',
        timeLeft: 25 * 60,
        isActive: false,
        startedAt: null,
        lastUpdatedBy: currentUser.uid,
        lastUpdatedAt: new Date()
      }
    };

    try {
      // Try to create room in global studyRooms collection for cross-user access
      const globalRoomRef = doc(db, 'studyRooms', roomId);
      await setDoc(globalRoomRef, roomData);
      
      // Set up real-time listener for the room
      setupRoomListener(roomId, currentUser.uid);
      setupChatListener(roomId, currentUser.uid);
      
      setCurrentRoom(roomData);
      setIsInRoom(true);
      
      return roomId;
    } catch (error) {
      console.error('Error creating room in global collection, trying fallback:', error);
      
      // Fallback: Use localStorage for development
      try {
        const localRooms = JSON.parse(localStorage.getItem('studyRooms') || '{}');
        localRooms[roomId] = roomData;
        localStorage.setItem('studyRooms', JSON.stringify(localRooms));
        
        setCurrentRoom(roomData);
        setIsInRoom(true);
        
        return roomId;
      } catch (localError) {
        console.error('Fallback localStorage also failed:', localError);
        throw new Error('Oda Pomofree hesabında oluşturulamadı. Lütfen tekrar deneyin.');
      }
    }
  };

  // Helper function to check if room exists and get its data
  const checkRoomExists = async (roomId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      // Try Firebase first
      try {
        const globalRoomRef = doc(db, 'studyRooms', roomId);
        const globalRoomSnap = await getDoc(globalRoomRef);
        
        if (globalRoomSnap.exists()) {
          return globalRoomSnap.data();
        }
      } catch (fbError) {
        console.log('Firebase check failed, checking localStorage');
      }

      // Fallback: Check localStorage
      const localRooms = JSON.parse(localStorage.getItem('studyRooms') || '{}');
      if (localRooms[roomId]) {
        return localRooms[roomId];
      }

      return null;
    } catch (error) {
      console.error('Error checking room:', error);
      return null;
    }
  };

  const joinRoom = async (roomId, password = '') => {
    if (!auth.currentUser) {
      throw new Error('Giriş yapmalısınız');
    }

    try {
      const currentUser = auth.currentUser;
      let roomData = null;
      let roomFound = false;

      // Try to find room in any user's collection (search globally)
      try {
        // First check if room exists in current user's collection
        const userRoomRef = doc(db, 'users', currentUser.uid, 'studyRooms', roomId);
        const userRoomSnap = await getDoc(userRoomRef);
        
        if (userRoomSnap.exists()) {
          roomData = userRoomSnap.data();
          roomFound = true;
        } else {
          // Try to find room in global studyRooms collection
          const globalRoomRef = doc(db, 'studyRooms', roomId);
          const globalRoomSnap = await getDoc(globalRoomRef);
          
          if (globalRoomSnap.exists()) {
            roomData = globalRoomSnap.data();
            roomFound = true;
          }
        }
      } catch (fbError) {
        console.log('Firebase search failed, checking localStorage');
      }

      // Fallback: Check localStorage
      if (!roomFound) {
        const localRooms = JSON.parse(localStorage.getItem('studyRooms') || '{}');
        if (localRooms[roomId]) {
          roomData = localRooms[roomId];
          roomFound = true;
        }
      }

      if (!roomFound || !roomData) {
        throw new Error('Oda bulunamadı');
      }
      
      if (roomData.hasPassword) {
        const isLegacyPassword = !roomData.passwordHash || !roomData.passwordSalt;
        const matchesHash = isLegacyPassword
          ? roomData.password === password
          : await hashPassword(password, roomData.passwordSalt) === roomData.passwordHash;
        if (!matchesHash) throw new Error('Yanlış şifre');
        if (isLegacyPassword) {
          roomData.passwordSalt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
          roomData.passwordHash = await hashPassword(password, roomData.passwordSalt);
          delete roomData.password;
          try {
            await setDoc(doc(db, 'studyRooms', roomId), roomData);
          } catch {
            const localRooms = JSON.parse(localStorage.getItem('studyRooms') || '{}');
            localRooms[roomId] = roomData;
            localStorage.setItem('studyRooms', JSON.stringify(localRooms));
          }
        }
      }

      // Check if user is already in the room
      roomData.participantIds = Array.isArray(roomData.participantIds)
        ? roomData.participantIds
        : roomData.participants.map(participant => participant.uid);
      const isAlreadyParticipant = roomData.participants.some(p => p.uid === currentUser.uid);
      
      if (!isAlreadyParticipant) {
        if (roomData.participants.length >= roomData.capacity) {
          throw new Error('Oda dolu');
        }

        const newParticipant = {
          uid: currentUser.uid,
          displayName: roomData.roomType === 'anonymous'
            ? `Odak Arkadaşı ${currentUser.uid.slice(-4).toUpperCase()}`
            : currentUser.displayName || currentUser.email.split('@')[0],
          joinedAt: new Date(),
          isOnline: true,
          status: 'preparing'
        };

        // Add user to participants
        roomData.participants.push(newParticipant);
        roomData.participantIds.push(currentUser.uid);
        
        // Try to update room data
        try {
          // Try global studyRooms collection first
          const globalRoomRef = doc(db, 'studyRooms', roomId);
          await setDoc(globalRoomRef, roomData, { merge: true });
        } catch (fbError) {
          // Fallback to localStorage
          const localRooms = JSON.parse(localStorage.getItem('studyRooms') || '{}');
          localRooms[roomId] = roomData;
          localStorage.setItem('studyRooms', JSON.stringify(localRooms));
        }
      }

      // Set up real-time listeners
      setupRoomListener(roomId, currentUser.uid);
      setupChatListener(roomId, currentUser.uid);
      
      setCurrentRoom({ ...roomData, id: roomId });
      setIsInRoom(true);
      
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  };

  const findAnonymousRoom = async (defaultName = 'Open Focus') => {
    if (!auth.currentUser) throw new Error('Giriş yapmalısınız');
    const snapshot = await getDocs(query(
      collection(db, 'studyRooms'),
      where('roomType', '==', 'anonymous'),
      limit(10)
    ));
    const available = snapshot.docs.find(item => {
      const data = item.data();
      return data.roomType === 'anonymous' &&
        (data.participants?.length || 0) < Number(data.capacity || 4);
    });
    if (available) {
      await joinRoom(available.id);
      return available.id;
    }
    return createRoom({
      name: defaultName,
      capacity: 4,
      hasPassword: false,
      password: '',
      roomType: 'anonymous',
      hideTaskDetails: true,
      breakChatOnly: true
    });
  };

  const leaveRoom = async () => {
    if (!currentRoom || !auth.currentUser) return;

    try {
      const roomRef = doc(db, 'studyRooms', currentRoom.id);
      const currentUser = auth.currentUser;
      const participantToRemove = roomParticipants.find(p => p.uid === currentUser.uid);
      const messagesSnapshot = await getDocs(
        collection(db, 'studyRooms', currentRoom.id, 'messages')
      );
      const roomWillBeEmpty = roomParticipants.length <= 1;
      await Promise.all(messagesSnapshot.docs
        .filter(message => roomWillBeEmpty || message.data().senderUid === currentUser.uid)
        .map(message => deleteDoc(message.ref)));

      if (participantToRemove && !roomWillBeEmpty) {
        await updateDoc(roomRef, {
          participants: arrayRemove(participantToRemove),
          participantIds: arrayRemove(currentUser.uid)
        });
      }
      if (roomWillBeEmpty) await deleteDoc(roomRef);
      localStorage.removeItem(`chatMessages_${currentRoom.id}`);

      // Cleanup listeners
      if (roomListener) roomListener();
      if (chatListener) chatListener();
      
      setCurrentRoom(null);
      setIsInRoom(false);
      setRoomParticipants([]);
      setRoomMessages([]);
      setSyncedTimer(null);
      setRoomListener(null);
      setChatListener(null);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const sendMessage = async (message) => {
    if (!currentRoom || !auth.currentUser) return;
    if (currentRoom.breakChatOnly && syncedTimer?.mode === 'pomodoro' && syncedTimer?.isActive) {
      return;
    }

    try {
      const currentUser = auth.currentUser;
      const chatMessage = {
        id: uuidv4(),
        text: message,
        sender: currentUser.displayName || currentUser.email.split('@')[0],
        senderUid: currentUser.uid,
        timestamp: new Date()
      };

      try {
        // Try Firebase first - use global studyRooms collection
        await addDoc(collection(db, 'studyRooms', currentRoom.id, 'messages'), chatMessage);
      } catch (fbError) {
        // Fallback to localStorage
        const localMessages = JSON.parse(localStorage.getItem(`chatMessages_${currentRoom.id}`) || '[]');
        localMessages.push(chatMessage);
        localStorage.setItem(`chatMessages_${currentRoom.id}`, JSON.stringify(localMessages));
        setRoomMessages(localMessages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const syncTimer = async (timerState) => {
    if (!currentRoom || !auth.currentUser) return;

    try {
      const currentUser = auth.currentUser;
      const updatedTimer = {
        ...timerState,
        endsAt: timerState.isActive
          ? new Date(Date.now() + Math.max(0, Number(timerState.timeLeft) || 0) * 1000).toISOString()
          : null,
        lastUpdatedBy: currentUser.uid,
        lastUpdatedAt: serverTimestamp(),
        syncTimestamp: Date.now() // Add precise timestamp for sync
      };
      const participantStatus = timerState.isActive
        ? timerState.mode === 'pomodoro' ? 'focusing' : 'break'
        : 'paused';
      const participants = roomParticipants.map(participant => (
        participant.uid === currentUser.uid
          ? { ...participant, status: participantStatus, isOnline: true }
          : participant
      ));

      // DO NOT update local state here - let Firebase listener handle it
      // This prevents sync loops and ensures single source of truth

      try {
        // Try Firebase first - use global studyRooms collection
        const roomRef = doc(db, 'studyRooms', currentRoom.id);
        await updateDoc(roomRef, { timer: updatedTimer, participants });
      } catch (fbError) {
        // Fallback to localStorage
        const localRooms = JSON.parse(localStorage.getItem('studyRooms') || '{}');
        if (localRooms[currentRoom.id]) {
          localRooms[currentRoom.id].timer = {
            ...updatedTimer,
            lastUpdatedAt: new Date(),
            syncTimestamp: Date.now()
          };
          localRooms[currentRoom.id].participants = participants;
          localStorage.setItem('studyRooms', JSON.stringify(localRooms));
          
          // Only update local state for localStorage fallback
          setSyncedTimer(updatedTimer);
        }
      }
    } catch (error) {
      console.error('Error syncing timer:', error);
    }
  };

  const setupRoomListener = (roomId, userId) => {
    try {
      // Listen to global studyRooms collection for cross-user access
      const roomRef = doc(db, 'studyRooms', roomId);
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const roomData = doc.data();
          setCurrentRoom({ ...roomData, id: roomId });
          setRoomParticipants(roomData.participants || []);
          
          // FORCE update timer from Firebase - no conditions
          if (roomData.timer) {
            setSyncedTimer({...roomData.timer, forceUpdate: Date.now()});
          }
        }
      });
      setRoomListener(() => unsubscribe);
    } catch (error) {
      console.log('Firebase listener failed, using localStorage polling');
      // Fallback: Poll localStorage for changes
      const pollInterval = setInterval(() => {
        const localRooms = JSON.parse(localStorage.getItem('studyRooms') || '{}');
        if (localRooms[roomId]) {
          const roomData = localRooms[roomId];
          setCurrentRoom({ ...roomData, id: roomId });
          setRoomParticipants(roomData.participants || []);
          
          // FORCE update timer from localStorage - no conditions
          if (roomData.timer) {
            setSyncedTimer({...roomData.timer, forceUpdate: Date.now()});
          }
        }
      }, 1000); // Reduced to 1 second for better sync
      
      setRoomListener(() => clearInterval(pollInterval));
    }
  };

  const setupChatListener = (roomId, userId) => {
    try {
      // Listen to global studyRooms messages for cross-user access
      const messagesRef = collection(db, 'studyRooms', roomId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        });
        setRoomMessages(messages);
      });
      setChatListener(() => unsubscribe);
    } catch (error) {
      console.log('Firebase chat listener failed, using localStorage');
      // Fallback: Use localStorage for messages
      const localMessages = JSON.parse(localStorage.getItem(`chatMessages_${roomId}`) || '[]');
      setRoomMessages(localMessages);
    }
  };

  const toggleRoomMinimized = () => {
    setIsRoomMinimized(!isRoomMinimized);
  };

  const value = {
    currentRoom,
    isInRoom,
    roomParticipants,
    isRoomMinimized,
    roomMessages,
    syncedTimer,
    generateRoomId,
    createRoom,
    joinRoom,
    findAnonymousRoom,
    checkRoomExists,
    leaveRoom,
    sendMessage,
    syncTimer,
    setupRoomListener,
    setupChatListener,
    toggleRoomMinimized
  };

  return (
    <StudyRoomContext.Provider value={value}>
      {children}
    </StudyRoomContext.Provider>
  );
};
