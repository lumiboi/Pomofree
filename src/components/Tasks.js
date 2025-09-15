import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Tasks = ({ 
  tasks, projects, activeProjectId, setActiveProjectId,
  handleAddProject, handleCompleteProject, handleDeleteProject,
  taskInput, setTaskInput, handleAddTask, handleDeleteTask, handleKeyPress,
  activeTaskId, setActiveTaskId, userSettings
}) => {
  const { t } = useTranslation();
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
        <select value={activeProjectId || ''} onChange={(e) => {
          setActiveProjectId(e.target.value);
          setActiveTaskId(null);
        }}>
          {activeProjects.map(p => ( <option key={p.id} value={p.id}>{p.name}</option> ))}
        </select>
        <button onClick={() => handleCompleteProject(activeProjectId)} className="btn btn-secondary btn-complete-project" disabled={filteredTasks.length > 0} title={filteredTasks.length > 0 ? t('tasks.completeProjectTooltip') : t('tasks.completeProjectTooltip2')}>{t('tasks.completeProject')}</button>
        <button onClick={() => handleDeleteProject(activeProjectId)} className="btn btn-icon btn-delete-project" disabled={activeProjects.length <= 1} title={activeProjects.length <= 1 ? t('tasks.deleteProjectTooltip') : t('tasks.deleteProjectTooltip2')}>🗑️</button>
      </div>
      
      <h3>{t('tasks.activeTasks')}</h3>
      <div className="task-list">
        {filteredTasks.map((task) => {
            const pomodorosDone = task.pomodorosCompleted || 0;
            const totalMinutes = pomodorosDone * userSettings.pomodoro;

            return (
              <div 
                key={task.id} 
                className={`task-item ${task.id === activeTaskId ? 'active-task' : ''}`}
                onClick={() => setActiveTaskId(task.id)}
              >
                <div className="task-selector-tick">
                    <span className="tick-icon">✔</span>
                </div>
                <span className="task-name">{task.text}</span>
                <div className="task-meta">
                  <div className="task-pomodoro-info">
                      <span className="count">{pomodorosDone}</span>
                      <span className="label"> {t('tasks.pomodoro')} ({totalMinutes} {t('tasks.minutes')})</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="btn-task-delete">🗑️</button>
                </div>
              </div>
            );
        })}
        {filteredTasks.length === 0 && <p className="no-tasks-message">{t('tasks.noTasks')}</p>}
      </div>

      <div className="add-task-form">
        <input type="text" placeholder={t('tasks.addTask')} value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyPress={handleKeyPress} />
        <button onClick={handleAddTask} className="btn btn-primary">+</button>
      </div>

      <div className="add-project-form">
        <input type="text" placeholder={t('tasks.addProject')} value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && onAddProject()} />
        <button onClick={onAddProject} className="btn btn-secondary">{t('tasks.addProjectButton')}</button>
      </div>
    </div>
  );
};

export default Tasks;