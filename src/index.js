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

// Kod bölme sonrası eski bir sekme, yayından kalkmış bir parça isteyebilir.
// O durumda sayfa boş kalmasın diye bir kez tazeliyoruz.
const RELOAD_GUARD_KEY = 'pomofree_stale_reload';
const STALE_ASSET_PATTERN = /loading chunk|chunkloaderror|failed to fetch dynamically imported module|error loading css chunk/i;

const reloadOnceForStaleBuild = () => {
  try {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
  } catch {
    return;
  }
  window.location.reload();
};

window.addEventListener('error', event => {
  if (STALE_ASSET_PATTERN.test(event.message || '')) reloadOnceForStaleBuild();
});

window.addEventListener('unhandledrejection', event => {
  const reason = event.reason;
  const message = typeof reason === 'string' ? reason : reason?.message || '';
  if (STALE_ASSET_PATTERN.test(message)) reloadOnceForStaleBuild();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (process.env.NODE_ENV === 'production') {
      let reloading = false;
      // Yeni sürüm devralınca sayfayı bir kez tazele; eski kabuk asılı kalmasın.
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });

      navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' })
        .then(registration => registration.update().catch(() => {}))
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
