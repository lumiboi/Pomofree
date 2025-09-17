import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile, 
  GoogleAuthProvider, 
  TwitterAuthProvider,
  signInWithPopup,
  linkWithCredential,
  signInWithCredential,
  getAdditionalUserInfo
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  writeBatch, 
  query, 
  where, 
  Timestamp, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { themes } from './themes';
import { LanguageProvider } from './contexts/LanguageContext';
import { StudyRoomProvider } from './contexts/StudyRoomContext';
import { useTranslation } from './hooks/useTranslation';
import { useBackgroundTimer } from './hooks/useBackgroundTimer';
import { useBackgroundAudio } from './hooks/useBackgroundAudio';
import { useAchievements } from './hooks/useAchievements';
import { useStudyRoom } from './contexts/StudyRoomContext';

import Header from './components/Header';
import Timer from './components/Timer';
import Tasks from './components/Tasks';
import LoginModal from './components/LoginModal';
import ThemeSelector from './components/ThemeSelector';
import ProjectShowcase from './components/ProjectShowcase';
import SettingsModal from './components/SettingsModal';
import Celebration from './components/Celebration';
import WeeklyStats from './components/WeeklyStats';
import AdvancedReports from './components/AdvancedReports';
import ProductivityDashboard from './components/ProductivityDashboard';
import AchievementNotification from './components/AchievementNotification';
import StudyWithMeButton from './components/StudyWithMeButton';
import RoomSetupModal from './components/RoomSetupModal';
import StudyRoomPopout from './components/StudyRoomPopout';
import RoomPage from './components/RoomPage';
import PatreonSupport from './components/PatreonSupport';
import MusicPlayer from './components/MusicPlayer';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import ParallaxFooter from './components/ParallaxFooter';

const SESSION_STORAGE_KEY = 'pomofree_active_session_v2';

function AppContent() {
    const { t } = useTranslation();
    const { playNotificationSound, unlockAudio } = useBackgroundAudio();
    const [user, setUser] = useState(null);
    const [userSettings, setUserSettings] = useState({ pomodoro: 25, short: 5, long: 15 });
    const [mode, setMode] = useState('pomodoro');
    const [activeTaskId, setActiveTaskId] = useState(null);
    
    // Timer hook'unu kullan
    const {
        time,
        isTimerActive,
        toggleTimer: toggleTimerHook,
        resetTimer,
        isFinished
    } = useBackgroundTimer(userSettings[mode] * 60, false);
    
    // Mode değiştiğinde timer'ı güncelle (sadece timer durmuşsa)
    useEffect(() => {
        if (!isTimerActive && time === 0) {
            resetTimer(userSettings[mode] * 60);
        }
    }, [mode, userSettings, resetTimer, isTimerActive, time]);

    // Timer çalışırken sayfa yenileme uyarısı
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isTimerActive) {
                e.preventDefault();
                e.returnValue = 'Timer çalışıyor! Sayfayı yenilerseniz verileriniz kaybolabilir.';
                return 'Timer çalışıyor! Sayfayı yenilerseniz verileriniz kaybolabilir.';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isTimerActive]);

    
    const [tasks, setTasks] = useState([]);
    const [taskInput, setTaskInput] = useState('');
    const [modalOpen, setModalOpen] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [tempSettings, setTempSettings] = useState({ pomodoro: 25, short: 5, long: 15 });
    const [stats, setStats] = useState({ completedPomodoros: 0 });
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [activeTheme, setActiveTheme] = useState('default');
    const [showCelebration, setShowCelebration] = useState(false);
    const [weeklyFocusTime, setWeeklyFocusTime] = useState(0);

    // Celebration handler'ı useCallback ile optimize et
    const handleCelebrationComplete = useCallback(() => {
        setShowCelebration(false);
    }, []);

    // Achievement sistemi
    const { newAchievements } = useAchievements(user, stats, weeklyFocusTime);
    const [showNewAchievements, setShowNewAchievements] = useState([]);
    const [showRoomSetup, setShowRoomSetup] = useState(false);
    const { createRoom, joinRoom, isInRoom, syncTimer } = useStudyRoom();

    // Yeni achievement'ları göster
    useEffect(() => {
        if (newAchievements.length > 0) {
            setShowNewAchievements(newAchievements);
        }
    }, [newAchievements]);

    const formatTime = (seconds) => { const minutes = Math.floor(seconds / 60); const secs = seconds % 60; return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; };
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) { setUser(currentUser); fetchUserData(currentUser.uid); } 
            else { setUser(null); setTasks([]); setProjects([]); setActiveProjectId(null); setActiveTaskId(null); setUserSettings({ pomodoro: 25, short: 5, long: 15 }); setStats({ completedPomodoros: 0 }); setActiveTheme('default'); setWeeklyFocusTime(0); localStorage.removeItem(SESSION_STORAGE_KEY); }
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Timer bittiğinde çalışacak effect
    useEffect(() => {
        if (isFinished) {
            if (mode === 'pomodoro') {
                setShowCelebration(true);
                const newStats = { completedPomodoros: stats.completedPomodoros + 1 };
                setStats(newStats);
                
                // Ses çal
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinished, mode, stats.completedPomodoros, user, activeTaskId, playNotificationSound, t]);

    // Sayfa başlığını güncelle
    useEffect(() => {
        document.title = isTimerActive ? `${formatTime(time)} - ${t('general.appName')}` : `${t('general.appName')} - ${t('general.tagline')}`;
    }, [time, isTimerActive, t]);

    useEffect(() => {
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
    
    const getStartOfWeek = () => { const now = new Date(); const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1); const startOfWeek = new Date(now.setDate(diff)); startOfWeek.setHours(0, 0, 0, 0); return startOfWeek; };
    const logFocusSession = async () => { if (!user) return; const durationInSeconds = userSettings.pomodoro * 60; const session = { duration: durationInSeconds, completedAt: Timestamp.now() }; await addDoc(collection(db, 'users', user.uid, 'focusSessions'), session); setWeeklyFocusTime(prevTime => prevTime + durationInSeconds); };
    const fetchUserData = async (uid) => { const userDocRef = doc(db, 'users', uid); const docSnap = await getDoc(userDocRef); if (docSnap.exists()) { const data = docSnap.data(); const settings = data.settings || { pomodoro: 25, short: 5, long: 15 }; setUserSettings(settings); setTempSettings(settings); setStats(data.stats || { completedPomodoros: 0 }); if (!localStorage.getItem(SESSION_STORAGE_KEY)) { resetTimer(settings.pomodoro * 60); setMode('pomodoro'); } setActiveTheme(data.theme || 'default'); } const projectsColRef = collection(db, 'users', uid, 'projects'); const projectsSnapshot = await getDocs(projectsColRef); let projectsList = projectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })); if (projectsList.length === 0) { const defaultProject = { name: t('general.defaultProject'), completed: false }; const newProjectDoc = await addDoc(projectsColRef, defaultProject); projectsList = [{ id: newProjectDoc.id, ...defaultProject }]; } setProjects(projectsList); const firstActiveProject = projectsList.find(p => !p.completed); setActiveProjectId(firstActiveProject ? firstActiveProject.id : null); const tasksColRef = collection(db, 'users', uid, 'tasks'); const tasksSnapshot = await getDocs(tasksColRef); setTasks(tasksSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))); const startOfWeek = getStartOfWeek(); const sessionsColRef = collection(db, 'users', uid, 'focusSessions'); const q = query(sessionsColRef, where("completedAt", ">=", startOfWeek)); const querySnapshot = await getDocs(q); let totalSeconds = 0; querySnapshot.forEach((doc) => { totalSeconds += doc.data().duration; }); setWeeklyFocusTime(totalSeconds); };
    const updateUserDataInDb = async (dataToUpdate) => { if (!user) return; await setDoc(doc(db, 'users', user.uid), dataToUpdate, { merge: true }); };
    const incrementTaskPomodoro = async (taskId) => { if (!user) return; const taskRef = doc(db, 'users', user.uid, 'tasks', taskId); try { await updateDoc(taskRef, { pomodorosCompleted: increment(1) }); setTasks(tasks.map(task => task.id === taskId ? { ...task, pomodorosCompleted: (task.pomodorosCompleted || 0) + 1 } : task)); } catch (error) { if (error.code === 'not-found' || error.message.includes('No document to update')) { await setDoc(taskRef, { pomodorosCompleted: 1 }, { merge: true }); setTasks(tasks.map(task => task.id === taskId ? { ...task, pomodorosCompleted: 1 } : task)); } else { console.error("Görev sayacı güncellenirken hata:", error); } } };
    const handleRegister = async () => { if (!username.trim()) return alert(t('general.enterUsername')); try { const cred = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(cred.user, { displayName: username }); await setDoc(doc(db, 'users', cred.user.uid), { username }, { merge: true }); closeModal(); } catch (error) { alert(error.message); } };
    const handleLogin = async () => { try { await signInWithEmailAndPassword(auth, email, password); closeModal(); } catch (error) { alert(error.message); } };
    const handleLogout = () => { signOut(auth); };
    const handleGoogleSignIn = async () => { 
        const provider = new GoogleAuthProvider(); 
        try { 
            const result = await signInWithPopup(auth, provider); 
            await setDoc(doc(db, 'users', result.user.uid), { username: result.user.displayName }, { merge: true }); 
            closeModal(); 
        } catch (error) { 
            if (error.code === 'auth/account-exists-with-different-credential') {
                // Kullanıcıya hesapları bağlama seçeneği sun
                const shouldLink = window.confirm(
                    'Bu e-posta adresiyle zaten bir hesabınız var. Hesapları bağlamak ister misiniz?'
                );
                if (shouldLink) {
                    try {
                        // Mevcut kullanıcıyı bul ve hesapları bağla
                        const email = error.customData?.email;
                        if (email) {
                            // E-posta ile giriş yapmayı dene
                            const emailProvider = new TwitterAuthProvider();
                            const existingUser = await signInWithPopup(auth, emailProvider);
                            
                            // Google hesabını bağla
                            const googleCredential = GoogleAuthProvider.credentialFromError(error);
                            await linkWithCredential(existingUser.user, googleCredential);
                            
                            closeModal();
                        }
                    } catch (linkError) {
                        alert('Hesapları bağlarken hata oluştu: ' + linkError.message);
                    }
                }
            } else {
                alert(error.message); 
            }
        } 
    };
    const handleTwitterSignIn = async () => { 
        const provider = new TwitterAuthProvider(); 
        try { 
            const result = await signInWithPopup(auth, provider); 
            await setDoc(doc(db, 'users', result.user.uid), { username: result.user.displayName }, { merge: true }); 
            closeModal(); 
        } catch (error) { 
            console.error('Twitter giriş hatası:', error);
            if (error.code === 'auth/popup-blocked') {
                alert(t('auth.popupBlocked', 'Popup blocked! Please disable your browser\'s popup blocker and try again.'));
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                const shouldLink = window.confirm(
                    t('auth.accountExists', 'You already have an account with this email using Google. Would you like to link the accounts?')
                );
                if (shouldLink) {
                    try {
                        const email = error.customData?.email;
                        if (email) {
                            // Google ile giriş yap
                            const googleProvider = new GoogleAuthProvider();
                            googleProvider.setCustomParameters({ login_hint: email });
                            const existingUser = await signInWithPopup(auth, googleProvider);
                            
                            // Twitter hesabını bağla
                            const twitterCredential = TwitterAuthProvider.credentialFromError(error);
                            await linkWithCredential(existingUser.user, twitterCredential);
                            
                            closeModal();
                        }
                    } catch (linkError) {
                        console.error('Hesapları bağlama hatası:', linkError);
                        if (linkError.code === 'auth/popup-blocked') {
                            alert(t('auth.popupBlocked', 'Popup blocked! Please disable your browser\'s popup blocker and try again.'));
                        } else {
                            alert(t('auth.linkError', 'Error linking accounts: ') + linkError.message);
                        }
                    }
                }
            } else {
                alert(t('auth.twitterLoginError', 'Could not sign in with Twitter: ') + error.message); 
            }
        } 
    };
    const handleThemeChange = async (themeKey) => { setActiveTheme(themeKey); if (user) await updateUserDataInDb({ theme: themeKey }); };
    const handleCompleteProject = async (projectIdToComplete) => { if (!user || projects.filter(p => !p.completed).length <= 1) { alert(t('general.cannotCompleteLastProject')); return; } const batch = writeBatch(db); batch.update(doc(db, 'users', user.uid, 'projects', projectIdToComplete), { completed: true, completedAt: new Date() }); tasks.filter(t => t.projectId === projectIdToComplete).forEach(task => batch.delete(doc(db, 'users', user.uid, 'tasks', task.id))); await batch.commit(); const updatedProjects = projects.map(p => p.id === projectIdToComplete ? { ...p, completed: true } : p); setProjects(updatedProjects); setTasks(tasks.filter(t => t.projectId !== projectIdToComplete)); setActiveProjectId(updatedProjects.find(p => !p.completed)?.id || null); setActiveTaskId(null); };
    const handleDeleteProject = async (projectIdToDelete) => { const activeProjects = projects.filter(p => !p.completed); if (!user || activeProjects.length <= 1) { alert(t('general.cannotDeleteLastProject')); return; } if (!window.confirm(t('general.deleteProjectConfirm'))) return; const batch = writeBatch(db); batch.delete(doc(db, 'users', user.uid, 'projects', projectIdToDelete)); tasks.filter(t => t.projectId === projectIdToDelete).forEach(task => batch.delete(doc(db, 'users', user.uid, 'tasks', task.id))); await batch.commit(); const remainingProjects = projects.filter(p => p.id !== projectIdToDelete); setProjects(remainingProjects); setTasks(tasks.filter(t => t.projectId !== projectIdToDelete)); setActiveProjectId(remainingProjects.find(p => !p.completed)?.id || null); setActiveTaskId(null); };
    const handleClearShowcase = async () => { if (!user || !window.confirm(t('general.clearShowcaseConfirm'))) return; const batch = writeBatch(db); projects.filter(p => p.completed).forEach(p => batch.delete(doc(db, 'users', user.uid, 'projects', p.id))); await batch.commit(); setProjects(projects.filter(p => !p.completed)); };
    const handleAddTask = async () => { const text = taskInput.trim(); if (text && user && activeProjectId) { const newTask = { text, projectId: activeProjectId, completed: false, pomodorosCompleted: 0 }; const newDocRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), newTask); setTasks([...tasks, { id: newDocRef.id, ...newTask }]); setTaskInput(''); } };
    const handleDeleteTask = async (taskId) => { 
      if (!user) return; 
      if (taskId === activeTaskId) { setActiveTaskId(null); } 
      
      // Görevi tamamlandı olarak işaretle
      const taskToComplete = tasks.find(t => t.id === taskId);
      if (taskToComplete) {
        await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
          ...taskToComplete,
          completed: true,
          completedAt: new Date()
        }, { merge: true });
      }
      
      // Görevi listeden kaldır
      setTasks(tasks.filter(t => t.id !== taskId)); 
    };
    const handleAddProject = async (projectName) => { if (!user) return; const newProject = { name: projectName, completed: false }; const newDocRef = await addDoc(collection(db, 'users', user.uid, 'projects'), newProject); const newProjectWithId = { id: newDocRef.id, ...newProject }; setProjects([...projects, newProjectWithId]); setActiveProjectId(newDocRef.id); setActiveTaskId(null); };
    const switchMode = (newMode) => { 
        resetTimer(userSettings[newMode] * 60); 
        setMode(newMode); 
        setActiveTaskId(null);
        
        // Sync mode change with room if in a room
        if (isInRoom) {
            syncTimer({
                mode: newMode,
                timeLeft: userSettings[newMode] * 60,
                isActive: false,
                startedAt: null
            });
        }
    };
    
    const handleKeyPress = (e) => e.key === 'Enter' && handleAddTask();
    const openModal = (modalName) => { if (modalName === 'settings') { setTempSettings(userSettings); } setModalOpen(modalName); };
    
    const handleCreateRoom = () => {
        if (!user) {
            alert(t('general.loginRequired'));
            return;
        }
        setShowRoomSetup(true);
    };
    
    const navigate = useNavigate();
    
    const handleRoomCreate = async (roomConfig) => {
        try {
            const roomId = await createRoom(roomConfig);
            navigate(`/room/${roomId}`);
            return roomId;
        } catch (error) {
            throw error;
        }
    };
    
    const handleRoomJoin = async (roomId, password) => {
        try {
            const result = await joinRoom(roomId, password);
            navigate(`/room/${roomId}`);
            return result;
        } catch (error) {
            throw error;
        }
    };
    const closeModal = () => { setModalOpen(null); };
    
    const handleSaveSettings = () => { 
        setUserSettings(tempSettings); 
        updateUserDataInDb({ settings: tempSettings }); 
        closeModal(); 
        resetTimer(tempSettings.pomodoro * 60);
        setMode('pomodoro');
    };
    
    const toggleTimer = () => {
        // Ses kilidini aç
        unlockAudio();
        
        // Normal başlat/durdur
        toggleTimerHook();
        
        // Sync timer with room if in a room
        if (isInRoom) {
            syncTimer({
                mode,
                timeLeft: time,
                isActive: !isTimerActive,
                startedAt: !isTimerActive ? new Date() : null
            });
        }
    };

    return (
        <div className={`app-container theme-${activeTheme}`}>
            <Header user={user} openModal={openModal} handleLogout={handleLogout} />
            <StudyWithMeButton onCreateRoom={handleCreateRoom} activeTheme={activeTheme} />
            {user && <ProjectShowcase completedProjects={projects.filter(p => p.completed)} handleClearShowcase={handleClearShowcase} />}
            <div className="main-content">
                <Timer mode={mode} time={time} isActive={isTimerActive} switchMode={switchMode} toggleTimer={toggleTimer} formatTime={formatTime} totalTime={userSettings[mode] * 60} />
                {user && activeProjectId && (<Tasks tasks={tasks} projects={projects} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} handleAddProject={handleAddProject} handleCompleteProject={handleCompleteProject} handleDeleteProject={handleDeleteProject} taskInput={taskInput} setTaskInput={setTaskInput} handleAddTask={handleAddTask} handleDeleteTask={handleDeleteTask} handleKeyPress={handleKeyPress} activeTaskId={activeTaskId} setActiveTaskId={setActiveTaskId} userSettings={userSettings} />)}
            </div>
            <PatreonSupport />
            {user && <WeeklyStats totalSeconds={weeklyFocusTime} />}
            {modalOpen === 'themes' && <ThemeSelector closeModal={closeModal} handleThemeChange={handleThemeChange} />}
            {modalOpen === 'login' && <LoginModal closeModal={closeModal} isRegistering={isRegistering} setIsRegistering={setIsRegistering} email={email} setEmail={setEmail} password={password} setPassword={setPassword} username={username} setUsername={setUsername} handleRegister={handleRegister} handleLogin={handleLogin} handleGoogleSignIn={handleGoogleSignIn} handleTwitterSignIn={handleTwitterSignIn} />}
            {modalOpen === 'settings' && <SettingsModal closeModal={closeModal} tempSettings={tempSettings} setTempSettings={setTempSettings} handleSaveSettings={handleSaveSettings} />}
            {modalOpen === 'report' && ( <div className="modal-overlay" onClick={closeModal}><div className="modal-content" onClick={(e) => e.stopPropagation()}> <h2>{t('report.title')}</h2> <p>{t('report.completedPomodoros')}</p> <h3 style={{fontSize: '3em', textAlign: 'center', margin: '1rem 0'}}>{stats.completedPomodoros}</h3> <button onClick={closeModal} className="btn btn-secondary">{t('report.close')}</button> </div></div> )}
            {modalOpen === 'advanced-reports' && <AdvancedReports user={user} closeModal={closeModal} />}
            {modalOpen === 'dashboard' && <ProductivityDashboard user={user} closeModal={closeModal} />}
            {showCelebration && <Celebration onComplete={handleCelebrationComplete} />}

            {/* Achievement Notifications */}
            <AchievementNotification 
                achievements={showNewAchievements}
                onClose={() => setShowNewAchievements([])}
            />
            
            {/* Room Setup Modal */}
            {showRoomSetup && (
                <RoomSetupModal 
                    closeModal={() => setShowRoomSetup(false)}
                    onCreateRoom={handleRoomCreate}
                    onJoinRoom={handleRoomJoin}
                />
            )}
            
            {/* Study Room Popout */}
            <StudyRoomPopout 
                syncedTimer={{
                    mode,
                    timeLeft: time,
                    isActive: isTimerActive
                }}
                onTimerSync={syncTimer}
            />
            
            {/* Music Player */}
            <MusicPlayer />
            
            {/* Parallax Footer */}
            <ParallaxFooter />
        </div>
    );
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <StudyRoomProvider>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </StudyRoomProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;