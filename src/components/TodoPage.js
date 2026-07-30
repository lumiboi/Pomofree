import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { themes } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { createTodo, filterTodos, sanitizeTodoPatch, toDateKey } from '../todoModel';
import { sanitizeProjectPatch } from '../todoModel';
import { getProjectForecast } from '../focusModel';
import Header from './Header';
import ThemeSelector from './ThemeSelector';
import ProjectSettingsModal from './ProjectSettingsModal';
import './TodoPage.css';

const SMART_VIEWS = [
  ['myDay', '☀'],
  ['important', '☆'],
  ['planned', '◷'],
  ['all', '☷'],
  ['completed', '✓']
];

const TodoPage = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [todos, setTodos] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [view, setView] = useState('myDay');
  const [displayMode, setDisplayMode] = useState('list');
  const [search, setSearch] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [newList, setNewList] = useState('');
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [activeTheme, setActiveTheme] = useState('default');
  const [modalOpen, setModalOpen] = useState(null);
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (!currentUser) {
        if (active) {
          setLoading(false);
          navigate('/');
        }
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const [userSnapshot, projectsSnapshot, tasksSnapshot] = await Promise.all([
          getDoc(userRef),
          getDocs(collection(db, 'users', currentUser.uid, 'projects')),
          getDocs(collection(db, 'users', currentUser.uid, 'tasks'))
        ]);
        let projectList = projectsSnapshot.docs
          .map(item => ({ id: item.id, ...item.data() }))
          .filter(project => !project.completed && !project.archived);

        if (projectList.length === 0) {
          const defaultProject = { name: t('general.defaultProject'), completed: false };
          const projectRef = await addDoc(
            collection(db, 'users', currentUser.uid, 'projects'),
            defaultProject
          );
          projectList = [{ id: projectRef.id, ...defaultProject }];
        }

        if (!active) return;
        setUser(currentUser);
        setProjects(projectList);
        setTodos(tasksSnapshot.docs.map(item => ({ id: item.id, ...item.data() })));
        setActiveProjectId(projectList[0].id);
        setActiveTheme(userSnapshot.exists() ? userSnapshot.data().theme || 'default' : 'default');
      } catch (loadError) {
        console.error('Todo yüklenirken hata:', loadError);
        if (active) setError(t('todo.loadError'));
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
    // Authentication is subscribed once; language changes do not require another Firestore read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const theme = themes[activeTheme] || themes.default;
    const root = document.documentElement;
    [...new Set(Object.values(themes).flatMap(item => Object.keys(item.colors)))]
      .forEach(key => root.style.removeProperty(key));
    Object.entries(theme.colors).forEach(([key, value]) => root.style.setProperty(key, value));
    document.body.style.backgroundColor = theme.colors['--bg-color-pomodoro'];
  }, [activeTheme]);

  useEffect(() => {
    document.title = `${t('todo.title')} - ${t('general.appName')}`;
  }, [t]);

  const today = toDateKey();
  const selectedTodo = todos.find(todo => todo.id === selectedTodoId) || null;
  const visibleTodos = useMemo(
    () => filterTodos(todos, {
      view: view === 'list' ? 'list' : view,
      listId: activeProjectId,
      search,
      today
    }),
    [todos, view, activeProjectId, search, today]
  );
  const activeProject = projects.find(project => project.id === activeProjectId);
  const activeProjectPomodoros = todos
    .filter(todo => todo.projectId === activeProjectId)
    .reduce((total, todo) => total + (todo.pomodorosCompleted || 0), 0);
  const projectForecast = getProjectForecast({
    ...(activeProject || {}),
    completedPomodoros: activeProjectPomodoros
  });
  const lastWorkedAt = activeProject?.lastWorkedAt?.toDate
    ? activeProject.lastWorkedAt.toDate()
    : activeProject?.lastWorkedAt
      ? new Date(activeProject.lastWorkedAt)
      : null;
  const inactiveDays = lastWorkedAt && !Number.isNaN(lastWorkedAt.getTime())
    ? Math.floor((Date.now() - lastWorkedAt.getTime()) / 86400000)
    : 0;
  const viewTitle = view === 'list'
    ? activeProject?.name
    : t(`todo.${view}`);

  const setSmartView = nextView => {
    setView(nextView);
    setSelectedTodoId(null);
  };

  const setProjectView = projectId => {
    setActiveProjectId(projectId);
    setView('list');
    setDisplayMode('list');
    setSelectedTodoId(null);
  };

  const handleThemeChange = async themeKey => {
    setActiveTheme(themeKey);
    if (user) await setDoc(doc(db, 'users', user.uid), { theme: themeKey }, { merge: true });
  };

  const addTodo = async event => {
    event.preventDefault();
    if (!user || !activeProjectId) return;

    try {
      const todo = createTodo(newTodo, activeProjectId, {
        myDay: view === 'myDay',
        important: view === 'important',
        dueDate: view === 'planned' ? today : null
      });
      const todoRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), todo);
      const savedTodo = { id: todoRef.id, ...todo };
      setTodos(current => [...current, savedTodo]);
      setNewTodo('');
      setSelectedTodoId(todoRef.id);
    } catch (saveError) {
      if (saveError.message !== 'Görev adı boş olamaz') {
        console.error('Todo eklenirken hata:', saveError);
        setError(t('todo.saveError'));
      }
    }
  };

  const updateTodo = async (todoId, patch) => {
    if (!user) return false;
    try {
      const safePatch = sanitizeTodoPatch(patch);
      await updateDoc(doc(db, 'users', user.uid, 'tasks', todoId), safePatch);
      setTodos(current => current.map(todo => (
        todo.id === todoId ? { ...todo, ...safePatch } : todo
      )));
      return true;
    } catch (saveError) {
      console.error('Todo güncellenirken hata:', saveError);
      setError(t('todo.saveError'));
      return false;
    }
  };

  const toggleTodoCompletion = todo => updateTodo(todo.id, {
    completed: !todo.completed,
    ...(!todo.completed ? { actualPomodoros: todo.pomodorosCompleted || 0 } : {})
  });

  const removeTodo = async todoId => {
    if (!user || !window.confirm(t('todo.deleteTaskConfirm'))) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', todoId));
      setTodos(current => current.filter(todo => todo.id !== todoId));
      setSelectedTodoId(null);
    } catch (saveError) {
      console.error('Todo silinirken hata:', saveError);
      setError(t('todo.saveError'));
    }
  };

  const addList = async event => {
    event.preventDefault();
    const name = newList.trim().slice(0, 80);
    if (!user || !name) return;
    try {
      const project = { name, completed: false };
      const projectRef = await addDoc(collection(db, 'users', user.uid, 'projects'), project);
      setProjects(current => [...current, { id: projectRef.id, ...project }]);
      setActiveProjectId(projectRef.id);
      setView('list');
      setNewList('');
    } catch (saveError) {
      console.error('Liste eklenirken hata:', saveError);
      setError(t('todo.saveError'));
    }
  };

  const updateActiveProject = async rawPatch => {
    if (!user || !activeProjectId) return;
    try {
      const patch = sanitizeProjectPatch(rawPatch);
      await updateDoc(doc(db, 'users', user.uid, 'projects', activeProjectId), patch);
      setProjects(current => current.map(project => (
        project.id === activeProjectId ? { ...project, ...patch } : project
      )));
      setProjectSettingsOpen(false);
    } catch (saveError) {
      console.error('Proje güncellenirken hata:', saveError);
      setError(t('todo.saveError'));
    }
  };

  const archiveActiveProject = async () => {
    if (!user || projects.length <= 1 || !window.confirm(t('project.archiveConfirm'))) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'projects', activeProjectId), {
        archived: true,
        archivedAt: new Date()
      });
      const remaining = projects.filter(project => project.id !== activeProjectId);
      setProjects(remaining);
      setActiveProjectId(remaining[0].id);
      setProjectSettingsOpen(false);
    } catch (saveError) {
      console.error('Proje arşivlenirken hata:', saveError);
      setError(t('todo.saveError'));
    }
  };

  const removeActiveList = async () => {
    if (!user || projects.length <= 1 || !activeProjectId) return;
    const listTodos = todos.filter(todo => todo.projectId === activeProjectId);
    if (listTodos.length > 499) {
      setError(t('todo.listLimitError'));
      return;
    }
    if (!window.confirm(t('todo.deleteListConfirm'))) return;

    try {
      const batch = writeBatch(db);
      listTodos.forEach(todo => batch.delete(doc(db, 'users', user.uid, 'tasks', todo.id)));
      batch.delete(doc(db, 'users', user.uid, 'projects', activeProjectId));
      await batch.commit();
      const remainingProjects = projects.filter(project => project.id !== activeProjectId);
      setProjects(remainingProjects);
      setTodos(current => current.filter(todo => todo.projectId !== activeProjectId));
      setActiveProjectId(remainingProjects[0].id);
      setSelectedTodoId(null);
    } catch (saveError) {
      console.error('Liste silinirken hata:', saveError);
      setError(t('todo.saveError'));
    }
  };

  const focusQuickAdd = projectId => {
    setActiveProjectId(projectId);
    document.getElementById('todo-quick-add')?.focus();
  };

  if (loading) {
    return <div className="todo-loading" role="status">{t('todo.loading')}</div>;
  }
  if (!user) return null;

  return (
    <div className={`app-container todo-page theme-${activeTheme}`}>
      <Header
        user={user}
        openModal={setModalOpen}
        handleLogout={async () => {
          await signOut(auth);
          navigate('/');
        }}
        isTodoPage
      />

      {error && (
        <div className="todo-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label={t('general.close')}>×</button>
        </div>
      )}

      <main className={`todo-shell ${selectedTodo ? 'has-details' : ''}`}>
        <aside className="todo-sidebar">
          <div className="todo-brand">
            <span className="todo-brand-mark" aria-hidden="true">✓</span>
            <div>
              <h2>{t('todo.title')}</h2>
              <p>{t('todo.subtitle')}</p>
            </div>
          </div>

          <label className="todo-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t('todo.search')}
              aria-label={t('todo.search')}
            />
          </label>

          <nav className="todo-nav" aria-label={t('todo.title')}>
            {SMART_VIEWS.map(([id, icon]) => (
              <button
                type="button"
                key={id}
                className={view === id ? 'active' : ''}
                onClick={() => setSmartView(id)}
              >
                <span className="todo-nav-icon" aria-hidden="true">{icon}</span>
                <span>{t(`todo.${id}`)}</span>
                <strong>{filterTodos(todos, { view: id, today }).length}</strong>
              </button>
            ))}
          </nav>

          <div className="todo-lists-heading">
            <span>{t('todo.lists')}</span>
            {view === 'list' && projects.length > 1 && (
              <button
                type="button"
                onClick={removeActiveList}
                title={t('todo.deleteList')}
                aria-label={t('todo.deleteList')}
              >
                🗑
              </button>
            )}
          </div>

          <nav className="todo-nav todo-projects" aria-label={t('todo.lists')}>
            {projects.map(project => (
              <button
                type="button"
                key={project.id}
                className={view === 'list' && activeProjectId === project.id ? 'active' : ''}
                onClick={() => setProjectView(project.id)}
              >
                <span className="todo-list-dot" aria-hidden="true" />
                <span>{project.name}</span>
                <strong>{filterTodos(todos, { view: 'list', listId: project.id }).length}</strong>
              </button>
            ))}
          </nav>

          <form className="todo-new-list" onSubmit={addList}>
            <input
              value={newList}
              onChange={event => setNewList(event.target.value)}
              placeholder={t('todo.newList')}
              maxLength={80}
              aria-label={t('todo.newList')}
            />
            <button type="submit" aria-label={t('todo.addList')}>＋</button>
          </form>
          <p className="todo-sync-hint">{t('todo.syncHint')}</p>
        </aside>

        <section className="todo-content">
          <header className="todo-content-header">
            <div>
              <p>{new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              }).format(new Date())}</p>
              <h1>{viewTitle}</h1>
              <span>{visibleTodos.length} {t('todo.tasksCount')}</span>
              {view === 'list' && activeProject && (
                <button type="button" className="todo-project-settings-button" onClick={() => setProjectSettingsOpen(true)}>
                  ⚙ {t('project.settings')}
                </button>
              )}
            </div>
            <div className="todo-view-toggle" aria-label={t('todo.title')}>
              <button
                type="button"
                className={displayMode === 'list' ? 'active' : ''}
                onClick={() => setDisplayMode('list')}
              >
                ☷ {t('todo.listView')}
              </button>
              <button
                type="button"
                className={displayMode === 'board' ? 'active' : ''}
                onClick={() => {
                  setDisplayMode('board');
                  if (view === 'list') setView('all');
                }}
              >
                ▦ {t('todo.boardView')}
              </button>
            </div>
          </header>

          {view !== 'completed' && (
            <form className="todo-quick-add" onSubmit={addTodo}>
              <span aria-hidden="true">＋</span>
              <input
                id="todo-quick-add"
                value={newTodo}
                onChange={event => setNewTodo(event.target.value)}
                placeholder={t('todo.addTaskPlaceholder')}
                maxLength={200}
              />
              <button type="submit">{t('todo.addTask')}</button>
            </form>
          )}

          {view === 'list' && inactiveDays >= 7 && (
            <div className="todo-project-stale" role="status">
              <span aria-hidden="true">◷</span>
              <p>{t('project.inactivePrefix')} {inactiveDays} {t('project.inactiveSuffix')}</p>
              <button type="button" onClick={() => setProjectSettingsOpen(true)}>{t('project.review')}</button>
            </div>
          )}

          {displayMode === 'list' ? (
            <div className="todo-task-list">
              {visibleTodos.map(todo => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  project={projects.find(project => project.id === todo.projectId)}
                  selected={todo.id === selectedTodoId}
                  t={t}
                  onSelect={() => setSelectedTodoId(todo.id)}
                  onComplete={() => toggleTodoCompletion(todo)}
                  onImportant={() => updateTodo(todo.id, { important: !todo.important })}
                />
              ))}
              {visibleTodos.length === 0 && (
                <div className="todo-empty">
                  <span aria-hidden="true">{search ? '⌕' : '✓'}</span>
                  <h3>{search ? t('todo.noResults') : t('todo.emptyTitle')}</h3>
                  {!search && <p>{t('todo.emptyText')}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="todo-board">
              {projects.map(project => {
                const projectTodos = visibleTodos.filter(todo => todo.projectId === project.id);
                return (
                  <section className="todo-board-column" key={project.id}>
                    <header>
                      <div><span className="todo-list-dot" /> {project.name}</div>
                      <strong>{projectTodos.length}</strong>
                    </header>
                    <div>
                      {projectTodos.map(todo => (
                        <TodoCard
                          key={todo.id}
                          todo={todo}
                          project={project}
                          selected={todo.id === selectedTodoId}
                          t={t}
                          compact
                          onSelect={() => setSelectedTodoId(todo.id)}
                          onComplete={() => toggleTodoCompletion(todo)}
                          onImportant={() => updateTodo(todo.id, { important: !todo.important })}
                        />
                      ))}
                    </div>
                    {view !== 'completed' && (
                      <button type="button" className="todo-column-add" onClick={() => focusQuickAdd(project.id)}>
                        ＋ {t('todo.addTask')}
                      </button>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>

        {selectedTodo && (
          <aside className="todo-details" aria-label={t('todo.details')}>
            <header>
              <h2>{t('todo.details')}</h2>
              <button
                type="button"
                onClick={() => setSelectedTodoId(null)}
                aria-label={t('todo.closeDetails')}
              >
                ×
              </button>
            </header>

            <div className="todo-details-title">
              <button
                type="button"
                className={`todo-check ${selectedTodo.completed ? 'checked' : ''}`}
                onClick={() => toggleTodoCompletion(selectedTodo)}
                aria-label={selectedTodo.completed ? t('todo.completed') : t('todo.taskName')}
              >
                {selectedTodo.completed ? '✓' : ''}
              </button>
              <input
                key={`${selectedTodo.id}-title`}
                defaultValue={selectedTodo.text}
                maxLength={200}
                aria-label={t('todo.taskName')}
                onBlur={async event => {
                  const saved = await updateTodo(selectedTodo.id, { text: event.target.value });
                  if (!saved) event.target.value = selectedTodo.text;
                }}
              />
              <button
                type="button"
                className={`todo-star ${selectedTodo.important ? 'active' : ''}`}
                onClick={() => updateTodo(selectedTodo.id, { important: !selectedTodo.important })}
                aria-label={selectedTodo.important ? t('todo.removeImportant') : t('todo.markImportant')}
              >
                {selectedTodo.important ? '★' : '☆'}
              </button>
            </div>

            <button
              type="button"
              className={`todo-detail-action ${selectedTodo.myDay ? 'active' : ''}`}
              onClick={() => updateTodo(selectedTodo.id, { myDay: !selectedTodo.myDay })}
            >
              <span aria-hidden="true">☀</span>
              {selectedTodo.myDay ? t('todo.removeFromMyDay') : t('todo.addToMyDay')}
            </button>

            <label className="todo-detail-field">
              <span>{t('todo.dueDate')}</span>
              <input
                type="date"
                value={selectedTodo.dueDate || ''}
                onChange={event => updateTodo(selectedTodo.id, { dueDate: event.target.value || null })}
              />
            </label>

            <label className="todo-detail-field">
              <span>{t('todo.estimate')}</span>
              <input
                type="number"
                min="1"
                max="99"
                value={selectedTodo.estimatedPomodoros || 1}
                onChange={event => updateTodo(selectedTodo.id, {
                  estimatedPomodoros: event.target.value
                })}
              />
            </label>

            <label className="todo-detail-field">
              <span>{t('todo.list')}</span>
              <select
                value={selectedTodo.projectId}
                onChange={event => {
                  setActiveProjectId(event.target.value);
                  updateTodo(selectedTodo.id, { projectId: event.target.value });
                }}
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>

            <label className="todo-detail-field todo-note">
              <span>{t('todo.note')}</span>
              <textarea
                key={`${selectedTodo.id}-note`}
                defaultValue={selectedTodo.note || ''}
                maxLength={2000}
                placeholder={t('todo.notePlaceholder')}
                onBlur={event => updateTodo(selectedTodo.id, { note: event.target.value })}
              />
            </label>

            <div className="todo-pomodoro-count">
              <span aria-hidden="true">◉</span>
              <strong>{selectedTodo.pomodorosCompleted || 0}</strong>
              <span>{t('todo.pomodoros')}</span>
            </div>

            <button type="button" className="todo-delete-task" onClick={() => removeTodo(selectedTodo.id)}>
              🗑 {t('todo.deleteTask')}
            </button>
          </aside>
        )}
      </main>

      {modalOpen === 'themes' && (
        <ThemeSelector closeModal={() => setModalOpen(null)} handleThemeChange={handleThemeChange} />
      )}
      {projectSettingsOpen && activeProject && (
        <ProjectSettingsModal
          key={activeProject.id}
          project={activeProject}
          completedPomodoros={activeProjectPomodoros}
          forecast={projectForecast}
          canArchive={projects.length > 1}
          onSave={updateActiveProject}
          onArchive={archiveActiveProject}
          onClose={() => setProjectSettingsOpen(false)}
        />
      )}
    </div>
  );
};

const TodoCard = ({
  todo,
  project,
  selected,
  t,
  onSelect,
  onComplete,
  onImportant,
  compact = false
}) => (
  <article className={`todo-task-card ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`}>
    <button
      type="button"
      className={`todo-check ${todo.completed ? 'checked' : ''}`}
      onClick={onComplete}
      aria-label={todo.completed ? t('todo.completed') : t('todo.taskName')}
    >
      {todo.completed ? '✓' : ''}
    </button>
    <button type="button" className="todo-task-main" onClick={onSelect}>
      <span className={todo.completed ? 'completed' : ''}>{todo.text}</span>
      <small>
        {project?.name}
        {todo.dueDate && <> · {todo.dueDate}</>}
        <> · ◉ {todo.pomodorosCompleted || 0}/{todo.estimatedPomodoros || 1}</>
        <> · {Math.max(0, (todo.estimatedPomodoros || 1) - (todo.pomodorosCompleted || 0))} {t('todo.remaining')}</>
      </small>
    </button>
    <button
      type="button"
      className={`todo-star ${todo.important ? 'active' : ''}`}
      onClick={onImportant}
      aria-label={todo.important ? t('todo.removeImportant') : t('todo.markImportant')}
    >
      {todo.important ? '★' : '☆'}
    </button>
  </article>
);

export default TodoPage;
