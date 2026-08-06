import React from 'react';

/**
 * Beklenmedik bir hata bütün sayfayı boş bırakmasın; kullanıcı en azından
 * ne olduğunu görüp yeniden yükleyebilsin.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, message: '', stack: '' };
  }

  static getDerivedStateFromError(error) {
    return { failed: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    console.error('Beklenmedik hata:', error, info?.componentStack);
    this.setState({ stack: (info?.componentStack || '').split('\n').slice(0, 6).join('\n') });

    // Yayından kalkmış bir parça istendiyse React hatayı burada yutar;
    // pencere dinleyicisine düşmediği için tazelemeyi buradan tetikliyoruz.
    const stale = /loading chunk|chunkloaderror|failed to fetch dynamically imported module|error loading css chunk/i;
    if (!stale.test(error?.message || '')) return;
    try {
      if (sessionStorage.getItem('pomofree_stale_reload')) return;
      sessionStorage.setItem('pomofree_stale_reload', '1');
    } catch {
      return;
    }
    window.location.reload();
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="app-error card" role="alert">
        <h1>Bir şey ters gitti</h1>
        <p>Sayfayı yenilemek çoğu zaman yetiyor. Verilerin yerinde duruyor.</p>
        {/* Hatanın kendisi görünsün ki ekran görüntüsünden teşhis edilebilsin. */}
        <pre className="app-error-detail">{this.state.message}{this.state.stack ? `\n${this.state.stack}` : ''}</pre>
        <div className="app-error-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Sayfayı yenile
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              // Bozuk yerel durum çökmeye yol açıyorsa temiz bir başlangıç.
              try {
                ['pomofree_active_session_v2', 'pomofree_focus_flow_v1', 'pomofree_cat_panel_v1',
                  'pomofree_music_shortcut_pos_v1', 'pomofree_music_shortcut_open_v1']
                  .forEach(key => localStorage.removeItem(key));
              } catch {
                // Depolama kapalıysa yenilemek yine de denenir.
              }
              window.location.reload();
            }}
          >
            Yerel durumu sıfırla ve yenile
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
