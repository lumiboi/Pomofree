import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import DomainNotice from './DomainNotice';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('language', 'tr');
});

test('yeni alan adını doğal duyuru metniyle gösterir ve kalıcı olarak kapatılır', () => {
  const { container, unmount } = render(
    <LanguageProvider>
      <DomainNotice now={Date.parse('2026-08-06T00:00:00+03:00')} />
    </LanguageProvider>
  );

  expect(screen.getByText('Taşındık. Kutular mutular tamam, kedi de sağ salim.')).toBeInTheDocument();
  expect(container.querySelector('.domain-notice p')).toHaveTextContent(
    "Yeni evimiz pomofree.app. Eski adres 21 gün sonra kapanıyor; bookmark'ını falan şimdiden güncelle de sonra yok efendim “kedi bi' şey yaptı” demeyelim."
  );
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
