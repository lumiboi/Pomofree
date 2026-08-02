import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FocusSoundMixer from './FocusSoundMixer';

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: key => key })
}));

const NativeAudio = window.Audio;
afterEach(() => {
  window.Audio = NativeAudio;
});

test('yağmur seviyesi yerel ve döngülü yağmur kaydını çalar', () => {
  const rain = {
    loop: false,
    preload: '',
    volume: 0,
    play: jest.fn().mockResolvedValue(),
    pause: jest.fn()
  };
  window.Audio = jest.fn(() => rain);

  render(
    <FocusSoundMixer
      isOpen
      onClose={() => {}}
      projectId="test"
      isFocusActive={false}
    />
  );

  fireEvent.change(screen.getByRole('slider', { name: /^focusSound\.rain/ }), {
    target: { value: '40' }
  });

  expect(window.Audio).toHaveBeenCalledWith('/sounds/gentle-rain.mp3');
  expect(rain).toMatchObject({ loop: true, preload: 'auto', volume: 0.1 });
  expect(rain.play).toHaveBeenCalled();
});

test('klavye seviyesi chill ve döngülü klavye kaydını çalar', () => {
  const keyboard = {
    loop: false,
    preload: '',
    volume: 0,
    play: jest.fn().mockResolvedValue(),
    pause: jest.fn()
  };
  window.Audio = jest.fn(() => keyboard);

  render(
    <FocusSoundMixer
      isOpen
      onClose={() => {}}
      projectId="test"
      isFocusActive
    />
  );

  fireEvent.change(screen.getByRole('slider', { name: /^focusSound\.keyboard/ }), {
    target: { value: '35' }
  });

  expect(window.Audio).toHaveBeenCalledWith('/sounds/chill-keyboard.mp3');
  expect(keyboard).toMatchObject({ loop: true, preload: 'auto', volume: 0.35 });
  expect(keyboard.play).toHaveBeenCalled();
});

test('kafe seviyesi gerçek ve döngülü kafe ortamı kaydını çalar', () => {
  const cafe = {
    loop: false,
    preload: '',
    volume: 0,
    play: jest.fn().mockResolvedValue(),
    pause: jest.fn()
  };
  window.Audio = jest.fn(() => cafe);

  render(
    <FocusSoundMixer
      isOpen
      onClose={() => {}}
      projectId="test"
      isFocusActive
    />
  );

  fireEvent.change(screen.getByRole('slider', { name: /^focusSound\.cafe/ }), {
    target: { value: '30' }
  });

  expect(window.Audio).toHaveBeenCalledWith('/sounds/chill-cafe.mp3');
  expect(cafe).toMatchObject({ loop: true, preload: 'auto', volume: 0.3 });
  expect(cafe.play).toHaveBeenCalled();
});
