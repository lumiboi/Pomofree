import React, { useEffect } from 'react';

const birdSoundUrl = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/10558/birds.mp3';

const Celebration = ({ onComplete }) => {
  useEffect(() => {
    // Sesi doğrudan bu bileşen içinde oluşturup çal
    const audio = new Audio(birdSoundUrl);
    audio.play().catch(error => {
      console.warn("Otomatik ses çalma tarayıcı tarafından engellendi. Bu normal bir durum.", error);
    });

    const timer = setTimeout(() => {
      onComplete();
    }, 6000); // 6 saniye

    return () => {
      clearTimeout(timer);
      // Sesi durdur ve kaynakları temizle
      audio.pause();
      audio.src = '';
    };
  }, [onComplete]);

  return (
    <div className="celebration-overlay">
      <div className="celebration-text">Darlangıç kuşu çağırıyor...</div>
      
      <div className="bird-container">
        <div className="bird"></div>
        <div className="bird"></div>
        <div className="bird"></div>
        <div className="bird"></div>
        <div className="bird"></div>
        <div className="bird"></div>
      </div>
    </div>
  );
};

export default Celebration;