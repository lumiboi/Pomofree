import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const ProjectSettingsModal = ({
  project,
  completedPomodoros,
  forecast,
  canArchive,
  onSave,
  onArchive,
  onClose
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: project.name || '',
    description: project.description || '',
    targetPomodoros: project.targetPomodoros || 0,
    dailyTarget: project.dailyTarget || 1,
    dueDate: project.dueDate || '',
    priority: project.priority || 'normal',
    color: project.color || '#4ecdc4'
  });
  const update = patch => setForm(current => ({ ...current, ...patch }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-content project-settings-modal"
        onClick={event => event.stopPropagation()}
        onSubmit={event => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <header>
          <div>
            <small>{t('project.settings')}</small>
            <h2>{project.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t('general.close')}>×</button>
        </header>

        <div className="project-progress-summary">
          <div>
            <strong>{completedPomodoros}/{form.targetPomodoros || '—'}</strong>
            <span>{t('project.completedPomodoros')}</span>
          </div>
          <div>
            <strong>{forecast.remainingPomodoros}</strong>
            <span>{t('project.remainingPomodoros')}</span>
          </div>
          <div className={forecast.atRisk ? 'at-risk' : ''}>
            <strong>{forecast.estimatedDate}</strong>
            <span>{forecast.atRisk ? t('project.deadlineRisk') : t('project.estimatedFinish')}</span>
          </div>
        </div>

        <label>
          <span>{t('project.name')}</span>
          <input value={form.name} onChange={event => update({ name: event.target.value })} maxLength={80} required />
        </label>
        <label>
          <span>{t('project.description')}</span>
          <textarea value={form.description} onChange={event => update({ description: event.target.value })} maxLength={1000} />
        </label>
        <div className="project-field-grid">
          <label>
            <span>{t('project.target')}</span>
            <input type="number" min="0" max="9999" value={form.targetPomodoros} onChange={event => update({ targetPomodoros: event.target.value })} />
          </label>
          <label>
            <span>{t('project.dailyTarget')}</span>
            <input type="number" min="1" max="99" value={form.dailyTarget} onChange={event => update({ dailyTarget: event.target.value })} />
          </label>
          <label>
            <span>{t('project.dueDate')}</span>
            <input type="date" value={form.dueDate} onChange={event => update({ dueDate: event.target.value })} />
          </label>
          <label>
            <span>{t('project.priority')}</span>
            <select value={form.priority} onChange={event => update({ priority: event.target.value })}>
              <option value="low">{t('project.low')}</option>
              <option value="normal">{t('project.normal')}</option>
              <option value="high">{t('project.high')}</option>
            </select>
          </label>
          <label>
            <span>{t('project.color')}</span>
            <input type="color" value={form.color} onChange={event => update({ color: event.target.value })} />
          </label>
        </div>

        <footer>
          <button type="button" className="project-archive-button" onClick={onArchive} disabled={!canArchive}>
            {t('project.archive')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('settings.cancel')}</button>
          <button type="submit" className="btn btn-primary">{t('settings.save')}</button>
        </footer>
      </form>
    </div>
  );
};

export default ProjectSettingsModal;
