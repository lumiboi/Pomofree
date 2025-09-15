import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const AchievementNotification = ({ achievements, onClose }) => {
  const { t } = useTranslation();

  if (achievements.length === 0) return null;

  return (
    <div className="achievement-notification-overlay">
      <div className="achievement-notification">
        <div className="achievement-notification-header">
          <h3>🎉 {t('achievements.newAchievement')}!</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="achievement-notification-content">
          {achievements.map((achievement, index) => (
            <div key={achievement.id} className="achievement-item">
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-details">
                <h4>{achievement.title}</h4>
                <p className="achievement-desc">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;
