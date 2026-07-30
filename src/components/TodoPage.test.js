import React from 'react';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import WeeklyStats, { formatFocusTime, sumFocusSessions } from './WeeklyStats';
import {
  createTodo,
  filterTodos,
  sanitizeProjectPatch,
  sanitizeTodoPatch
} from '../todoModel';
import { themes } from '../themes';

const todos = [
  { id: 'day', text: 'Sunumu hazırla', projectId: 'work', myDay: true, completed: false, important: false },
  { id: 'important', text: 'Raporu gönder', projectId: 'work', important: true, completed: false, dueDate: '2026-08-02' },
  { id: 'planned', text: 'Faturayı öde', projectId: 'home', completed: false, dueDate: '2026-07-30' },
  { id: 'done', text: 'Arşivi düzenle', projectId: 'home', completed: true }
];

beforeEach(() => localStorage.setItem('language', 'tr'));

test('Todo akıllı listelerini ve aramayı doğru filtreler', () => {
  expect(filterTodos(todos, { view: 'myDay', today: '2026-07-30' }).map(todo => todo.id))
    .toEqual(['day', 'planned']);
  expect(filterTodos(todos, { view: 'important', today: '2026-07-30' }).map(todo => todo.id))
    .toEqual(['important']);
  expect(filterTodos(todos, { view: 'planned', today: '2026-07-30' }).map(todo => todo.id))
    .toEqual(['planned', 'important']);
  expect(filterTodos(todos, { view: 'completed', today: '2026-07-30' }).map(todo => todo.id))
    .toEqual(['done']);
  expect(filterTodos(todos, { view: 'all', search: 'raporu', today: '2026-07-30' }).map(todo => todo.id))
    .toEqual(['important']);
});

test('Todo Firestore verisini sınırlar ve tamamlanma zamanını yönetir', () => {
  const now = new Date('2026-07-30T10:00:00Z');

  expect(createTodo('  Yeni görev  ', 'work', { important: true }, now)).toEqual({
    text: 'Yeni görev',
    projectId: 'work',
    completed: false,
    completedAt: null,
    important: true,
    myDay: false,
    note: '',
    dueDate: null,
    estimatedPomodoros: 1,
    pomodorosCompleted: 0,
    createdAt: now
  });
  expect(sanitizeTodoPatch({ completed: true, note: '  Kısa not  ' }, now)).toEqual({
    completed: true,
    completedAt: now,
    note: 'Kısa not'
  });
  expect(sanitizeTodoPatch({ estimatedPomodoros: 3, actualPomodoros: 2 }, now)).toEqual({
    estimatedPomodoros: 3,
    actualPomodoros: 2
  });
  expect(() => sanitizeTodoPatch({ text: '   ' }, now)).toThrow('Görev adı boş olamaz');
  expect(() => sanitizeTodoPatch({ dueDate: '30/07/2026' }, now)).toThrow('Geçersiz son tarih');
});

test('bugünkü ve haftalık odak süresini birlikte gösterir', () => {
  const startOfToday = new Date('2026-07-30T00:00:00Z');
  expect(sumFocusSessions([
    { duration: 1500, completedAt: { toDate: () => new Date('2026-07-30T10:00:00Z') } },
    { duration: 900, completedAt: new Date('2026-07-29T18:00:00Z') }
  ], startOfToday)).toEqual({ totalSeconds: 2400, todaySeconds: 1500 });

  expect(formatFocusTime(3900, key => ({ 'stats.hours': 'saat', 'stats.minutes': 'dakika' }[key])))
    .toBe('1 saat 5 dakika');

  render(
    <LanguageProvider>
      <WeeklyStats todaySeconds={3900} totalSeconds={9000} />
    </LanguageProvider>
  );

  expect(screen.getByText('Bugün')).toBeInTheDocument();
  expect(screen.getByText('1 saat 5 dakika')).toBeInTheDocument();
  expect(screen.getByText('Bu hafta')).toBeInTheDocument();
  expect(screen.getByText('2 saat 30 dakika')).toBeInTheDocument();
});

test('proje ayrıntıları sınırlandırılır ve arşiv durumu doğrulanır', () => {
  expect(sanitizeProjectPatch({
    name: '  Mobil uygulama  ',
    description: '  İlk sürüm  ',
    targetPomodoros: 20,
    dailyTarget: 3,
    dueDate: '2026-08-20',
    priority: 'high',
    color: '#4ECDC4',
    archived: false
  })).toEqual({
    name: 'Mobil uygulama',
    description: 'İlk sürüm',
    targetPomodoros: 20,
    dailyTarget: 3,
    dueDate: '2026-08-20',
    priority: 'high',
    color: '#4ecdc4',
    archived: false
  });
  expect(() => sanitizeProjectPatch({ priority: 'urgent' })).toThrow('Geçersiz öncelik');
});

test('Whimsy Core ve Frutiger Aero özel temaları kullanılabilir', () => {
  expect(themes.whimsy_core?.isSpecial).toBe(true);
  expect(themes.frutiger_aero?.isSpecial).toBe(true);
  expect(themes.whimsy_core.colors['--text-color']).toBeTruthy();
  expect(themes.frutiger_aero.colors['--card-bg']).toBeTruthy();
});
