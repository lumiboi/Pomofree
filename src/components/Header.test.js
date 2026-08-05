import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import Header from './Header';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

beforeEach(() => mockNavigate.mockClear());

test('profil fotoğrafını adın solunda gösterir', () => {
  render(
    <LanguageProvider>
      <Header
        user={{ displayName: 'Mert Ergun', email: 'mert@example.com' }}
        profilePhoto="data:image/webp;base64,AAAA"
        openModal={jest.fn()}
        handleLogout={jest.fn()}
      />
    </LanguageProvider>
  );

  expect(screen.getByRole('img', { name: 'Mert Ergun profil fotoğrafı' })).toHaveAttribute('src', 'data:image/webp;base64,AAAA');
  fireEvent.click(screen.getByRole('button', { name: /Mert Ergun/ }));
  expect(screen.getByRole('button', { name: 'Çıkış Yap' })).toBeInTheDocument();
});

test('kaydedilmiş fotoğraf silindiyse sağlayıcı fotoğrafına geri dönmez', () => {
  render(
    <LanguageProvider>
      <Header
        user={{ displayName: 'Mert Ergun', email: 'mert@example.com', photoURL: 'https://example.com/google.jpg' }}
        profilePhoto=""
        openModal={jest.fn()}
        handleLogout={jest.fn()}
      />
    </LanguageProvider>
  );

  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

test('Pomofree kedisini üzerine gelince oynatır', () => {
  const { container } = render(
    <LanguageProvider>
      <Header openModal={jest.fn()} handleLogout={jest.fn()} />
    </LanguageProvider>
  );

  const cat = container.querySelector('.pomocat-logo');
  expect(cat).toHaveAttribute('src', '/pomocat.png');
  fireEvent.mouseEnter(cat);
  expect(cat).toHaveAttribute('src', '/pomocat-animated.webp');
  fireEvent.mouseLeave(cat);
  expect(cat).toHaveAttribute('src', '/pomocat.png');
});

test('Pomofree markası ana sayfaya götürür', () => {
  render(
    <LanguageProvider>
      <Header openModal={jest.fn()} handleLogout={jest.fn()} isSocialPage />
    </LanguageProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Pomofree' }));
  expect(mockNavigate).toHaveBeenCalledWith('/');
});
