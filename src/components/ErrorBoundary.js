import React from 'react';

/**
 * Beklenmedik bir hata bütün sayfayı boş bırakmasın; kullanıcı en azından
 * ne olduğunu görüp yeniden yükleyebilsin.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Beklenmedik hata:', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="app-error card" role="alert">
        <h1>Bir şey ters gitti</h1>
        <p>Sayfayı yenilemek çoğu zaman yetiyor. Verilerin yerinde duruyor.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Sayfayı yenile
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
