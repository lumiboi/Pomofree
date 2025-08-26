import React, { useState } from 'react';

const Tasks = ({ 
  tasks, 
  projects, 
  activeProjectId, 
  setActiveProjectId,
  handleAddProject,
  handleCompleteProject,
  handleDeleteProject,
  taskInput, 
  setTaskInput, 
  handleAddTask, 
  handleDeleteTask, 
  handleKeyPress 
}) => {
  const [newProjectName, setNewProjectName] = useState('');

  const onAddProject = () => {
    if (newProjectName.trim()) {
      handleAddProject(newProjectName);
      setNewProjectName('');
    }
  };
  
  const activeProjects = projects.filter(p => !p.completed);
  const filteredTasks = tasks.filter(task => task.projectId === activeProjectId);

  return (
    <div className="card tasks-container">
      <div className="project-selector">
        <select value={activeProjectId || ''} onChange={(e) => setActiveProjectId(e.target.value)}>
          {activeProjects.map(p => ( <option key={p.id} value={p.id}>{p.name}</option> ))}
        </select>
        <button 
          onClick={() => handleCompleteProject(activeProjectId)} 
          className="btn btn-secondary btn-complete-project" 
          disabled={filteredTasks.length > 0} 
          title={filteredTasks.length > 0 ? "Projeyi bitirmek için önce tüm görevleri tamamlayın." : "Projeyi tamamla ve vitrine taşı."}
        >
          Bitir
        </button>
        <button 
          onClick={() => handleDeleteProject(activeProjectId)} 
          className="btn btn-icon btn-delete-project"
          disabled={activeProjects.length <= 1}
          title={activeProjects.length <= 1 ? "Son kalan projeyi silemezsiniz." : "Projeyi ve içindeki tüm görevleri sil."}
        >
          🗑️
        </button>
      </div>
      
      <h3>Görevler</h3>
      <div className="task-list">
        {filteredTasks.map((task) => (
          <div key={task.id} className="task-item">
            <span className="task-name">{task.text}</span>
            <button onClick={() => handleDeleteTask(task.id)} className="btn-task-delete">🗑️</button>
          </div>
        ))}
        {filteredTasks.length === 0 && <p className="no-tasks-message">Bu proje için görev yok.</p>}
      </div>

      {/* ////// EKSİK OLAN GÖREV EKLEME FORMU BURADA ////// */}
      <div className="add-task-form">
        <input
          type="text"
          placeholder="Yeni görev ekle..."
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleAddTask} className="btn btn-primary">+</button>
      </div>

      {/* ////// EKSİK OLAN PROJE OLUŞTURMA FORMU BURADA ////// */}
      <div className="add-project-form">
        <input 
          type="text"
          placeholder="Yeni proje oluştur..."
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onAddProject()}
        />
        <button onClick={onAddProject} className="btn btn-secondary">Proje Ekle</button>
      </div>
    </div>
  );
};

export default Tasks;