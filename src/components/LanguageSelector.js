import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      onClick={toggleLanguage} 
      className="btn btn-secondary language-selector"
      title={language === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
    >
      {language === 'tr' ? '🇹🇷 TR' : '🇺🇸 EN'}
    </button>
  );
};

export default LanguageSelector;


