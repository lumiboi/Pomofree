import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import CollectiveCat from './CollectiveCat';

const mockCat = { total: 0 };

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../catService', () => ({
  subscribeCollectiveCat: onChange => {
    onChange({ totalContribution: mockCat.total, updatedAt: null });
    return () => {};
  }
}));

const renderCat = props => render(
  <LanguageProvider>
    <CollectiveCat user={{ uid: 'user-1' }} {...props} />
  </LanguageProvider>
);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('language', 'tr');
  mockCat.total = 0;
});

test('kedi sakinken normal, katkı gelince mutlu animasyonu gösterir', () => {
  const { unmount } = renderCat({ todayContribution: 0 });
  expect(screen.getByRole('img')).toHaveAttribute('src', '/pomocat-normal.webp');
  unmount();

  renderCat({ todayContribution: 8 });
  expect(screen.getByRole('img')).toHaveAttribute('src', '/pomocat-happy.webp');
});

test('aşama ilerlemesi topluluk katkısından hesaplanır', () => {
  mockCat.total = 275;
  renderCat({ todayContribution: 0 });

  expect(screen.getByText(/Aşama 2/)).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
});

test('dinlenmeyi seçen kullanıcıya suçlayıcı bir hâl gösterilmez', () => {
  renderCat({ todayContribution: 0, rested: true });

  expect(screen.getByRole('img')).toHaveAccessibleName('dinleniyor');
  expect(screen.getByRole('button', { name: 'Bugün dinlenmeyi seçtin' })).toBeDisabled();
});

test('panel küçültülüp kapatılabilir ve konumu hatırlanır', () => {
  const { unmount } = renderCat({ todayContribution: 0 });

  fireEvent.click(screen.getByRole('button', { name: 'Küçült' }));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Büyüt' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Kapat' }));
  expect(screen.getByRole('button', { name: '🐈 Kediyi göster' })).toBeInTheDocument();

  // Kapalı ve küçültülmüş hâl yeniden açılışta korunur.
  unmount();
  renderCat({ todayContribution: 0 });
  fireEvent.click(screen.getByRole('button', { name: '🐈 Kediyi göster' }));
  expect(screen.getByRole('button', { name: 'Büyüt' })).toBeInTheDocument();
});

test('dar ekranda panel simge durumunda açılır', () => {
  const width = window.innerWidth;
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });

  renderCat({ todayContribution: 0 });
  expect(screen.getByRole('button', { name: 'Büyüt' })).toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();

  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
});
