import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { safeProfilePhoto } from '../profilePhoto';
import LanguageSelector from './LanguageSelector';
import Icon from './Icon';

const Header = ({
  user,
  openModal,
  handleLogout,
  isRoomPage,
  onLeaveRoom,
  isTodoPage = false,
  isSocialPage = false,
  profilePhoto
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation?.() || { pathname: '/' };
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isPomocatAnimated, setIsPomocatAnimated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navRef = useRef(null);
  const displayName = user && (user.displayName || user.email.split('@')[0]);
  const profileSrc = safeProfilePhoto(profilePhoto !== undefined ? profilePhoto : user?.photoURL);

  useEffect(() => setImageFailed(false), [profileSrc]);

  const handleDashboardClick = () => {
    if (user) {
      openModal('dashboard');
    } else {
      alert(t('general.loginRequired'));
    }
  };

  const handleAdvancedReportsClick = () => {
    if (user) {
      openModal('advanced-reports');
    } else {
      alert(t('general.loginRequired'));
    }
  };

  const handleTodoClick = () => {
    if (user) navigate('/todo');
    else alert(t('general.loginRequired'));
  };

  const handleSocialClick = () => {
    navigate('/social');
  };

  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Mobil menü: dışarı tıklayınca ve Escape ile kapanır.
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const close = event => {
      if (!navRef.current?.contains(event.target) && !event.target.closest('.header-burger')) {
        setIsMenuOpen(false);
      }
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  const userMenu = user && (
    <div className="user-menu" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="btn btn-primary user-menu-trigger"
      >
        <span className="profile-avatar">
          {profileSrc && !imageFailed ? (
            <img
              src={profileSrc}
              alt={`${displayName} ${t('header.profilePhoto')}`}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>
          )}
        </span>
        <span>{displayName}</span>
      </button>

      {isDropdownOpen && (
        <div className="dropdown-menu">
          {/* Ayarlar ve dil, üst çubuğu şişirmesin diye profilin altında. */}
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              openModal('settings');
            }}
            className="dropdown-item"
          >
            {t('header.settings')}
          </button>
          <div className="dropdown-item dropdown-item-language">
            <span>{t('header.language')}</span>
            <LanguageSelector />
          </div>
          <button onClick={handleLogout} className="dropdown-item">
            {t('header.logout')}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
    <header className="header-container">
      <button
        type="button"
        className="header-brand"
        aria-label={t('general.appName')}
        onClick={() => navigate('/')}
      >
        <img
          className="pomocat-logo"
          src={isPomocatAnimated ? '/pomocat-animated.webp' : '/pomocat.png'}
          alt=""
          aria-hidden="true"
          draggable="false"
          onMouseEnter={() => setIsPomocatAnimated(true)}
          onMouseLeave={() => setIsPomocatAnimated(false)}
        />
        <h1>{t('general.appName')}</h1>
      </button>
      <nav
        id="header-nav"
        ref={navRef}
        className={`header-buttons${isMenuOpen ? ' is-open' : ''}`}
        // Menüden bir seçim yapılınca mobil çekmece kendiliğinden kapanır.
        onClick={event => {
          if (event.target.closest('button') && !event.target.closest('.user-menu')) {
            setIsMenuOpen(false);
          }
        }}
      >
        {isRoomPage ? (
          // Room page - show language selector and leave room button
          <>
            <LanguageSelector />
            <button onClick={onLeaveRoom} className="btn btn-danger">
              {t('header.leaveRoom')}
            </button>
            {userMenu}
          </>
        ) : (
          // Normal page - show all menu items
          <>
            {!user && <LanguageSelector />}
            {(isTodoPage || isSocialPage) && (
              <button onClick={() => navigate('/')} className="btn btn-secondary">{t('header.home')}</button>
            )}
            {!isTodoPage && (
              <button onClick={handleTodoClick} className="btn btn-secondary">{t('header.todo')}</button>
            )}
            {!isSocialPage && (
              <button onClick={handleSocialClick} className="btn btn-secondary">{t('header.social')}</button>
            )}
            <button onClick={() => navigate('/reflections')} className="btn btn-secondary">{t('header.reflections')}</button>
            <button onClick={() => navigate('/cat')} className="btn btn-secondary">{t('header.catRoom')}</button>
            <button onClick={() => openModal('themes')} className="btn btn-secondary">{t('header.themes')}</button>
            {isSocialPage && user && (
              <button onClick={() => openModal('social-settings')} className="btn btn-secondary">{t('social.settings')}</button>
            )}
            {!isTodoPage && !isSocialPage && (
              <>
                <button onClick={handleDashboardClick} className="btn btn-secondary">{t('header.dashboard')}</button>
                <button onClick={handleAdvancedReportsClick} className="btn btn-secondary">{t('header.advancedReports')}</button>
                <button onClick={() => openModal('report')} className="btn btn-secondary">{t('header.report')}</button>
                {!user && (
                  <button onClick={() => openModal('settings')} className="btn btn-secondary">{t('header.settings')}</button>
                )}
              </>
            )}
            
            {/* Telefonda yüzen kısayol yerine çalar menüden açılıyor. */}
            <button
              type="button"
              className="btn btn-secondary mobile-only-item"
              onClick={() => window.dispatchEvent(new CustomEvent('pomofree:open-music'))}
            >
              {t('musicPlayer.title')}
            </button>
            {user ? userMenu : (
              <button onClick={() => openModal('login')} className="btn btn-primary">{t('header.login')}</button>
            )}
          </>
        )}
      </nav>

      <button
        type="button"
        className="header-burger"
        aria-expanded={isMenuOpen}
        aria-controls="header-nav"
        aria-label={t(isMenuOpen ? 'header.closeMenu' : 'header.openMenu')}
        onClick={() => setIsMenuOpen(open => !open)}
      >
        <Icon name={isMenuOpen ? 'close' : 'menu'} size={22} />
      </button>
    </header>

    {/*
      Alt sekme çubuğu başlığın dışında duruyor: başlıktaki backdrop-filter,
      içindeki position:fixed öğeler için yeni bir referans kutusu yaratıp
      çubuğu başlığın üstüne bindiriyordu.
    */}
    {!isRoomPage && (
        <nav className="mobile-tabbar" aria-label={t('nav.tabbar')}>
          {[
            { path: '/', icon: 'timer', label: t('nav.timer') },
            { path: '/todo', icon: 'check', label: t('header.todo'), needsUser: true },
            { path: '/reflections', icon: 'pencil', label: t('header.reflections') },
            { path: '/cat', icon: 'cat', label: t('header.catRoom') }
          ].map(tab => (
            <button
              key={tab.path}
              type="button"
              className={`mobile-tab${location.pathname === tab.path ? ' is-active' : ''}`}
              aria-current={location.pathname === tab.path ? 'page' : undefined}
              onClick={() => {
                setIsMenuOpen(false);
                if (tab.needsUser && !user) {
                  alert(t('general.loginRequired'));
                  return;
                }
                navigate(tab.path);
              }}
            >
              <span className="mobile-tab-icon"><Icon name={tab.icon} size={20} /></span>
              <span className="mobile-tab-label">{tab.label}</span>
            </button>
          ))}
          <button
            type="button"
            className={`mobile-tab${isMenuOpen ? ' is-active' : ''}`}
            aria-expanded={isMenuOpen}
            aria-controls="header-nav"
            onClick={() => {
              setIsMenuOpen(open => !open);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="mobile-tab-icon"><Icon name="menu" size={20} /></span>
            <span className="mobile-tab-label">{t('nav.more')}</span>
          </button>
      </nav>
    )}
    </>
  );
};

export default Header;
