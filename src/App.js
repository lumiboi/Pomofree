import { useState, useEffect, useCallback, useRef } from 'react';
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
  deleteUser
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  writeBatch, 
  updateDoc, 
  increment,
  deleteDoc
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
import WeeklyStats, { sumFocusSessions } from './components/WeeklyStats';
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
import SupportModal from './components/SupportModal';
import TodoPage from './components/TodoPage';
import FocusTools, { CommandPalette, SessionReviewModal } from './components/FocusTools';
import FocusSoundMixer from './components/FocusSoundMixer';
import {
  DEFAULT_FOCUS_SETTINGS,
  buildDataExports,
  createFocusSession,
  getAdaptiveSuggestion,
  getBreakTip
} from './focusModel';
import { isFocusTask } from './todoModel';

const SESSION_STORAGE_KEY = 'pomofree_active_session_v2';
const FOCUS_FLOW_STORAGE_KEY = 'pomofree_focus_flow_v1';

const emptyFocusSession = () => ({
    type: 'pomodoro',
    completionCriterion: '',
    startedAt: null,
    distractions: [],
    interruptions: []
});

const readFocusFlow = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(FOCUS_FLOW_STORAGE_KEY) || 'null');
        return {
            mode: ['pomodoro', 'short', 'long'].includes(stored?.mode) ? stored.mode : 'pomodoro',
            activeTaskId: stored?.activeTaskId || null,
            activeProjectId: stored?.activeProjectId || null,
            session: {
                ...emptyFocusSession(),
                ...(stored?.session || {}),
                distractions: Array.isArray(stored?.session?.distractions) ? stored.session.distractions : [],
                interruptions: Array.isArray(stored?.session?.interruptions) ? stored.session.interruptions : []
            }
        };
    } catch {
        return { mode: 'pomodoro', activeTaskId: null, activeProjectId: null, session: emptyFocusSession() };
    }
};

const getAuthErrorMessage = (error, t) => ({
    'auth/email-already-in-use': t('auth.emailInUse'),
    'auth/invalid-credential': t('auth.invalidCredentials'),
    'auth/invalid-email': t('auth.invalidEmail'),
    'auth/weak-password': t('auth.weakPassword'),
    'auth/too-many-requests': t('auth.tooManyRequests'),
    'auth/popup-closed-by-user': t('auth.popupClosed'),
    'auth/popup-blocked': t('auth.popupBlocked')
}[error?.code] || t('auth.genericError'));

function AppContent() {
    const { t } = useTranslation();
    const {
        playSound,
        playNotificationSound,
        showDesktopNotification,
        unlockAudio
    } = useBackgroundAudio();
    const [restoredFlow] = useState(readFocusFlow);
    const [user, setUser] = useState(null);
    const [userSettings, setUserSettings] = useState(DEFAULT_FOCUS_SETTINGS);
    const [mode, setMode] = useState(restoredFlow.mode);
    const [activeTaskId, setActiveTaskId] = useState(restoredFlow.activeTaskId);
    const [focusSession, setFocusSession] = useState(restoredFlow.session);
    const [pendingReview, setPendingReview] = useState(null);
    const [recentSessions, setRecentSessions] = useState([]);
    const [adaptiveDecision, setAdaptiveDecision] = useState(null);
    const [isMixerOpen, setIsMixerOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const finishedHandledRef = useRef(false);
    const breakReturnNotifiedRef = useRef(false);
    const participantCountRef = useRef(0);
    
    // Timer hook'unu kullan
    const {
        time,
        totalTime: timerTotalTime,
        isTimerActive,
        toggleTimer: toggleTimerHook,
        startTimer,
        stopTimer,
        resetTimer,
        isFinished
    } = useBackgroundTimer(userSettings[mode] * 60, false, SESSION_STORAGE_KEY);
    
    // Mode değiştiğinde timer'ı güncelle (sadece timer durmuşsa)
    useEffect(() => {
        if (!isTimerActive && time === 0) {
            resetTimer(userSettings[mode] * 60);
        }
    }, [mode, userSettings, resetTimer, isTimerActive, time]);

    const [tasks, setTasks] = useState([]);
    const [taskInput, setTaskInput] = useState('');
    const [modalOpen, setModalOpen] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [tempSettings, setTempSettings] = useState(DEFAULT_FOCUS_SETTINGS);
    const [stats, setStats] = useState({ completedPomodoros: 0 });
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(restoredFlow.activeProjectId);
    const [activeTheme, setActiveTheme] = useState('default');
    const [showCelebration, setShowCelebration] = useState(false);
    const [weeklyFocusTime, setWeeklyFocusTime] = useState(0);
    const [todayFocusTime, setTodayFocusTime] = useState(0);
    const [showSupport, setShowSupport] = useState(false);

    // Celebration handler'ı useCallback ile optimize et
    const handleCelebrationComplete = useCallback(() => {
        setShowCelebration(false);
    }, []);

    // Achievement sistemi
    const { newAchievements } = useAchievements(user, stats, weeklyFocusTime);
    const [showNewAchievements, setShowNewAchievements] = useState([]);
    const [showRoomSetup, setShowRoomSetup] = useState(false);
    const {
        createRoom,
        findAnonymousRoom,
        joinRoom,
        isInRoom,
        leaveRoom,
        syncTimer,
        roomParticipants
    } = useStudyRoom();

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
            else { setUser(null); setTasks([]); setProjects([]); setActiveProjectId(null); setActiveTaskId(null); setUserSettings(DEFAULT_FOCUS_SETTINGS); setStats({ completedPomodoros: 0 }); setActiveTheme('default'); setWeeklyFocusTime(0); setTodayFocusTime(0); setRecentSessions([]); setAdaptiveDecision(null); setFocusSession(emptyFocusSession()); localStorage.removeItem(SESSION_STORAGE_KEY); localStorage.removeItem(FOCUS_FLOW_STORAGE_KEY); }
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Timer bittiğinde çalışacak effect
    useEffect(() => {
        try {
            localStorage.setItem(FOCUS_FLOW_STORAGE_KEY, JSON.stringify({
                mode,
                activeTaskId,
                activeProjectId,
                session: focusSession
            }));
        } catch {
            // Focus flow remains available in memory when storage is unavailable.
        }
    }, [mode, activeTaskId, activeProjectId, focusSession]);

    useEffect(() => {
        document.body.classList.toggle('reduce-motion', Boolean(userSettings.reducedMotion));
        document.body.classList.toggle('high-contrast', Boolean(userSettings.highContrast));
        document.body.dataset.colorVision = userSettings.colorVision || 'default';
    }, [userSettings.reducedMotion, userSettings.highContrast, userSettings.colorVision]);

    // Timer bittiğinde çalışacak effect
    useEffect(() => {
        if (!isFinished) {
            finishedHandledRef.current = false;
            return;
        }
        if (finishedHandledRef.current) return;
        finishedHandledRef.current = true;

        if (isFinished) {
            if (mode === 'pomodoro') {
                setShowCelebration(true);
                const newStats = {
                    ...stats,
                    completedPomodoros: stats.completedPomodoros + 1,
                    sharedSessions: (stats.sharedSessions || 0) + (isInRoom ? 1 : 0)
                };
                setStats(newStats);
                // Ses çal
                const birdSoundUrl = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/10558/birds.mp3';
                if (userSettings.notifications && userSettings.notificationTypes.sessionEnd) {
                    const isLongBreakTime = newStats.completedPomodoros % 4 === 0 &&
                        userSettings.notificationTypes.longBreak;
                    playNotificationSound(
                        birdSoundUrl,
                        2200,
                        t(isLongBreakTime ? 'notifications.longBreakTime' : 'notifications.sessionEnded')
                    );
                }
                else playSound(birdSoundUrl, 2200);
                
                if (user) { 
                    updateUserDataInDb({ stats: newStats }); 
                    logFocusSession().catch(error => console.error('Odak seansı kaydedilemedi:', error));
                    if (activeTaskId) { 
                        incrementTaskPomodoro(activeTaskId); 
                    } 
                }
            } else {
                if (userSettings.notifications && userSettings.notificationTypes.breakEnd) {
                    showDesktopNotification(t('notifications.breakEnded'), 'pomofree-break');
                }
                alert(t('general.breakFinished'));
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinished, mode, stats.completedPomodoros, user, activeTaskId, playNotificationSound, playSound, showDesktopNotification, t, timerTotalTime, userSettings]);

    useEffect(() => {
        if (mode === 'pomodoro' || !isTimerActive || time > 30) {
            breakReturnNotifiedRef.current = false;
            return;
        }
        if (
            time <= 30 &&
            !breakReturnNotifiedRef.current &&
            userSettings.notifications &&
            userSettings.notificationTypes.breakEnd
        ) {
            breakReturnNotifiedRef.current = true;
            showDesktopNotification(t('notifications.breakEndingSoon'), 'pomofree-break-return');
        }
    }, [mode, isTimerActive, time, showDesktopNotification, t, userSettings]);

    useEffect(() => {
        if (!isInRoom) {
            participantCountRef.current = 0;
            return;
        }
        if (
            participantCountRef.current > 0 &&
            roomParticipants.length > participantCountRef.current &&
            userSettings.notifications &&
            userSettings.notificationTypes.participantJoined
        ) {
            showDesktopNotification(t('notifications.participantJoined'), 'pomofree-room');
        }
        participantCountRef.current = roomParticipants.length;
    }, [isInRoom, roomParticipants.length, showDesktopNotification, t, userSettings]);

    // Sayfa başlığını güncelle
    useEffect(() => {
        document.title = isTimerActive ? `${formatTime(time)} - ${t('general.appName')}` : `${t('general.appName')} - ${t('general.tagline')}`;
    }, [time, isTimerActive, t]);

    // Daily support modal (once per day)
    useEffect(() => {
        try {
            const key = 'supportModalLastShown';
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            const last = localStorage.getItem(key);
            if (last !== todayStr) {
                // Small delay to avoid clashing with initial UI
                const timer = setTimeout(() => setShowSupport(true), 1200);
                return () => clearTimeout(timer);
            }
        } catch (e) {
            // ignore storage errors
        }
    }, []);

    const handleCloseSupport = () => {
        try {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            localStorage.setItem('supportModalLastShown', `${yyyy}-${mm}-${dd}`);
        } catch (e) {}
        setShowSupport(false);
    };

    useEffect(() => {
        const currentTheme = themes[activeTheme];
        if (!currentTheme) return;
        const root = document.documentElement;
        [...new Set(Object.values(themes).flatMap(theme => Object.keys(theme.colors)))]
            .forEach(key => root.style.removeProperty(key));
        Object.keys(currentTheme.colors).forEach(key => { root.style.setProperty(key, currentTheme.colors[key]); });
        document.body.style.backgroundColor = currentTheme.colors[`--bg-color-${mode}`];
    }, [activeTheme, mode]);
    
    const getStartOfWeek = () => { const now = new Date(); const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1); const startOfWeek = new Date(now.setDate(diff)); startOfWeek.setHours(0, 0, 0, 0); return startOfWeek; };
    const logFocusSession = async () => {
        if (!user) return;
        const endedAt = new Date();
        const fallbackStartedAt = new Date(endedAt.getTime() - timerTotalTime * 1000);
        const storedStartedAt = focusSession.startedAt ? new Date(focusSession.startedAt) : null;
        const session = createFocusSession({
            ...focusSession,
            type: isInRoom ? 'shared' : focusSession.type,
            plannedDurationSeconds: timerTotalTime,
            actualDurationSeconds: timerTotalTime,
            taskId: activeTaskId,
            projectId: activeProjectId,
            startedAt: storedStartedAt && !Number.isNaN(storedStartedAt.getTime())
                ? storedStartedAt
                : fallbackStartedAt,
            endedAt
        }, endedAt);
        const sessionRef = await addDoc(
            collection(db, 'users', user.uid, 'focusSessions'),
            session
        );
        const savedSession = { id: sessionRef.id, ...session };
        setRecentSessions(current => [...current, savedSession].slice(-30));
        setPendingReview(savedSession);
        setWeeklyFocusTime(prevTime => prevTime + session.duration);
        setTodayFocusTime(prevTime => prevTime + session.duration);
        setFocusSession(emptyFocusSession());

        if (activeProjectId) {
            const projectRef = doc(db, 'users', user.uid, 'projects', activeProjectId);
            await updateDoc(projectRef, {
                lastWorkedAt: endedAt,
                completedPomodoros: increment(1)
            }).catch(() => {});
            setProjects(current => current.map(project => (
                project.id === activeProjectId
                    ? {
                        ...project,
                        lastWorkedAt: endedAt,
                        completedPomodoros: (project.completedPomodoros || 0) + 1
                    }
                    : project
            )));
        }
    };
    const fetchUserData = async (uid) => {
        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);
        const data = docSnap.exists() ? docSnap.data() : {};
        const settings = {
            ...DEFAULT_FOCUS_SETTINGS,
            ...(data.settings || {}),
            shortcuts: {
                ...DEFAULT_FOCUS_SETTINGS.shortcuts,
                ...(data.settings?.shortcuts || {})
            },
            breakCategories: {
                ...DEFAULT_FOCUS_SETTINGS.breakCategories,
                ...(data.settings?.breakCategories || {})
            },
            notificationTypes: {
                ...DEFAULT_FOCUS_SETTINGS.notificationTypes,
                ...(data.settings?.notificationTypes || {})
            }
        };
        setUserSettings(settings);
        setTempSettings(settings);
        setStats(data.stats || { completedPomodoros: 0 });
        setAdaptiveDecision(data.adaptiveDecision || null);
        setActiveTheme(data.theme || 'default');
        if (!localStorage.getItem(SESSION_STORAGE_KEY)) {
            resetTimer(settings[restoredFlow.mode] * 60);
        }

        const projectsColRef = collection(db, 'users', uid, 'projects');
        const projectsSnapshot = await getDocs(projectsColRef);
        let projectsList = projectsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
        if (projectsList.length === 0) {
            const defaultProject = { name: t('general.defaultProject'), completed: false };
            const newProjectDoc = await addDoc(projectsColRef, defaultProject);
            projectsList = [{ id: newProjectDoc.id, ...defaultProject }];
        }
        setProjects(projectsList);
        const activeProjects = projectsList.filter(project => !project.completed && !project.archived);
        const restoredProject = activeProjects.find(project => project.id === restoredFlow.activeProjectId);
        setActiveProjectId(restoredProject?.id || activeProjects[0]?.id || null);

        const tasksSnapshot = await getDocs(collection(db, 'users', uid, 'tasks'));
        const taskList = tasksSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
        setTasks(taskList);
        const restoredTask = taskList.find(task => (
            task.id === restoredFlow.activeTaskId && !task.completed && isFocusTask(task)
        ));
        setActiveTaskId(restoredTask?.id || null);

        const startOfWeek = getStartOfWeek();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const querySnapshot = await getDocs(
            collection(db, 'users', uid, 'focusSessions')
        );
        const sessions = querySnapshot.docs
            .map(item => ({ id: item.id, ...item.data() }))
            .sort((a, b) => {
                const first = a.completedAt?.toDate?.() || new Date(a.completedAt || 0);
                const second = b.completedAt?.toDate?.() || new Date(b.completedAt || 0);
                return first - second;
            });
        const weeklySessions = sessions.filter(session => {
            const completedAt = session.completedAt?.toDate?.() || new Date(session.completedAt);
            return completedAt >= startOfWeek;
        });
        const focusTimes = sumFocusSessions(weeklySessions, startOfToday);
        setRecentSessions(sessions.slice(-30));
        setWeeklyFocusTime(focusTimes.totalSeconds);
        setTodayFocusTime(focusTimes.todaySeconds);
    };
    const updateUserDataInDb = async (dataToUpdate) => { if (!user) return; await setDoc(doc(db, 'users', user.uid), dataToUpdate, { merge: true }); };
    const incrementTaskPomodoro = async (taskId) => { if (!user) return; const taskRef = doc(db, 'users', user.uid, 'tasks', taskId); try { await updateDoc(taskRef, { pomodorosCompleted: increment(1) }); setTasks(tasks.map(task => task.id === taskId ? { ...task, pomodorosCompleted: (task.pomodorosCompleted || 0) + 1 } : task)); } catch (error) { if (error.code === 'not-found' || error.message.includes('No document to update')) { await setDoc(taskRef, { pomodorosCompleted: 1 }, { merge: true }); setTasks(tasks.map(task => task.id === taskId ? { ...task, pomodorosCompleted: 1 } : task)); } else { console.error("Görev sayacı güncellenirken hata:", error); } } };
    const handleRegister = async () => { if (!username.trim()) return alert(t('general.enterUsername')); try { const cred = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(cred.user, { displayName: username }); await setDoc(doc(db, 'users', cred.user.uid), { username }, { merge: true }); closeModal(); } catch (error) { alert(getAuthErrorMessage(error, t)); } };
    const handleLogin = async () => { try { await signInWithEmailAndPassword(auth, email, password); closeModal(); } catch (error) { alert(getAuthErrorMessage(error, t)); } };
    const handleLogout = () => { signOut(auth); };
    const handleExportData = async format => {
        if (!user) return;
        try {
            const sessionsSnapshot = await getDocs(
                collection(db, 'users', user.uid, 'focusSessions')
            );
            const sessions = sessionsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
            const exported = buildDataExports({ projects, tasks, sessions });
            const content = format === 'json' ? exported.json : `\uFEFF${exported.csv}`;
            const blob = new Blob([content], {
                type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pomofree-data-${new Date().toISOString().slice(0, 10)}.${format}`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            alert(t('settings.exportError'));
        }
    };
    const handleDeleteAccount = async () => {
        if (!user || !window.confirm(t('settings.deleteAccountConfirm'))) return;
        try {
            if (isInRoom) await leaveRoom();
            const paths = ['tasks', 'projects', 'focusSessions', 'achievements'];
            const snapshots = await Promise.all(paths.map(path => (
                getDocs(collection(db, 'users', user.uid, path))
            )));
            await Promise.all(snapshots.flatMap((snapshot, index) => (
                snapshot.docs.map(item => deleteDoc(
                    doc(db, 'users', user.uid, paths[index], item.id)
                ))
            )));
            await deleteDoc(doc(db, 'users', user.uid));
            await deleteUser(user);
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(FOCUS_FLOW_STORAGE_KEY);
            localStorage.removeItem('pomofree_sound_profiles_v1');
            localStorage.removeItem('shownAchievements');
            localStorage.removeItem('lastUserId');
            closeModal();
        } catch {
            alert(t('settings.deleteAccountError'));
        }
    };
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
                        alert(getAuthErrorMessage(linkError, t));
                    }
                }
            } else {
                alert(getAuthErrorMessage(error, t)); 
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
                            alert(getAuthErrorMessage(linkError, t));
                        }
                    }
                }
            } else {
                alert(getAuthErrorMessage(error, t)); 
            }
        } 
    };
    const handleThemeChange = async (themeKey) => { setActiveTheme(themeKey); if (user) await updateUserDataInDb({ theme: themeKey }); };
    const handleCompleteProject = async (projectIdToComplete) => { if (!user || projects.filter(p => !p.completed && !p.archived).length <= 1) { alert(t('general.cannotCompleteLastProject')); return; } const batch = writeBatch(db); batch.update(doc(db, 'users', user.uid, 'projects', projectIdToComplete), { completed: true, completedAt: new Date() }); tasks.filter(t => t.projectId === projectIdToComplete).forEach(task => batch.delete(doc(db, 'users', user.uid, 'tasks', task.id))); await batch.commit(); const updatedProjects = projects.map(p => p.id === projectIdToComplete ? { ...p, completed: true } : p); setProjects(updatedProjects); setTasks(tasks.filter(t => t.projectId !== projectIdToComplete)); setActiveProjectId(updatedProjects.find(p => !p.completed && !p.archived)?.id || null); setActiveTaskId(null); };
    const handleDeleteProject = async (projectIdToDelete) => { const activeProjects = projects.filter(p => !p.completed && !p.archived); if (!user || activeProjects.length <= 1) { alert(t('general.cannotDeleteLastProject')); return; } if (!window.confirm(t('general.deleteProjectConfirm'))) return; const batch = writeBatch(db); batch.delete(doc(db, 'users', user.uid, 'projects', projectIdToDelete)); tasks.filter(t => t.projectId === projectIdToDelete).forEach(task => batch.delete(doc(db, 'users', user.uid, 'tasks', task.id))); await batch.commit(); const remainingProjects = projects.filter(p => p.id !== projectIdToDelete); setProjects(remainingProjects); setTasks(tasks.filter(t => t.projectId !== projectIdToDelete)); setActiveProjectId(remainingProjects.find(p => !p.completed && !p.archived)?.id || null); setActiveTaskId(null); };
    const handleClearShowcase = async () => { if (!user || !window.confirm(t('general.clearShowcaseConfirm'))) return; const batch = writeBatch(db); projects.filter(p => p.completed).forEach(p => batch.delete(doc(db, 'users', user.uid, 'projects', p.id))); await batch.commit(); setProjects(projects.filter(p => !p.completed)); };
    const addTaskWithText = async (text, estimatedPomodoros = 1) => {
        const safeText = String(text || '').trim().slice(0, 200);
        if (!safeText || !user || !activeProjectId) return;
        const newTask = {
            text: safeText,
            projectId: activeProjectId,
            completed: false,
            estimatedPomodoros: Math.min(99, Math.max(1, Number(estimatedPomodoros) || 1)),
            pomodorosCompleted: 0,
            focusActive: true,
            createdAt: new Date()
        };
        const newDocRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), newTask);
        setTasks(current => [...current, { id: newDocRef.id, ...newTask }]);
    };
    const handleAddTask = async (estimatedPomodoros = 1) => {
        const text = taskInput.trim();
        if (!text) return;
        await addTaskWithText(text, estimatedPomodoros);
        setTaskInput('');
    };
    const handleDeleteTask = async (taskId) => { 
      if (!user) return; 
      if (taskId === activeTaskId) { setActiveTaskId(null); } 
      
      // Görevi tamamlandı olarak işaretle
      const taskToComplete = tasks.find(t => t.id === taskId);
      if (taskToComplete) {
        await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
          ...taskToComplete,
          completed: true,
          completedAt: new Date(),
          actualPomodoros: taskToComplete.pomodorosCompleted || 0
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
        if (newMode === 'pomodoro') setFocusSession(emptyFocusSession());
        
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
            if (
                userSettings.notifications &&
                userSettings.notificationTypes.roomStarted
            ) showDesktopNotification(t('notifications.roomStarted'), 'pomofree-room');
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

    const handleAnonymousRoomJoin = async () => {
        const roomId = await findAnonymousRoom(t('studyRoom.openFocusName'));
        navigate(`/room/${roomId}`);
        return roomId;
    };
    const closeModal = () => { setModalOpen(null); };
    
    const handleSaveSettings = async () => {
        const settings = {
            ...DEFAULT_FOCUS_SETTINGS,
            ...tempSettings,
            shortcuts: {
                ...DEFAULT_FOCUS_SETTINGS.shortcuts,
                ...(tempSettings.shortcuts || {})
            }
        };
        if (settings.notifications && 'Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        setUserSettings(settings);
        updateUserDataInDb({ settings });
        closeModal(); 
        resetTimer(settings.pomodoro * 60);
        setMode('pomodoro');
    };
    
    const toggleTimer = () => {
        if (!isTimerActive && mode === 'pomodoro' && userSettings.goalRequired && !focusSession.completionCriterion.trim()) {
            alert(t('timer.goalRequiredAlert'));
            return;
        }

        // Ses kilidini aç
        unlockAudio();
        if (!isTimerActive && mode === 'pomodoro') {
            setFocusSession(current => ({
                ...current,
                startedAt: current.startedAt || new Date()
            }));
        }
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

    const handleEmergencyStart = () => {
        unlockAudio();
        setMode('pomodoro');
        resetTimer(userSettings.emergencyMinutes * 60);
        setFocusSession(current => ({
            ...current,
            type: 'short-start',
            startedAt: new Date()
        }));
        startTimer();
    };

    const saveAdaptiveDecision = decision => {
        setAdaptiveDecision(decision);
        updateUserDataInDb({ adaptiveDecision: decision }).catch(() => {});
    };

    const handleAdaptiveSuggestion = suggestion => {
        const decision = {
            status: 'accepted',
            recommendedMinutes: suggestion.recommendedMinutes,
            scope: suggestion.scope,
            decidedAt: new Date().toISOString()
        };
        resetTimer(suggestion.recommendedMinutes * 60);
        setFocusSession(current => ({
            ...current,
            type: 'custom',
            startedAt: null,
            adaptiveRecommendation: {
                ...decision,
                accepted: true
            }
        }));
        saveAdaptiveDecision(decision);
    };

    const handleRejectAdaptiveSuggestion = suggestion => {
        saveAdaptiveDecision({
            status: 'rejected',
            recommendedMinutes: suggestion.recommendedMinutes,
            scope: suggestion.scope,
            decidedAt: new Date().toISOString()
        });
    };

    const handleInterruption = () => {
        if (!isTimerActive) return;
        if (userSettings.interruptionAction === 'pause') stopTimer();
        if (
            userSettings.interruptionAction === 'ask' &&
            window.confirm(t('focus.pauseAfterInterruption'))
        ) stopTimer();
    };

    const handleReviewSubmit = async review => {
        if (!user || !pendingReview) return;
        try {
            await updateDoc(
                doc(db, 'users', user.uid, 'focusSessions', pendingReview.id),
                {
                    completionStatus: review.completionStatus,
                    review: {
                        focus: review.focus,
                        difficulty: review.difficulty,
                        energy: review.energy,
                        note: review.note
                    }
                }
            );
            setRecentSessions(current => current.map(session => (
                session.id === pendingReview.id
                    ? { ...session, completionStatus: review.completionStatus, review }
                    : session
            )));
        } catch {
            alert(t('focus.reviewSaveError'));
        } finally {
            setPendingReview(null);
        }
    };

    const handleReviewContinue = option => {
        const minutes = option === 'normal' ? userSettings.pomodoro : option;
        const nextType = option === 'normal' ? 'pomodoro' : 'short-start';
        const previousGoal = pendingReview?.completionCriterion || '';
        setPendingReview(null);
        resetTimer(minutes * 60);
        setMode('pomodoro');
        setFocusSession({
            ...emptyFocusSession(),
            type: nextType,
            completionCriterion: previousGoal,
            startedAt: new Date()
        });
        startTimer();
    };

    const adaptiveSuggestion = userSettings.adaptiveSuggestions
        ? getAdaptiveSuggestion(recentSessions, userSettings.pomodoro, {
            taskId: activeTaskId,
            projectId: activeProjectId,
            lastDecision: adaptiveDecision,
            frequency: userSettings.adaptiveFrequency
        })
        : null;
    const breakTip = userSettings.breakTips
        ? t(getBreakTip({
            hour: new Date().getHours(),
            completedPomodoros: stats.completedPomodoros,
            energy: recentSessions[recentSessions.length - 1]?.review?.energy,
            hasNextTask: Boolean(activeTaskId),
            categories: userSettings.breakCategories
        }))
        : null;
    const activeProject = projects.find(project => project.id === activeProjectId) || null;

    useEffect(() => {
        const handleShortcut = event => {
            const target = event.target;
            const typing = target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target?.isContentEditable;

            if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
                event.preventDefault();
                setIsCommandPaletteOpen(true);
                return;
            }
            if (event.key === 'Escape') {
                setModalOpen(null);
                setIsCommandPaletteOpen(false);
                setIsMixerOpen(false);
                return;
            }
            if (typing || !userSettings.shortcutsEnabled) return;
            if (event.code === 'Space') {
                event.preventDefault();
                toggleTimer();
                return;
            }

            const key = event.key.toLocaleLowerCase();
            if (key === userSettings.shortcuts.task) document.getElementById('task-input')?.focus();
            if (key === userSettings.shortcuts.project) document.getElementById('project-select')?.focus();
            if (key === userSettings.shortcuts.taskSelect) document.querySelector('.task-item')?.focus();
            if (key === userSettings.shortcuts.distraction) {
                window.dispatchEvent(new CustomEvent('pomofree:focus-tool', { detail: 'distraction' }));
            }
            if (key === userSettings.shortcuts.interruption) {
                window.dispatchEvent(new CustomEvent('pomofree:focus-tool', { detail: 'interruption' }));
            }
            if (key === userSettings.shortcuts.mixer) setIsMixerOpen(current => !current);
        };
        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    // toggleTimer is intentionally bound to the current render state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userSettings, isTimerActive, mode, focusSession.completionCriterion]);

    return (
        <div className={`app-container theme-${activeTheme}`}>
            <Header user={user} openModal={openModal} handleLogout={handleLogout} />
            <StudyWithMeButton onCreateRoom={handleCreateRoom} activeTheme={activeTheme} />
            {user && <ProjectShowcase completedProjects={projects.filter(p => p.completed)} handleClearShowcase={handleClearShowcase} />}
            <div className="main-content">
                <Timer
                    mode={mode}
                    time={time}
                    isActive={isTimerActive}
                    switchMode={switchMode}
                    toggleTimer={toggleTimer}
                    formatTime={formatTime}
                    totalTime={timerTotalTime}
                    sessionGoal={focusSession.completionCriterion}
                    setSessionGoal={value => setFocusSession(current => ({
                        ...current,
                        completionCriterion: value
                    }))}
                    goalRequired={userSettings.goalRequired}
                    onEmergencyStart={handleEmergencyStart}
                    adaptiveSuggestion={adaptiveSuggestion}
                    onAcceptSuggestion={handleAdaptiveSuggestion}
                    onRejectSuggestion={handleRejectAdaptiveSuggestion}
                />
                {user && activeProjectId && (<Tasks tasks={tasks.filter(isFocusTask)} projects={projects} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} handleAddProject={handleAddProject} handleCompleteProject={handleCompleteProject} handleDeleteProject={handleDeleteProject} taskInput={taskInput} setTaskInput={setTaskInput} handleAddTask={handleAddTask} handleDeleteTask={handleDeleteTask} activeTaskId={activeTaskId} setActiveTaskId={setActiveTaskId} userSettings={userSettings} />)}
            </div>
            {user && (
                <FocusTools
                    mode={mode}
                    isActive={isTimerActive}
                    session={focusSession}
                    onChange={setFocusSession}
                    onConvertToTask={text => addTaskWithText(text, 1)}
                    onInterruption={handleInterruption}
                    onOpenMixer={() => setIsMixerOpen(true)}
                    breakTip={breakTip}
                />
            )}
            <PatreonSupport />
            {user && <WeeklyStats todaySeconds={todayFocusTime} totalSeconds={weeklyFocusTime} />}
            {modalOpen === 'themes' && <ThemeSelector closeModal={closeModal} handleThemeChange={handleThemeChange} />}
            {modalOpen === 'login' && <LoginModal closeModal={closeModal} isRegistering={isRegistering} setIsRegistering={setIsRegistering} email={email} setEmail={setEmail} password={password} setPassword={setPassword} username={username} setUsername={setUsername} handleRegister={handleRegister} handleLogin={handleLogin} handleGoogleSignIn={handleGoogleSignIn} handleTwitterSignIn={handleTwitterSignIn} />}
            {modalOpen === 'settings' && <SettingsModal closeModal={closeModal} tempSettings={tempSettings} setTempSettings={setTempSettings} handleSaveSettings={handleSaveSettings} handleExportData={handleExportData} handleDeleteAccount={handleDeleteAccount} />}
            {modalOpen === 'report' && ( <div className="modal-overlay" onClick={closeModal}><div className="modal-content" onClick={(e) => e.stopPropagation()}> <h2>{t('report.title')}</h2> <p>{t('report.completedPomodoros')}</p> <h3 style={{fontSize: '3em', textAlign: 'center', margin: '1rem 0'}}>{stats.completedPomodoros}</h3> <button onClick={closeModal} className="btn btn-secondary">{t('report.close')}</button> </div></div> )}
            {modalOpen === 'advanced-reports' && <AdvancedReports user={user} closeModal={closeModal} />}
            {modalOpen === 'dashboard' && <ProductivityDashboard user={user} closeModal={closeModal} />}
            {showCelebration && <Celebration onComplete={handleCelebrationComplete} />}
            {pendingReview && (
                <SessionReviewModal
                    session={pendingReview}
                    onSubmit={handleReviewSubmit}
                    onSkip={() => setPendingReview(null)}
                    onContinue={handleReviewContinue}
                />
            )}
            <FocusSoundMixer
                isOpen={isMixerOpen}
                onClose={() => setIsMixerOpen(false)}
                projectId={activeProject?.id}
                isFocusActive={mode === 'pomodoro' && isTimerActive}
            />
            {isCommandPaletteOpen && (
                <CommandPalette
                    onClose={() => setIsCommandPaletteOpen(false)}
                    actions={[
                        { id: 'timer', icon: '◷', label: isTimerActive ? t('timer.stop') : t('timer.start'), shortcut: 'Space', run: toggleTimer },
                        { id: 'task', icon: '＋', label: t('tasks.addTask'), shortcut: userSettings.shortcuts.task.toUpperCase(), run: () => document.getElementById('task-input')?.focus() },
                        { id: 'distraction', icon: '◇', label: t('focus.thoughtParking'), shortcut: userSettings.shortcuts.distraction.toUpperCase(), run: () => window.dispatchEvent(new CustomEvent('pomofree:focus-tool', { detail: 'distraction' })) },
                        { id: 'interruption', icon: '!', label: t('focus.interrupted'), shortcut: userSettings.shortcuts.interruption.toUpperCase(), run: () => window.dispatchEvent(new CustomEvent('pomofree:focus-tool', { detail: 'interruption' })) },
                        { id: 'mixer', icon: '♪', label: t('focus.sounds'), shortcut: userSettings.shortcuts.mixer.toUpperCase(), run: () => setIsMixerOpen(true) },
                        { id: 'todo', icon: '✓', label: t('header.todo'), run: () => navigate('/todo') },
                        { id: 'reports', icon: '▦', label: t('header.advancedReports'), run: () => openModal('advanced-reports') }
                    ]}
                />
            )}

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
                    onJoinAnonymousRoom={handleAnonymousRoomJoin}
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
            {showSupport && <SupportModal onClose={handleCloseSupport} />}
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
            <Route path="/todo" element={<TodoPage />} />
          </Routes>
        </StudyRoomProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
