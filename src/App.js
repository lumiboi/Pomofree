import { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc, addDoc, deleteDoc, writeBatch, query, where, Timestamp } from 'firebase/firestore';
import { themes } from './themes';

import Header from './components/Header';
import Timer from './components/Timer';
import Tasks from './components/Tasks';
import LoginModal from './components/LoginModal';
import ThemeSelector from './components/ThemeSelector';
import ProjectShowcase from './components/ProjectShowcase';
import SettingsModal from './components/SettingsModal';
import Celebration from './components/Celebration';
import WeeklyStats from './components/WeeklyStats';

function App() {
    const [user, setUser] = useState(null);
    const [mode, setMode] = useState('pomodoro');
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [taskInput, setTaskInput] = useState('');
    const [modalOpen, setModalOpen] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [userSettings, setUserSettings] = useState({ pomodoro: 25, short: 5, long: 15 });
    const [tempSettings, setTempSettings] = useState({ pomodoro: 25, short: 5, long: 15 });
    const [stats, setStats] = useState({ completedPomodoros: 0 });
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [activeTheme, setActiveTheme] = useState('default');
    const [showCelebration, setShowCelebration] = useState(false);
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    const [weeklyFocusTime, setWeeklyFocusTime] = useState(0);

    const getStartOfWeek = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) { setUser(currentUser); fetchUserData(currentUser.uid); } 
            else { setUser(null); setTasks([]); setProjects([]); setActiveProjectId(null); setUserSettings({ pomodoro: 25, short: 5, long: 15 }); setStats({ completedPomodoros: 0 }); setActiveTheme('default'); setWeeklyFocusTime(0); }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let interval = null;
        if (isActive && time > 0) {
            interval = setInterval(() => setTime(prevTime => prevTime - 1), 1000);
        } else if (time === 0 && isActive) {
            setIsActive(false);
            if (mode === 'pomodoro') {
                setShowCelebration(true);
                const newStats = { completedPomodoros: stats.completedPomodoros + 1 };
                setStats(newStats);
                if(user) {
                    updateUserDataInDb({ stats: newStats });
                    logFocusSession();
                }
            } else {
                alert("Mola bitti!");
            }
        }
        return () => clearInterval(interval);
    }, [isActive, time, mode, user, stats]);

    useEffect(() => {
        const currentTheme = themes[activeTheme].colors;
        const root = document.documentElement;
        Object.keys(currentTheme).forEach(key => { root.style.setProperty(key, currentTheme[key]); });
        document.body.style.backgroundColor = currentTheme[`--bg-color-${mode}`];
    }, [activeTheme, mode]);
    
    const requestNotificationPermission = async () => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
        try { await Notification.requestPermission(); } 
        catch (error) { console.error("Bildirim izni istenirken hata oluştu:", error); }
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
            setUserSettings(settings); setTempSettings(settings);
            setStats(data.stats || { completedPomodoros: 0 });
            setTime(settings.pomodoro * 60);
            setActiveTheme(data.theme || 'default');
        }
        const projectsColRef = collection(db, 'users', uid, 'projects');
        const projectsSnapshot = await getDocs(projectsColRef);
        let projectsList = projectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (projectsList.length === 0) {
            const defaultProject = { name: 'Genel', completed: false };
            const newProjectDoc = await addDoc(projectsColRef, defaultProject);
            projectsList = [{ id: newProjectDoc.id, ...defaultProject }];
        }
        setProjects(projectsList);
        const firstActiveProject = projectsList.find(p => !p.completed);
        setActiveProjectId(firstActiveProject ? firstActiveProject.id : null);
        const tasksColRef = collection(db, 'users', uid, 'tasks');
        const tasksSnapshot = await getDocs(tasksColRef);
        setTasks(tasksSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

        const startOfWeek = getStartOfWeek();
        const sessionsColRef = collection(db, 'users', uid, 'focusSessions');
        const q = query(sessionsColRef, where("completedAt", ">=", startOfWeek));
        const querySnapshot = await getDocs(q);
        let totalSeconds = 0;
        querySnapshot.forEach((doc) => { totalSeconds += doc.data().duration; });
        setWeeklyFocusTime(totalSeconds);
    };
    
    const updateUserDataInDb = async (dataToUpdate) => { if (!user) return; await setDoc(doc(db, 'users', user.uid), dataToUpdate, { merge: true }); };
    const handleRegister = async () => { if (!username.trim()) return alert("Lütfen bir kullanıcı adı girin."); try { const cred = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(cred.user, { displayName: username }); await setDoc(doc(db, 'users', cred.user.uid), { username }, { merge: true }); closeModal(); } catch (error) { alert(error.message); } };
    const handleLogin = async () => { try { await signInWithEmailAndPassword(auth, email, password); closeModal(); } catch (error) { alert(error.message); } };
    const handleLogout = () => { signOut(auth); };
    const handleGoogleSignIn = async () => { const provider = new GoogleAuthProvider(); try { const result = await signInWithPopup(auth, provider); await setDoc(doc(db, 'users', result.user.uid), { username: result.user.displayName }, { merge: true }); closeModal(); } catch (error) { alert(error.message); } };
    const handleThemeChange = async (themeKey) => { setActiveTheme(themeKey); if (user) await updateUserDataInDb({ theme: themeKey }); };
    const handleCompleteProject = async (projectIdToComplete) => { if (!user || projects.filter(p => !p.completed).length <= 1) { alert("Tek kalan aktif projeyi bitiremezsiniz."); return; } const batch = writeBatch(db); batch.update(doc(db, 'users', user.uid, 'projects', projectIdToComplete), { completed: true, completedAt: new Date() }); tasks.filter(t => t.projectId === projectIdToComplete).forEach(task => batch.delete(doc(db, 'users', user.uid, 'tasks', task.id))); await batch.commit(); const updatedProjects = projects.map(p => p.id === projectIdToComplete ? { ...p, completed: true } : p); setProjects(updatedProjects); setTasks(tasks.filter(t => t.projectId !== projectIdToComplete)); setActiveProjectId(updatedProjects.find(p => !p.completed)?.id || null); };
    const handleDeleteProject = async (projectIdToDelete) => { const activeProjects = projects.filter(p => !p.completed); if (!user || activeProjects.length <= 1) { alert("Son kalan aktif projeyi silemezsiniz."); return; } if (!window.confirm("Bu projeyi ve içindeki TÜM görevleri kalıcı olarak silmek istediğinizden emin misiniz?")) return; const batch = writeBatch(db); batch.delete(doc(db, 'users', user.uid, 'projects', projectIdToDelete)); tasks.filter(t => t.projectId === projectIdToDelete).forEach(task => batch.delete(doc(db, 'users', user.uid, 'tasks', task.id))); await batch.commit(); const remainingProjects = projects.filter(p => p.id !== projectIdToDelete); setProjects(remainingProjects); setTasks(tasks.filter(t => t.projectId !== projectIdToDelete)); setActiveProjectId(remainingProjects.find(p => !p.completed)?.id || null); };
    const handleClearShowcase = async () => { if (!user || !window.confirm("Emin misiniz? Biten tüm projeler kalıcı olarak silinecek.")) return; const batch = writeBatch(db); projects.filter(p => p.completed).forEach(p => batch.delete(doc(db, 'users', user.uid, 'projects', p.id))); await batch.commit(); setProjects(projects.filter(p => !p.completed)); };
    const handleAddTask = async () => { const text = taskInput.trim(); if (text && user && activeProjectId) { const newTask = { text, projectId: activeProjectId, completed: false }; const newDocRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), newTask); setTasks([...tasks, { id: newDocRef.id, ...newTask }]); setTaskInput(''); } };
    const handleDeleteTask = async (taskId) => { if (!user) return; await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId)); setTasks(tasks.filter(t => t.id !== taskId)); };
    const handleAddProject = async (projectName) => { if (!user) return; const newProject = { name: projectName, completed: false }; const newDocRef = await addDoc(collection(db, 'users', user.uid, 'projects'), newProject); const newProjectWithId = { id: newDocRef.id, ...newProject }; setProjects([...projects, newProjectWithId]); setActiveProjectId(newDocRef.id); };
    const switchMode = (newMode) => { setIsActive(false); setMode(newMode); setTime(userSettings[newMode] * 60); };
    const formatTime = (seconds) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };
    const handleKeyPress = (e) => e.key === 'Enter' && handleAddTask();
    const openModal = (modalName) => { if (modalName === 'settings') { setTempSettings(userSettings); } setModalOpen(modalName); };
    const closeModal = () => { setModalOpen(null); };
    const handleSaveSettings = () => { setUserSettings(tempSettings); updateUserDataInDb({ settings: tempSettings }); closeModal(); setIsActive(false); setMode('pomodoro'); setTime(tempSettings.pomodoro * 60); };
    
    const toggleTimer = () => {
        if (!isAudioUnlocked) {
            const dummyAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
            dummyAudio.play().catch(() => {});
            setIsAudioUnlocked(true);
        }
        
        const newIsActive = !isActive;
        setIsActive(newIsActive);

        if (newIsActive) {
            requestNotificationPermission();
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'START_TIMER',
                    duration: time,
                    mode: mode
                });
            }
        }
    };

    return (
        <div className="app-container">
            <Header user={user} openModal={openModal} handleLogout={handleLogout} />
            {user && <ProjectShowcase completedProjects={projects.filter(p => p.completed)} handleClearShowcase={handleClearShowcase} />}
            <div className="main-content">
                <Timer mode={mode} time={time} isActive={isActive} switchMode={switchMode} toggleTimer={toggleTimer} formatTime={formatTime} />
                {user && activeProjectId && (<Tasks tasks={tasks} projects={projects} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} handleAddProject={handleAddProject} handleCompleteProject={handleCompleteProject} handleDeleteProject={handleDeleteProject} taskInput={taskInput} setTaskInput={setTaskInput} handleAddTask={handleAddTask} handleDeleteTask={handleDeleteTask} handleKeyPress={handleKeyPress} />)}
            </div>
            
            {user && <WeeklyStats totalSeconds={weeklyFocusTime} />}

            {modalOpen === 'themes' && <ThemeSelector closeModal={closeModal} handleThemeChange={handleThemeChange} />}
            {modalOpen === 'login' && <LoginModal closeModal={closeModal} isRegistering={isRegistering} setIsRegistering={setIsRegistering} email={email} setEmail={setEmail} password={password} setPassword={setPassword} username={username} setUsername={setUsername} handleRegister={handleRegister} handleLogin={handleLogin} handleGoogleSignIn={handleGoogleSignIn} />}
            {modalOpen === 'settings' && <SettingsModal closeModal={closeModal} tempSettings={tempSettings} setTempSettings={setTempSettings} handleSaveSettings={handleSaveSettings} />}
            {modalOpen === 'report' && ( <div className="modal-overlay" onClick={closeModal}><div className="modal-content" onClick={(e) => e.stopPropagation()}> <h2>Rapor</h2> <p>Tamamlanan Pomodoro sayısı:</p> <h3 style={{fontSize: '3em', textAlign: 'center', margin: '1rem 0'}}>{stats.completedPomodoros}</h3> <button onClick={closeModal} className="btn btn-secondary">Kapat</button> </div></div> )}
            
            {showCelebration && <Celebration onComplete={() => setShowCelebration(false)} />}
        </div>
    );
}

export default App;