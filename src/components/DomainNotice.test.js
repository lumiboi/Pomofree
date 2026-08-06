import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import DomainNotice from './DomainNotice';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('language', 'tr');
});

test('yeni alan adını 21 günlük sayaçla gösterir ve kalıcı olarak kapatılır', () => {
  const { unmount } = render(
    <LanguageProvider>
      <DomainNotice now={Date.parse('2026-08-06T00:00:00+03:00')} />
    </LanguageProvider>
  );

  expect(screen.getByText(/21 gün sonra kapanıyor/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'pomofree.app' })).toHaveAttribute('href', 'https://pomofree.app/');

  fireEvent.click(screen.getByRole('button', { name: 'Duyuruyu kapat' }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  unmount();
  render(
    <LanguageProvider>
      <DomainNotice now={Date.parse('2026-08-06T00:00:00+03:00')} />
    </LanguageProvider>
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('21 günlük süre dolunca duyuruyu göstermez', () => {
  render(
    <LanguageProvider>
      <DomainNotice now={Date.parse('2026-08-27T00:00:00+03:00')} />
    </LanguageProvider>
  );

  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
