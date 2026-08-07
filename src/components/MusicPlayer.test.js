import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import MusicPlayer from './MusicPlayer';

const renderPlayer = () => render(
  <LanguageProvider>
    <MusicPlayer />
  </LanguageProvider>
);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('language', 'tr');
  window.YT = {
    Player: jest.fn(),
    PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 }
  };
});

test('YouTube kabı React ağacının dışında, body üzerinde kurulur', () => {
  const { container } = renderPlayer();
  const host = document.getElementById('youtube-player');

  expect(host).toBeInTheDocument();
  // React'in yönettiği ağaçta olmamalı; yoksa insertBefore çakışması geri gelir.
  expect(container.contains(host)).toBe(false);
  expect(host.parentElement).toBe(document.body);
  expect(window.YT.Player).toHaveBeenCalledTimes(1);
  expect(window.YT.Player.mock.calls[0][0]).toBe(host);
});

test('çalar açılıp kapanırken oynatıcı kabı yerinde kalır', () => {
  renderPlayer();
  const host = document.getElementById('youtube-player');

  fireEvent.doubleClick(screen.getByTitle('Açmak için çift tıkla'));
  expect(document.getElementById('youtube-player')).toBe(host);
  expect(screen.getByTitle('Küçült')).toBeInTheDocument();

  fireEvent.click(screen.getByTitle('Kapat'));
  expect(document.getElementById('youtube-player')).toBe(host);
  expect(window.YT.Player).toHaveBeenCalledTimes(1);
});
