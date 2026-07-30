import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Tasks = ({ 
  tasks, projects, activeProjectId, setActiveProjectId,
  handleAddProject, handleCompleteProject, handleDeleteProject,
  taskInput, setTaskInput, handleAddTask, handleDeleteTask,
  activeTaskId, setActiveTaskId, userSettings
}) => {
  const { t } = useTranslation();
  const [newProjectName, setNewProjectName] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);

  const onAddProject = () => {
    if (newProjectName.trim()) {
      handleAddProject(newProjectName);
      setNewProjectName('');
    }
  };

  const onAddTask = () => {
    if (!taskInput.trim()) return;
    handleAddTask(estimatedPomodoros);
    setEstimatedPomodoros(1);
  };
  
  const activeProjects = projects.filter(p => !p.completed && !p.archived);
  const filteredTasks = tasks.filter(task => task.projectId === activeProjectId && !task.completed);

  return (
    <div className="card tasks-container">
      <div className="project-selector">
        <select id="project-select" value={activeProjectId || ''} onChange={(e) => {
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
            const estimate = task.estimatedPomodoros || 1;
            const remaining = Math.max(0, estimate - pomodorosDone);
            const totalMinutes = pomodorosDone * userSettings.pomodoro;

            return (
              <div 
                key={task.id} 
                className={`task-item ${task.id === activeTaskId ? 'active-task' : ''}`}
                onClick={() => setActiveTaskId(task.id)}
                role="button"
                tabIndex="0"
                aria-pressed={task.id === activeTaskId}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveTaskId(task.id);
                  }
                }}
              >
                <div className="task-selector-tick">
                    <span className="tick-icon">✔</span>
                </div>
                <span className="task-name">{task.text}</span>
                <div className="task-meta">
                  <div className="task-pomodoro-info">
                      <span className="count">{pomodorosDone}</span>
                      <span className="label"> / {estimate} {t('tasks.pomodoro')} ({remaining} {t('tasks.remaining')})</span>
                      <span className="task-actual-time">{totalMinutes} {t('tasks.minutes')}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="btn-task-delete">🗑️</button>
                </div>
              </div>
            );
        })}
        {filteredTasks.length === 0 && <p className="no-tasks-message">{t('tasks.noTasks')}</p>}
      </div>

      <div className="add-task-form">
        <input id="task-input" type="text" placeholder={t('tasks.addTask')} value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyDown={(event) => event.key === 'Enter' && onAddTask()} />
        <label className="task-estimate-input">
          <span>{t('tasks.estimate')}</span>
          <input
            type="number"
            min="1"
            max="99"
            value={estimatedPomodoros}
            onChange={event => setEstimatedPomodoros(Math.min(99, Math.max(1, Number(event.target.value) || 1)))}
          />
        </label>
        <button onClick={onAddTask} className="btn btn-primary">+</button>
      </div>

      <div className="add-project-form">
        <input type="text" placeholder={t('tasks.addProject')} value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && onAddProject()} />
        <button onClick={onAddProject} className="btn btn-secondary">{t('tasks.addProjectButton')}</button>
      </div>
    </div>
  );
};

export default Tasks;
