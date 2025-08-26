import React from 'react';

const formatFocusTime = (totalSeconds) => {
  // YENİ: Süre sıfır ise "0 dakika" yaz
  if (totalSeconds === 0) return "0 dakika";
  
  if (totalSeconds < 60) return "1 dakikadan az";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let result = '';
  if (hours > 0) {
    result += `${hours} saat `;
  }
  if (minutes > 0) {
    result += `${minutes} dakika`;
  }
  
  return result.trim();
};

const WeeklyStats = ({ totalSeconds }) => {
  return (
    <div className="weekly-stats-container">
      Bu hafta <strong>{formatFocusTime(totalSeconds)}</strong> odaklandın
    </div>
  );
};

export default WeeklyStats;