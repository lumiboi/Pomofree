// Type definitions for the mobile app

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface TimerSettings {
  pomodoro: number;
  short: number;
  long: number;
}

export interface TimerState {
  time: number;
  totalTime: number;
  isActive: boolean;
  mode: 'pomodoro' | 'short' | 'long';
  completedPomodoros: number;
  startTime: number | null;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  projectId: string;
  pomodorosCompleted: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface UserStats {
  completedPomodoros: number;
  totalFocusTime: number;
  streak: number;
  longestStreak: number;
  achievementsUnlocked: number;
}

export interface StudySession {
  id: string;
  duration: number;
  mode: 'pomodoro' | 'short' | 'long';
  taskId?: string;
  projectId?: string;
  completedAt: Date;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
}

export interface StudyRoom {
  id: string;
  name: string;
  password?: string;
  participantCount: number;
  isActive: boolean;
  timer: {
    mode: 'pomodoro' | 'short' | 'long';
    timeLeft: number;
    isActive: boolean;
    startedAt: Date | null;
  };
}

