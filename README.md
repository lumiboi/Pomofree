# 🍅 Pomofree - Advanced Pomodoro Timer & Productivity App

A comprehensive, feature-rich Pomodoro timer application built with React, featuring real-time collaboration, music integration, achievement system, and extensive customization options.

## ✨ Key Features

### 🎯 Core Pomodoro Functionality
- **Smart Timer System**: 25-minute Pomodoro, 5-minute short breaks, 15-minute long breaks
- **Background Timer**: Continues running even when the browser tab is not active
- **Visual Progress Ring**: Circular progress indicator with smooth animations
- **Auto Mode Switching**: Automatically transitions between work and break periods
- **Page Refresh Protection**: Warns users before refreshing during active timers

### 🎨 Extensive Theme System
- **12+ Beautiful Themes**: From classic blue to special themes like Synthwave, Dark Academia, and Gothic Core
- **Real-time Theme Switching**: Instant theme changes without page reload
- **Custom Color Schemes**: Each theme includes carefully crafted color palettes
- **Special Premium Themes**: Exclusive themes with unique visual styles

### 👥 Real-time Study Rooms
- **Study With Me**: Create or join study rooms for collaborative focus sessions
- **Synchronized Timers**: All participants share the same timer state
- **Room Management**: Create private rooms with custom settings
- **Popout Window**: Dedicated study room interface that can be popped out
- **Real-time Updates**: Live synchronization of timer states across all participants

### 🎵 Integrated Music Player
- **Multiple Playlists**: Jazz, Classical, Ambient, Lo-fi, and Nature sounds
- **YouTube Integration**: Custom URL support for personal music
- **Draggable Interface**: Move the music player anywhere on screen
- **Volume Control**: Adjustable volume with visual slider
- **Playlist Management**: Switch between different music categories
- **Minimizable Player**: Collapsible interface to save screen space

### 🏆 Achievement System
- **Progress Tracking**: Monitor your productivity milestones
- **Achievement Notifications**: Celebrate your accomplishments
- **Multiple Categories**: Focus time, Pomodoro completion, and consistency achievements
- **Visual Rewards**: Beautiful achievement cards and animations

### 📊 Advanced Analytics & Reports
- **Weekly Statistics**: Track your focus time and productivity trends
- **Productivity Dashboard**: Comprehensive overview of your work patterns
- **Advanced Reports**: Detailed analytics with charts and insights
- **Goal Setting**: Set and track daily, weekly, and monthly targets
- **Data Visualization**: Interactive charts and progress indicators

### 🌍 Multi-language Support
- **Turkish & English**: Full localization for both languages
- **Dynamic Language Switching**: Change language without page reload
- **Localized Content**: All UI elements, error messages, and notifications
- **Date & Time Formatting**: Proper localization for dates and times

### 🔐 Secure Authentication
- **Multiple Login Options**: Email/password, Google, and Twitter (X) authentication
- **Account Linking**: Seamlessly link accounts from different providers
- **Firebase Integration**: Secure user management and data storage
- **Session Management**: Persistent login sessions across browser sessions

### 📱 Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Gesture support for mobile devices
- **Adaptive Layout**: UI elements adjust based on screen size
- **Cross-Platform**: Works on desktop, tablet, and mobile devices

### 🎯 Task & Project Management
- **Project Organization**: Create and manage multiple projects
- **Task Tracking**: Add, complete, and delete tasks within projects
- **Pomodoro Integration**: Track Pomodoros per task
- **Project Showcase**: Display completed projects
- **Task Statistics**: Monitor task completion rates

### 🔧 Customization Options
- **Timer Settings**: Adjustable Pomodoro, short break, and long break durations
- **User Preferences**: Personalized settings saved to your account
- **Theme Persistence**: Your chosen theme is saved across sessions
- **Notification Settings**: Customizable sound and visual notifications

### 🎉 Celebration & Motivation
- **Completion Celebrations**: Animated celebrations when completing Pomodoros
- **Progress Milestones**: Special animations for significant achievements
- **Motivational Elements**: Encouraging messages and visual feedback
- **Weekly Focus Tracking**: Monitor your weekly productivity goals

### 📄 Legal & Compliance
- **Terms of Service**: Comprehensive terms and conditions
- **Privacy Policy**: Detailed privacy policy and data handling
- **GDPR Compliance**: User data protection and privacy controls
- **Transparent Policies**: Clear information about data usage

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project (for authentication and data storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pomofree.git
   cd pomofree
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password, Google, Twitter)
   - Create a Firestore database
   - Copy your Firebase configuration to `src/firebase.js`

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Firebase Configuration

Create a `src/firebase.js` file with your Firebase configuration:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase configuration
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 🛠️ Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## 🎨 Theme Customization

The app includes 12+ pre-built themes. To add a new theme, edit `src/themes.js`:

```javascript
export const themes = {
  yourTheme: {
    name: "Your Theme Name",
    colors: {
      "--bg-color-pomodoro": "#your-color",
      "--bg-color-short": "#your-color",
      "--bg-color-long": "#your-color",
      // ... other color variables
    }
  }
};
```

## 🌐 Internationalization

To add a new language, edit `src/translations/index.js`:

```javascript
export const translations = {
  yourLanguage: {
    'timer.pomodoro': 'Your Translation',
    // ... other translations
  }
};
```

## 📱 Progressive Web App

Pomofree is a PWA (Progressive Web App) that can be installed on mobile devices and desktop computers for a native app experience.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛠️ Technologies Used

### **Frontend Framework & Core**
- **React 19.1.1** - Main UI framework
- **React DOM 19.1.1** - DOM rendering
- **React Router DOM 7.9.1** - Client-side routing
- **Create React App** - Development environment

### **Backend & Database**
- **Firebase 12.1.0** - Authentication, Firestore database, hosting
- **Firebase Auth** - Google, Twitter, Email/Password authentication
- **Firebase Firestore** - NoSQL database for user data

### **Real-time Communication**
- **Socket.io-client 4.8.1** - Real-time study room synchronization
- **Agora RTC SDK 4.24.0** - Video/audio communication for study rooms
- **Agora React UIKit 1.2.0** - React components for Agora
- **Simple-peer 9.11.1** - WebRTC peer-to-peer connections

### **Data Visualization & Charts**
- **Chart.js 4.5.0** - Chart library for analytics
- **React-chartjs-2 5.3.0** - React wrapper for Chart.js

### **Date & Time Handling**
- **date-fns 4.1.0** - Date manipulation and formatting
- **date-fns locales** - Turkish and English localization

### **Utilities & Testing**
- **UUID 13.0.0** - Unique identifier generation
- **Web-vitals 2.1.4** - Performance monitoring
- **@testing-library/react** - Component testing
- **@testing-library/jest-dom** - Jest DOM matchers
- **@testing-library/user-event** - User interaction testing

### **External APIs & Services**
- **Google OAuth** - Google authentication
- **Twitter OAuth** - Twitter (X) authentication
- **YouTube API** - Music player integration
- **Google AdSense** - Advertisement integration
- **Agora.io** - Video/audio communication

### **Frontend Technologies**
- **CSS3** - Custom styling with CSS variables
- **CSS Grid & Flexbox** - Layout system
- **CSS Animations** - Smooth transitions and effects
- **Responsive Design** - Mobile-first approach
- **Progressive Web App (PWA)** - Offline functionality

### **Development Tools**
- **Webpack** - Module bundling
- **Babel** - JavaScript transpilation
- **ESLint** - Code linting
- **Git** - Version control
- **Firebase Hosting** - Static site hosting

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS)
- Backend powered by [Firebase](https://firebase.google.com/)
- Real-time features with [Socket.io](https://socket.io/) and [Agora](https://www.agora.io/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Music integration with [YouTube API](https://developers.google.com/youtube)
- Icons from [Heroicons](https://heroicons.com/)

## 📞 Support

For support, email support@pomofree.com or join our Discord community.

---

**Made with ❤️ by [Lumi](https://codedbylumi.com)**

*Focus better, achieve more! 🍅*
