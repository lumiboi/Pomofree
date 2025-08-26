import React, { useState, useEffect, useRef } from 'react';

const Header = ({ user, openModal, handleLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
      <h1>Pomofree</h1>
      <div className="header-buttons">
        <button onClick={() => openModal('themes')} className="btn btn-secondary">Temalar</button>
        <button onClick={() => openModal('report')} className="btn btn-secondary">Rapor</button>
        <button onClick={() => openModal('settings')} className="btn btn-secondary">Ayarlar</button>
        
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
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => openModal('login')} className="btn btn-primary">Giriş Yap</button>
        )}
      </div>
    </header>
  );
};

export default Header;