import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';

const Header = ({
  user,
  openModal,
  handleLogout,
  isRoomPage,
  onLeaveRoom,
  isTodoPage = false,
  isSocialPage = false
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  return (
    <header className="header-container">
      <h1>{t('general.appName')}</h1>
      <div className="header-buttons">
        {isRoomPage ? (
          // Room page - show language selector and leave room button
          <>
            <LanguageSelector />
            <button onClick={onLeaveRoom} className="btn btn-danger">
              {t('header.leaveRoom')}
            </button>
            {user && (
              <div className="user-menu" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  className="btn btn-primary"
                >
                  {user.displayName || user.email.split('@')[0]}
                </button>

                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <button onClick={handleLogout} className="dropdown-item">
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Normal page - show all menu items
          <>
            <LanguageSelector />
            {(isTodoPage || isSocialPage) && (
              <button onClick={() => navigate('/')} className="btn btn-secondary">{t('header.home')}</button>
            )}
            {!isTodoPage && (
              <button onClick={handleTodoClick} className="btn btn-secondary">{t('header.todo')}</button>
            )}
            {!isSocialPage && (
              <button onClick={handleSocialClick} className="btn btn-secondary">{t('header.social')}</button>
            )}
            <button onClick={() => openModal('themes')} className="btn btn-secondary">{t('header.themes')}</button>
            {!isTodoPage && !isSocialPage && (
              <>
                <button onClick={handleDashboardClick} className="btn btn-secondary">{t('header.dashboard')}</button>
                <button onClick={handleAdvancedReportsClick} className="btn btn-secondary">{t('header.advancedReports')}</button>
                <button onClick={() => openModal('report')} className="btn btn-secondary">{t('header.report')}</button>
                <button onClick={() => openModal('settings')} className="btn btn-secondary">{t('header.settings')}</button>
              </>
            )}
            
            {user ? (
              <div className="user-menu" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  className="btn btn-primary"
                >
                  {user.displayName || user.email.split('@')[0]}
                </button>

                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <button onClick={handleLogout} className="dropdown-item">
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => openModal('login')} className="btn btn-primary">{t('header.login')}</button>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
