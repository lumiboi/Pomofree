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

// PWA için Service Worker'ı kaydettiren kod
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker başarıyla kaydedildi: ', registration);
      })
      .catch(registrationError => {
        console.log('Service Worker kaydı başarısız oldu: ', registrationError);
      });
  });
}