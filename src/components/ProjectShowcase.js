import React from 'react';

const ProjectShowcase = ({ completedProjects, handleClearShowcase }) => {
  if (completedProjects.length === 0) return null; // Eğer biten proje yoksa hiçbir şey gösterme

  return (
    <div className="showcase-container">
      <h3>Proje Vitrini</h3>
      <div className="completed-projects-list">
        {completedProjects.map(p => (
          <div key={p.id} className="completed-project-item">
            {p.name}
          </div>
        ))}
      </div>
      <button onClick={handleClearShowcase} className="btn btn-secondary btn-clear">
        Vitrini Temizle
      </button>
    </div>
  );
};

export default ProjectShowcase;