import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/service-worker.js')
        .catch(error => console.error('Çevrimdışı kullanım hazırlanamadı:', error));
      return;
    }

    Promise.all([
      navigator.serviceWorker.getRegistrations()
        .then(registrations => Promise.all(registrations.map(registration => registration.unregister()))),
      'caches' in window
        ? caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
        : Promise.resolve()
    ]).catch(error => console.error('Geliştirme önbelleği temizlenemedi:', error));
  });
}
