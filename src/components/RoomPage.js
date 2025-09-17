import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudyRoom } from '../contexts/StudyRoomContext';
import { useTranslation } from '../hooks/useTranslation';
import { useBackgroundTimer } from '../hooks/useBackgroundTimer';
import { useBackgroundAudio } from '../hooks/useBackgroundAudio';
import { useAchievements } from '../hooks/useAchievements';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  collection, 
  updateDoc, 
  increment,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import StudyRoomPopout from './StudyRoomPopout';
import RoomTimer from './RoomTimer';
import Header from './Header';
import Tasks from './Tasks';
import WeeklyStats from './WeeklyStats';
import Celebration from './Celebration';
import AchievementNotification from './AchievementNotification';
import './RoomPage.css';

function RoomPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { playNotificationSound, unlockAudio } = useBackgroundAudio();
    const { 
        currentRoom, 
        isInRoom, 
        joinRoom, 
        checkRoomExists,
        leaveRoom,
        syncedTimer,
        syncTimer 
    } = useStudyRoom();

    // Main app state (copied from App.js)
    const [user, setUser] = useState(null);
    const [userSettings, setUserSettings] = useState({ pomodoro: 25, short: 5, long: 15 });
    const [mode, setMode] = useState('pomodoro');
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [taskInput, setTaskInput] = useState('');
    const [stats, setStats] = useState({ completedPomodoros: 0 });
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [activeTheme, setActiveTheme] = useState('default');
    const [showCelebration, setShowCelebration] = useState(false);
    const [weeklyFocusTime, setWeeklyFocusTime] = useState(0);
    const [activeModal, setActiveModal] = useState(null);

    // Initial time helper function
    const getInitialTime = (mode) => {
        switch (mode) {
            case 'pomodoro': return 25 * 60;
            case 'short': return 5 * 60;
            case 'long': return 15 * 60;
            default: return 25 * 60;
        }
    };

    // Timer hook'unu kullan
    const { 
        time, 
        isTimerActive, 
        toggleTimer: toggleTimerHook, 
        startTimer,
        stopTimer,
        resetTimer, 
        isFinished 
    } = useBackgroundTimer(getInitialTime(mode), false);

    // Achievement sistemi
    const { newAchievements } = useAchievements(user, stats, weeklyFocusTime);
    const [showNewAchievements, setShowNewAchievements] = useState([]);

    // Celebration handler'ı useCallback ile optimize et
    const handleCelebrationComplete = useCallback(() => {
        setShowCelebration(false);
    }, []);

    // Auth state listener
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchUserData(currentUser.uid);
            } else {
                // Redirect to home if not authenticated
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Room joining logic - only after auth is confirmed
    useEffect(() => {
        const tryJoinRoom = async () => {
            if (!user) return; // Wait for auth to be confirmed

            if (!isInRoom && roomId && user) {
                try {
                    // First check if room exists and if it has password
                    const roomData = await checkRoomExists(roomId);
                    
                    if (roomData && roomData.hasPassword) {
                        // Room has password, prompt user for password
                        const password = prompt('Bu oda şifre korumalı. Şifreyi girin:');
                        if (!password) {
                            navigate('/');
                            return;
                        }
                        await joinRoom(roomId, password);
                    } else {
                        // Room has no password or doesn't exist, try joining
                        await joinRoom(roomId, '');
                    }
                } catch (error) {
                    console.error('Error joining room:', error);
                    alert(`Odaya katılırken hata: ${error.message}`);
                    navigate('/');
                }
            }
        };

        tryJoinRoom();
    }, [roomId, isInRoom, joinRoom, navigate, user]);

    // Copy all helper functions from App.js

    const getStartOfWeek = () => { 
        const now = new Date(); 
        const day = now.getDay(); 
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
        const startOfWeek = new Date(now.setDate(diff)); 
        startOfWeek.setHours(0, 0, 0, 0); 
        return startOfWeek; 
    };

    const logFocusSession = async () => { 
        if (!user) return; 
        const durationInSeconds = userSettings.pomodoro * 60; 
        const session = { duration: durationInSeconds, completedAt: Timestamp.now() }; 
        await addDoc(collection(db, 'users', user.uid, 'focusSessions'), session); 
        setWeeklyFocusTime(prevTime => prevTime + durationInSeconds); 
    };

    const fetchUserData = async (uid) => { 
        const userDocRef = doc(db, 'users', uid); 
        const docSnap = await getDoc(userDocRef); 
        if (docSnap.exists()) { 
            const data = docSnap.data(); 
            const settings = data.settings || { pomodoro: 25, short: 5, long: 15 }; 
            setUserSettings(settings); 
            setStats(data.stats || { completedPomodoros: 0 }); 
            resetTimer(settings.pomodoro * 60); 
            setMode('pomodoro'); 
            setActiveTheme(data.theme || 'default'); 
        } 
        
        const projectsColRef = collection(db, 'users', uid, 'projects'); 
        const projectsSnapshot = await getDocs(projectsColRef); 
        let projectsList = projectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })); 
        if (projectsList.length === 0) { 
            const defaultProject = { name: t('general.defaultProject'), completed: false }; 
            const newProjectDoc = await addDoc(projectsColRef, defaultProject); 
            projectsList = [{ id: newProjectDoc.id, ...defaultProject }]; 
        } 
        setProjects(projectsList); 
        const firstActiveProject = projectsList.find(p => !p.completed); 
        setActiveProjectId(firstActiveProject ? firstActiveProject.id : null); 
        
        const tasksColRef = collection(db, 'users', uid, 'tasks'); 
        const tasksSnapshot = await getDocs(tasksColRef); 
        setTasks(tasksSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))); 
    };

    const incrementTaskPomodoro = async (taskId) => { 
        if (!user) return; 
        const taskRef = doc(db, 'users', user.uid, 'tasks', taskId); 
        try { 
            await updateDoc(taskRef, { pomodorosCompleted: increment(1) }); 
            setTasks(tasks.map(task => task.id === taskId ? { ...task, pomodorosCompleted: (task.pomodorosCompleted || 0) + 1 } : task)); 
        } catch (error) { 
            if (error.code === 'not-found' || error.message.includes('No document to update')) { 
                await setDoc(taskRef, { pomodorosCompleted: 1 }, { merge: true }); 
                setTasks(tasks.map(task => task.id === taskId ? { ...task, pomodorosCompleted: 1 } : task)); 
            } else { 
                console.error("Görev sayacı güncellenirken hata:", error); 
            } 
        } 
    };

    const handleAddTask = async () => { 
        const text = taskInput.trim(); 
        if (text && user && activeProjectId) { 
            const newTask = { text, projectId: activeProjectId, completed: false, pomodorosCompleted: 0 }; 
            const newDocRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), newTask); 
            setTasks([...tasks, { id: newDocRef.id, ...newTask }]); 
            setTaskInput(''); 
        } 
    };

    const handleDeleteTask = async (taskId) => { 
        if (!user) return; 
        if (taskId === activeTaskId) { setActiveTaskId(null); } 
        
        const taskToComplete = tasks.find(t => t.id === taskId);
        if (taskToComplete) {
            await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
                ...taskToComplete,
                completed: true,
                completedAt: new Date()
            }, { merge: true });
        }
        
        setTasks(tasks.filter(t => t.id !== taskId)); 
    };

    const openModal = (modalName) => { setActiveModal(modalName); };
    const closeModal = () => { setActiveModal(null); };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleLeaveRoom = async () => {
        try {
            await leaveRoom();
            navigate('/');
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    };

    // Mode değiştiğinde timer'ı güncelle (sadece timer durmuşsa)
    useEffect(() => {
        if (!isTimerActive && time === 0) {
            resetTimer(userSettings[mode] * 60);
        }
    }, [mode, userSettings, resetTimer, isTimerActive, time]);

    // Page title update
    useEffect(() => {
        document.title = isTimerActive ? `${formatTime(time)} - ${t('general.appName')}` : `${t('general.appName')} - Room ${currentRoom?.name || ''}`;
    }, [time, isTimerActive, t, currentRoom]);

    // Theme application
    useEffect(() => {
        const { themes } = require('../themes');
        const currentTheme = themes[activeTheme];
        if (!currentTheme) return;
        const root = document.documentElement;
        Object.keys(themes.default.colors).forEach(key => root.style.removeProperty(key));
        if (currentTheme.isSpecial) {
             Object.keys(currentTheme.colors).forEach(key => root.style.setProperty(key, currentTheme.colors[key]));
        }
        Object.keys(currentTheme.colors).forEach(key => { root.style.setProperty(key, currentTheme.colors[key]); });
        document.body.style.backgroundColor = currentTheme.colors[`--bg-color-${mode}`];
    }, [activeTheme, mode]);

    // REAL-TIME SYNC - Force update from other users
    useEffect(() => {
        if (syncedTimer && isInRoom && user) {
            console.log('🔄 SYNC RECEIVED:', syncedTimer);
            console.log('📊 Current local state:', { mode, time, isTimerActive });
            console.log('👤 Updated by:', syncedTimer.lastUpdatedBy, 'Current user:', user.uid);
            
            // Skip if this update came from current user to prevent loops
            if (syncedTimer.lastUpdatedBy === user.uid) {
                console.log('⏭️ Skipping own update');
                return;
            }
            
            // Always force sync mode and time
            setMode(syncedTimer.mode);
            resetTimer(syncedTimer.timeLeft);
            
            // CRITICAL: Force timer active state to match exactly
            console.log(`🎯 Timer state sync: remote=${syncedTimer.isActive}, local=${isTimerActive}`);
            
            // Force timer state to match remote without conditions
            if (syncedTimer.isActive && !isTimerActive) {
                console.log('▶️ Starting timer to match remote');
                startTimer();
            } else if (!syncedTimer.isActive && isTimerActive) {
                console.log('⏸️ Stopping timer to match remote');
                stopTimer();
            } else {
                console.log('✅ Timer states already match');
            }
        }
    }, [syncedTimer]);

    // Timer effects and handlers
    useEffect(() => {
        if (isFinished) {
            if (mode === 'pomodoro') {
                setShowCelebration(true);
                const newStats = { completedPomodoros: stats.completedPomodoros + 1 };
                setStats(newStats);
                
                const birdSoundUrl = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/10558/birds.mp3';
                playNotificationSound(birdSoundUrl);
                
                if (user) { 
                    updateUserDataInDb({ stats: newStats }); 
                    logFocusSession(); 
                    if (activeTaskId) { 
                        incrementTaskPomodoro(activeTaskId); 
                    } 
                }
            } else {
                alert(t('general.breakFinished'));
            }
        }
    }, [isFinished, mode, stats.completedPomodoros, user, activeTaskId, playNotificationSound, t]);

    // New achievements effect
    useEffect(() => {
        if (newAchievements.length > 0) {
            setShowNewAchievements(newAchievements);
        }
    }, [newAchievements]);

    // Timer effects and handlers
    useEffect(() => {
        if (isFinished) {
            if (mode === 'pomodoro') {
                setShowCelebration(true);
                const newStats = { completedPomodoros: stats.completedPomodoros + 1 };
                setStats(newStats);
                
                const birdSoundUrl = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/10558/birds.mp3';
                playNotificationSound(birdSoundUrl);
                
                if (user) { 
                    updateUserDataInDb({ stats: newStats }); 
                    logFocusSession(); 
                    if (activeTaskId) { 
                        incrementTaskPomodoro(activeTaskId); 
                    } 
                }
            } else {
                alert(t('general.breakFinished'));
            }
        }
    }, [isFinished, mode, stats.completedPomodoros, user, activeTaskId, playNotificationSound, t]);

    // New achievements effect
    useEffect(() => {
        if (newAchievements.length > 0) {
            setShowNewAchievements(newAchievements);
        }
    }, [newAchievements]);

    // Timer sync function - force immediate sync
    const syncTimerToRoom = useCallback(() => {
        if (isInRoom && syncTimer && user) {
            const timerState = {
                mode,
                timeLeft: time,
                isActive: isTimerActive,
                startedAt: isTimerActive ? Date.now() - ((userSettings[mode] * 60 - time) * 1000) : null,
                lastUpdatedBy: user.uid,
                syncTimestamp: Date.now()
            };
            console.log('Forcing timer sync:', timerState);
            syncTimer(timerState);
        }
    }, [isInRoom, syncTimer, mode, time, isTimerActive, userSettings, user]);

    const updateUserDataInDb = async (dataToUpdate) => { 
        if (!user) return; 
        await setDoc(doc(db, 'users', user.uid), dataToUpdate, { merge: true }); 
    };

    const switchMode = (newMode) => { 
        const newTime = userSettings[newMode] * 60;
        resetTimer(newTime); 
        setMode(newMode); 
        setActiveTaskId(null);
        
        // Always sync with room when mode changes
        if (isInRoom) {
            const timerState = {
                mode: newMode,
                timeLeft: newTime,
                isActive: false,
                startedAt: null
            };
            syncTimer(timerState);
            console.log('Mode switched and synced:', timerState);
        }
    };

    const toggleTimer = () => {
        unlockAudio();
        
        // Calculate new state BEFORE toggling
        const newActiveState = !isTimerActive;
        console.log(`🎮 TOGGLE TIMER: ${isTimerActive} → ${newActiveState}`);
        
        // Sync FIRST with calculated state
        if (isInRoom && syncTimer && user) {
            const timerState = {
                mode,
                timeLeft: time,
                isActive: newActiveState,
                startedAt: newActiveState ? Date.now() : null,
                lastUpdatedBy: user.uid,
                syncTimestamp: Date.now()
            };
            console.log('🚀 SYNCING BEFORE LOCAL TOGGLE:', timerState);
            syncTimer(timerState);
        }
        
        // Then toggle local timer
        toggleTimerHook();
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleKeyPress = (e) => e.key === 'Enter' && handleAddTask();

    if (!user) {
        return (
            <div className="room-loading">
                <div className="loading-spinner"></div>
                <p>Yükleniyor...</p>
            </div>
        );
    }

    if (!isInRoom || !currentRoom) {
        return (
            <div className="room-loading">
                <div className="loading-spinner"></div>
                <p>{t('room.joining') || 'Odaya katılınıyor...'}</p>
            </div>
        );
    }

    return (
        <div className={`room-page theme-${activeTheme}`}>
            <Header 
                user={user} 
                openModal={openModal} 
                handleLogout={handleLogout} 
                isRoomPage={true}
                onLeaveRoom={handleLeaveRoom}
            />
            
            <div className="room-content">
                <div className="room-header">
                    <h1>{currentRoom.name}</h1>
                    <div className="room-info">
                        <span>{t('room.roomId')}: {currentRoom.id}</span>
                        <span>{t('room.participants')}: {currentRoom.participants?.length || 0}/{currentRoom.capacity}</span>
                    </div>
                </div>

                <div className="room-timer-container">
                    <RoomTimer 
                        mode={mode}
                        time={time}
                        isActive={isTimerActive}
                        switchMode={switchMode}
                        toggleTimer={toggleTimer}
                        formatTime={formatTime}
                        totalTime={userSettings[mode] * 60}
                    />
                </div>

                <div className="room-bottom-section">
                    {user && activeProjectId && (
                        <div className="room-tasks-only">
                            <Tasks 
                                tasks={tasks} 
                                projects={projects} 
                                activeProjectId={activeProjectId} 
                                setActiveProjectId={setActiveProjectId} 
                                handleAddProject={() => {}} 
                                handleCompleteProject={() => {}} 
                                handleDeleteProject={() => {}} 
                                taskInput={taskInput} 
                                setTaskInput={setTaskInput} 
                                handleAddTask={handleAddTask} 
                                handleDeleteTask={handleDeleteTask} 
                                handleKeyPress={handleKeyPress} 
                                activeTaskId={activeTaskId} 
                                setActiveTaskId={setActiveTaskId} 
                                userSettings={userSettings} 
                            />
                        </div>
                    )}
                </div>
            </div>

            <StudyRoomPopout 
                syncedTimer={{
                    mode,
                    time,
                    isActive: isTimerActive,
                    totalTime: userSettings[mode] * 60
                }}
            />

            {showCelebration && (
                <Celebration 
                    onClose={() => setShowCelebration(false)} 
                />
            )}

            {showNewAchievements.length > 0 && (
                <AchievementNotification 
                    achievements={showNewAchievements} 
                    onClose={() => setShowNewAchievements([])}
                />
            )}
        </div>
    );
}

export default RoomPage;
