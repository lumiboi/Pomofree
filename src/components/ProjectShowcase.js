import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const ProjectShowcase = ({ completedProjects, handleClearShowcase }) => {
  const { t } = useTranslation();
  if (completedProjects.length === 0) return null; // Eğer biten proje yoksa hiçbir şey gösterme

  return (
    <div className="showcase-container">
      <h3>{t('showcase.title')}</h3>
      <div className="completed-projects-list">
        {completedProjects.map(p => (
          <div key={p.id} className="completed-project-item">
            {p.name}
          </div>
        ))}
      </div>
      <button onClick={handleClearShowcase} className="btn btn-secondary btn-clear">
        {t('showcase.clear')}
      </button>
    </div>
  );
};

export default ProjectShowcase;