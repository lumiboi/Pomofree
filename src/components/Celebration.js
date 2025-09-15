import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Celebration = ({ onComplete }) => {
  const { t } = useTranslation();
  const onCompleteRef = useRef(onComplete);
  
  // onComplete'i ref'e güncelle
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 3500); // 3.5 saniye

    return () => {
      clearTimeout(timer);
    };
  }, []); // Sadece mount'ta çalışsın

  return (
    <div className="celebration-overlay">
      <div className="celebration-text">{t('celebration.birdCalling')}</div>
      <div className="bird-container">
        <div className="bird"></div><div className="bird"></div><div className="bird"></div>
        <div className="bird"></div><div className="bird"></div><div className="bird"></div>
      </div>
    </div>
  );
};

export default Celebration;