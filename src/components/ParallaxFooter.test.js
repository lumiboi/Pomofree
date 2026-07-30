import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import ParallaxFooter from './ParallaxFooter';

beforeEach(() => {
  localStorage.setItem('language', 'tr');
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  });
});

afterEach(() => document.body.classList.remove('footer-visible'));

test('footer elle kapatılınca sayfa yenilenene kadar yeniden açılmaz', () => {
  const { unmount } = render(
    <LanguageProvider>
      <ParallaxFooter />
    </LanguageProvider>
  );

  expect(screen.getByRole('link', { name: 'Lumi' })).toHaveAttribute('href', 'https://lumie.zone');
  expect(screen.getByRole('link', { name: 'Lethe' })).toHaveAttribute('href', 'https://www.youtube.com/@lsnehir');
  expect(screen.getByText(`©Pomofree ${new Date().getFullYear()}. All Rights Reserved.`)).toBeInTheDocument();

  fireEvent.mouseMove(window, { clientY: 790 });
  expect(document.querySelector('.parallax-footer')).toHaveClass('visible');
  expect(document.body).toHaveClass('footer-visible');

  fireEvent.click(screen.getByRole('button', { name: 'Alt bilgiyi gizle' }));
  expect(document.querySelector('.parallax-footer')).not.toHaveClass('visible');
  expect(document.body).not.toHaveClass('footer-visible');

  fireEvent.mouseMove(window, { clientY: 790 });
  expect(document.querySelector('.parallax-footer')).not.toHaveClass('visible');

  fireEvent.mouseMove(window, { clientY: 200 });
  fireEvent.mouseMove(window, { clientY: 790 });
  expect(document.querySelector('.parallax-footer')).not.toHaveClass('visible');

  unmount();
  render(
    <LanguageProvider>
      <ParallaxFooter />
    </LanguageProvider>
  );
  fireEvent.mouseMove(window, { clientY: 790 });
  expect(document.querySelector('.parallax-footer')).toHaveClass('visible');
});
