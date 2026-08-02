import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import SocialPage from './SocialPage';

const mockUser = { uid: 'user-a', displayName: 'Hesap A' };
const mockSnapshotListeners = {};

jest.mock('../firebase', () => ({ auth: {}, db: {} }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, callback) => {
    callback(mockUser);
    return () => {};
  },
  signOut: jest.fn()
}));
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: (db, ...parts) => ({ path: parts.join('/') }),
  deleteDoc: jest.fn(),
  deleteField: () => null,
  doc: (db, ...parts) => ({ path: parts.join('/') }),
  getDoc: () => Promise.resolve({ exists: () => true, data: () => ({ theme: 'default' }) }),
  getDocs: reference => Promise.resolve({
    docs: reference.path?.includes('focusSessions') ? [] : []
  }),
  limit: value => ({ type: 'limit', value }),
  onSnapshot: (reference, next) => {
    const key = reference.path === 'socialPosts' ? 'posts' : 'profiles';
    mockSnapshotListeners[key] = next;
    next({ docs: [] });
    return () => {};
  },
  orderBy: (field, direction) => ({ type: 'orderBy', field, direction }),
  query: (reference, ...constraints) => ({ ...reference, constraints }),
  serverTimestamp: () => new Date(),
  setDoc: () => Promise.resolve(),
  Timestamp: { fromDate: jest.fn(value => value) },
  updateDoc: jest.fn(),
  where: (...values) => ({ type: 'where', values })
}));
jest.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: key => key, language: 'tr' })
}));
jest.mock('./Header', () => () => <nav>Sosyal</nav>);
jest.mock('./ThemeSelector', () => () => null);

beforeEach(() => {
  Object.keys(mockSnapshotListeners).forEach(key => delete mockSnapshotListeners[key]);
});

test('başka hesabın paylaşımı sayfa yenilenmeden global akışta görünür', async () => {
  HTMLCanvasElement.prototype.getContext = () => null;
  render(<SocialPage />);

  await waitFor(() => expect(mockSnapshotListeners.posts).toBeDefined());
  act(() => mockSnapshotListeners.posts({
    docs: [{
      id: 'post-b',
      data: () => ({
        authorId: 'user-b',
        authorName: 'Hesap B',
        body: 'B hesabından gerçek paylaşım',
        mood: 'progress',
        createdAt: { toDate: () => new Date('2026-08-02T08:00:00.000Z') },
        reactions: {}
      })
    }]
  }));

  expect(await screen.findByText('B hesabından gerçek paylaşım')).toBeInTheDocument();
});

test('kişisel hafta özeti Firestore profil snapshotından gelir', async () => {
  HTMLCanvasElement.prototype.getContext = () => null;
  render(<SocialPage />);

  await waitFor(() => expect(mockSnapshotListeners.profiles).toBeDefined());
  act(() => mockSnapshotListeners.profiles({
    docs: [{
      id: 'user-a',
      data: () => ({
        userId: 'user-a',
        displayName: 'Hesap A',
        weeklyMinutes: 95,
        completedSessions: 4,
        activeDays: 3,
        projectCount: 2
      })
    }]
  }));

  const personalWeek = await screen.findByTestId('personal-week');
  expect(within(personalWeek).getByText('95')).toBeInTheDocument();
  expect(within(personalWeek).getByText('4')).toBeInTheDocument();
  expect(within(personalWeek).getByText('3')).toBeInTheDocument();
});
