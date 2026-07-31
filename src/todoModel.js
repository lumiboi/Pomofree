const TITLE_LIMIT = 200;
const NOTE_LIMIT = 2000;
const LIST_ID_LIMIT = 128;

const cleanText = (value, limit) => String(value ?? '').trim().slice(0, limit);
const cleanPomodoroCount = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(9999, Math.max(0, Math.round(number))) : fallback;
};

const cleanDate = value => {
  if (value == null || value === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Geçersiz son tarih');

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) throw new Error('Geçersiz son tarih');

  return value;
};

export const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const filterTodos = (
  todos,
  { view = 'all', listId, search = '', today = toDateKey() } = {}
) => {
  const query = cleanText(search, TITLE_LIMIT).toLocaleLowerCase();
  const filtered = todos.filter(todo => {
    if (query && !`${todo.text || ''} ${todo.note || ''}`.toLocaleLowerCase().includes(query)) {
      return false;
    }

    if (view === 'completed') return Boolean(todo.completed);
    if (todo.completed) return false;
    if (view === 'myDay') return Boolean(todo.myDay) || todo.dueDate === today;
    if (view === 'important') return Boolean(todo.important);
    if (view === 'planned') return Boolean(todo.dueDate);
    if (view === 'list') return todo.projectId === listId;
    return true;
  });

  return view === 'planned'
    ? [...filtered].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    : filtered;
};

export const isFocusTask = todo => todo.focusActive !== false;

export const createTodo = (text, projectId, options = {}, now = new Date()) => {
  const title = cleanText(text, TITLE_LIMIT);
  const list = cleanText(projectId, LIST_ID_LIMIT);
  if (!title) throw new Error('Görev adı boş olamaz');
  if (!list) throw new Error('Liste seçilmedi');

  return {
    text: title,
    projectId: list,
    completed: false,
    completedAt: null,
    important: Boolean(options.important),
    myDay: Boolean(options.myDay),
    note: cleanText(options.note, NOTE_LIMIT),
    dueDate: cleanDate(options.dueDate),
    estimatedPomodoros: cleanPomodoroCount(options.estimatedPomodoros, 1) || 1,
    pomodorosCompleted: 0,
    focusActive: false,
    createdAt: now
  };
};

export const sanitizeTodoPatch = (patch, now = new Date()) => {
  const safe = {};

  if ('text' in patch) {
    safe.text = cleanText(patch.text, TITLE_LIMIT);
    if (!safe.text) throw new Error('Görev adı boş olamaz');
  }
  if ('projectId' in patch) {
    safe.projectId = cleanText(patch.projectId, LIST_ID_LIMIT);
    if (!safe.projectId) throw new Error('Liste seçilmedi');
  }
  if ('note' in patch) safe.note = cleanText(patch.note, NOTE_LIMIT);
  if ('dueDate' in patch) safe.dueDate = cleanDate(patch.dueDate);
  if ('important' in patch) safe.important = Boolean(patch.important);
  if ('myDay' in patch) safe.myDay = Boolean(patch.myDay);
  if ('focusActive' in patch) safe.focusActive = Boolean(patch.focusActive);
  if ('estimatedPomodoros' in patch) {
    safe.estimatedPomodoros = cleanPomodoroCount(patch.estimatedPomodoros, 1) || 1;
  }
  if ('actualPomodoros' in patch) {
    safe.actualPomodoros = cleanPomodoroCount(patch.actualPomodoros);
  }
  if ('completed' in patch) {
    safe.completed = Boolean(patch.completed);
    safe.completedAt = safe.completed ? now : null;
  }

  return safe;
};

export const sanitizeProjectPatch = patch => {
  const safe = {};
  if ('name' in patch) {
    safe.name = cleanText(patch.name, 80);
    if (!safe.name) throw new Error('Proje adı boş olamaz');
  }
  if ('description' in patch) safe.description = cleanText(patch.description, 1000);
  if ('targetPomodoros' in patch) {
    safe.targetPomodoros = cleanPomodoroCount(patch.targetPomodoros);
  }
  if ('dailyTarget' in patch) {
    safe.dailyTarget = cleanPomodoroCount(patch.dailyTarget, 1) || 1;
  }
  if ('dueDate' in patch) safe.dueDate = cleanDate(patch.dueDate);
  if ('priority' in patch) {
    if (!['low', 'normal', 'high'].includes(patch.priority)) {
      throw new Error('Geçersiz öncelik');
    }
    safe.priority = patch.priority;
  }
  if ('color' in patch) {
    const color = String(patch.color || '').toLocaleLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(color)) throw new Error('Geçersiz proje rengi');
    safe.color = color;
  }
  if ('archived' in patch) safe.archived = Boolean(patch.archived);
  return safe;
};
