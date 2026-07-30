import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  AppState,
  Platform,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useTimer } from './hooks/useTimer';
import { useTasks } from './hooks/useTasks';
import { useProjects } from './hooks/useProjects';

// Components
import { TaskManager } from './components/TaskManager';

// Types
import { TimerSettings, User } from './types';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const DEFAULT_SETTINGS: TimerSettings = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

export default function App() {
  // Auth state
  const { user, loading: authLoading, login, register, logout, signInWithGoogle } = useAuth();
  
  // Settings state
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  
  // Timer state
  const {
    timerState,
    isFinished,
    startTimer,
    stopTimer,
    resetTimer,
    switchMode,
    toggleTimer,
    clearFinished,
    formatTime,
    getProgress,
    scheduleBackgroundNotification,
  } = useTimer(settings);

  // Projects and tasks
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    addProject,
    completeProject,
    deleteProject,
    clearCompletedProjects,
  } = useProjects(user);

  const {
    tasks,
    addTask,
    deleteTask,
    incrementTaskPomodoro,
  } = useTasks(user, activeProjectId);

  // UI state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Theme colors based on mode
  const getModeColors = () => {
    switch (timerState.mode) {
      case 'pomodoro': return ['#FF6B6B', '#FF5722'];
      case 'short': return ['#4ECDC4', '#26A69A'];
      case 'long': return ['#45B7D1', '#2196F3'];
      default: return ['#FF6B6B', '#FF5722'];
    }
  };

  // Initialize app
  useEffect(() => {
    setupNotifications();
    loadUserSettings();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Load user settings
  const loadUserSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('user_settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
        setTempSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save user settings
  const saveUserSettings = async (newSettings: TimerSettings) => {
    try {
      await AsyncStorage.setItem('user_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Setup notifications
  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Bildirim İzni', 'Pomodoro bildirimleri için izin gerekli!');
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('pomodoro', {
        name: 'Pomodoro Timer',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
        sound: true,
      });
    }
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background' && timerState.isActive) {
      scheduleBackgroundNotification();
    } else if (nextAppState === 'active') {
      Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  // Handle timer completion
  useEffect(() => {
    if (isFinished) {
      handleTimerComplete();
    }
  }, [isFinished]);

  const handleTimerComplete = async () => {
    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Deactivate keep awake
    deactivateKeepAwake();

    // Show notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: timerState.mode === 'pomodoro' ? '🍅 Pomodoro Tamamlandı!' : '⏰ Mola Bitti!',
        body: timerState.mode === 'pomodoro' 
          ? `${timerState.completedPomodoros}. pomodoro tamamlandı! Harika iş!` 
          : 'Mola sona erdi. Yeni pomodoro başlatmaya hazır mısın?',
        sound: true,
      },
      trigger: null,
    });

    // Increment task pomodoro count
    if (timerState.mode === 'pomodoro' && activeTaskId) {
      await incrementTaskPomodoro(activeTaskId);
    }

    // Show completion dialog
    if (timerState.mode === 'pomodoro') {
      Alert.alert(
        '🍅 Pomodoro Tamamlandı!',
        `${timerState.completedPomodoros}. pomodoro tamamlandı! Ne yapmak istiyorsunuz?`,
        [
          {
            text: 'Kısa Mola (5dk)',
            onPress: () => {
              switchMode('short');
              clearFinished();
            },
          },
          {
            text: 'Uzun Mola (15dk)',
            onPress: () => {
              switchMode('long');
              clearFinished();
            },
          },
          {
            text: 'Devam Et',
            onPress: () => {
              clearFinished();
            },
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert(
        '⏰ Mola Bitti!',
        'Mola zamanı sona erdi. Yeni bir pomodoro başlatmaya hazır mısın?',
        [
          {
            text: 'Pomodoro Başlat',
            onPress: () => {
              switchMode('pomodoro');
              clearFinished();
            },
          },
          {
            text: 'Biraz Daha Bekle',
            onPress: () => {
              clearFinished();
            },
            style: 'cancel',
          },
        ]
      );
    }
  };

  // Keep awake when timer is active
  useEffect(() => {
    if (timerState.isActive) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
  }, [timerState.isActive]);

  // Auth handlers
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli!');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } else {
      Alert.alert('Giriş Hatası', result.error);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      Alert.alert('Hata', 'Tüm alanlar gerekli!');
      return;
    }

    const result = await register(email, password, displayName);
    if (result.success) {
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
      setDisplayName('');
    } else {
      Alert.alert('Kayıt Hatası', result.error);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      setShowLoginModal(false);
    } else {
      Alert.alert('Google Giriş Hatası', result.error);
    }
  };

  // Settings handlers
  const handleSaveSettings = async () => {
    await saveUserSettings(tempSettings);
    setShowSettingsModal(false);
    
    // Reset timer if not active
    if (!timerState.isActive) {
      await resetTimer();
    }
  };

  const progress = getProgress();
  const modeColors = getModeColors();

  if (authLoading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>🍅 Pomofree</Text>
            <View style={styles.headerButtons}>
              {user ? (
                <>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setShowStatsModal(true)}
                  >
                    <Ionicons name="bar-chart" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setShowSettingsModal(true)}
                  >
                    <Ionicons name="settings" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => {
                      Alert.alert(
                        'Çıkış Yap',
                        'Çıkış yapmak istediğinizden emin misiniz?',
                        [
                          { text: 'İptal', style: 'cancel' },
                          { text: 'Çıkış Yap', onPress: logout },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="log-out" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => setShowLoginModal(true)}
                >
                  <Text style={styles.loginButtonText}>Giriş Yap</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* User Stats */}
          {user && (
            <View style={styles.statsContainer}>
              <Text style={styles.welcomeText}>
                Hoş geldin, {user.displayName || 'Kullanıcı'}!
              </Text>
              <Text style={styles.statsText}>
                Bugün {timerState.completedPomodoros} pomodoro tamamladın 🍅
              </Text>
            </View>
          )}

          {/* Mode Selector */}
          <View style={styles.modeContainer}>
            {(['pomodoro', 'short', 'long'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  timerState.mode === mode && { backgroundColor: modeColors[0] },
                ]}
                onPress={() => switchMode(mode)}
                disabled={timerState.isActive}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    timerState.mode === mode && styles.activeModeButtonText,
                  ]}
                >
                  {mode === 'pomodoro' ? 'Pomodoro' : mode === 'short' ? 'Kısa Mola' : 'Uzun Mola'}
                </Text>
                <Text
                  style={[
                    styles.modeTime,
                    timerState.mode === mode && styles.activeModeTime,
                  ]}
                >
                  {formatTime(settings[mode])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <View style={styles.progressRing}>
              <View style={styles.progressBackground} />
              <View
                style={[
                  styles.progressIndicator,
                  {
                    borderColor: modeColors[0],
                    transform: [{ rotate: `${-90 + (progress * 3.6)}deg` }],
                  },
                ]}
              />
            </View>
            
            <View style={styles.timerTextContainer}>
              <Text style={styles.timerText}>{formatTime(timerState.time)}</Text>
              <Text style={styles.modeText}>
                {timerState.mode === 'pomodoro' 
                  ? 'Odaklanma Zamanı' 
                  : timerState.mode === 'short' 
                    ? 'Kısa Mola' 
                    : 'Uzun Mola'}
              </Text>
              {activeTaskId && (
                <Text style={styles.activeTaskText}>
                  🎯 {tasks.find(t => t.id === activeTaskId)?.text}
                </Text>
              )}
            </View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: timerState.isActive ? '#F39C12' : modeColors[0] },
              ]}
              onPress={toggleTimer}
            >
              <Ionicons
                name={timerState.isActive ? 'pause' : 'play'}
                size={32}
                color="white"
              />
              <Text style={styles.primaryButtonText}>
                {timerState.isActive ? 'Durdur' : 'Başlat'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={resetTimer}>
              <Ionicons name="refresh" size={24} color="#8E8E93" />
              <Text style={styles.secondaryButtonText}>Sıfırla</Text>
            </TouchableOpacity>
          </View>

          {/* Task Manager */}
          {user && activeProjectId && (
            <TaskManager
              tasks={tasks}
              projects={projects}
              activeProjectId={activeProjectId}
              activeTaskId={activeTaskId}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
              onSetActiveTask={setActiveTaskId}
              onSetActiveProject={setActiveProjectId}
              onAddProject={addProject}
              onCompleteProject={completeProject}
              onDeleteProject={deleteProject}
            />
          )}

          {/* Completed Projects */}
          {user && projects.filter(p => p.completed).length > 0 && (
            <View style={styles.completedProjectsContainer}>
              <View style={styles.completedProjectsHeader}>
                <Text style={styles.sectionTitle}>🏆 Tamamlanan Projeler</Text>
                <TouchableOpacity onPress={clearCompletedProjects}>
                  <Text style={styles.clearButton}>Temizle</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {projects.filter(p => p.completed).map(project => (
                  <View key={project.id} style={styles.completedProjectChip}>
                    <Text style={styles.completedProjectText}>{project.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Login Modal */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isRegistering ? 'Hesap Oluştur' : 'Giriş Yap'}
            </Text>
            
            {isRegistering && (
              <TextInput
                style={styles.input}
                placeholder="Adınız"
                value={displayName}
                onChangeText={setDisplayName}
                placeholderTextColor="#666"
              />
            )}
            
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#666"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#666"
            />
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={isRegistering ? handleRegister : handleLogin}
            >
              <Text style={styles.modalButtonText}>
                {isRegistering ? 'Hesap Oluştur' : 'Giriş Yap'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
              <Text style={styles.googleButtonText}>Google ile Giriş</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setIsRegistering(!isRegistering)}
            >
              <Text style={styles.switchText}>
                {isRegistering 
                  ? 'Zaten hesabın var mı? Giriş yap' 
                  : 'Hesabın yok mu? Hesap oluştur'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLoginModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚙️ Ayarlar</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Pomodoro (dakika)</Text>
              <TextInput
                style={styles.settingInput}
                value={String(Math.floor(tempSettings.pomodoro / 60))}
                onChangeText={(text) => 
                  setTempSettings(prev => ({ 
                    ...prev, 
                    pomodoro: parseInt(text) * 60 || 25 * 60 
                  }))
                }
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Kısa Mola (dakika)</Text>
              <TextInput
                style={styles.settingInput}
                value={String(Math.floor(tempSettings.short / 60))}
                onChangeText={(text) => 
                  setTempSettings(prev => ({ 
                    ...prev, 
                    short: parseInt(text) * 60 || 5 * 60 
                  }))
                }
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Uzun Mola (dakika)</Text>
              <TextInput
                style={styles.settingInput}
                value={String(Math.floor(tempSettings.long / 60))}
                onChangeText={(text) => 
                  setTempSettings(prev => ({ 
                    ...prev, 
                    long: parseInt(text) * 60 || 15 * 60 
                  }))
                }
                keyboardType="number-pad"
              />
            </View>
            
            <TouchableOpacity style={styles.modalButton} onPress={handleSaveSettings}>
              <Text style={styles.modalButtonText}>Kaydet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setTempSettings(settings);
                setShowSettingsModal(false);
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal
        visible={showStatsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 İstatistikler</Text>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{timerState.completedPomodoros}</Text>
              <Text style={styles.statLabel}>Bugün Tamamlanan Pomodoro</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{projects.filter(p => p.completed).length}</Text>
              <Text style={styles.statLabel}>Tamamlanan Proje</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{tasks.length}</Text>
              <Text style={styles.statLabel}>Aktif Görev</Text>
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStatsModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  loginButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsText: {
    color: '#4ECDC4',
    fontSize: 16,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 5,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    alignItems: 'center',
  },
  modeButtonText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  activeModeButtonText: {
    color: '#FFFFFF',
  },
  modeTime: {
    color: '#666',
    fontSize: 11,
  },
  activeModeTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressRing: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressIndicator: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#FF6B6B',
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modeText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 5,
  },
  activeTaskText: {
    fontSize: 14,
    color: '#4ECDC4',
    textAlign: 'center',
    maxWidth: 200,
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 15,
    minWidth: 200,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedProjectsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  completedProjectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearButton: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  completedProjectChip: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  completedProjectText: {
    color: '#4ECDC4',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a3e',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  modalButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    color: '#4ECDC4',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  settingInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});