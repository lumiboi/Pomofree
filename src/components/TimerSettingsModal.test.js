import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import TimerSettingsModal from './TimerSettingsModal';

test('hızlı ayar modalı üç sayaç süresini kaydeder', () => {
  const onSave = jest.fn();
  render(
    <LanguageProvider>
      <TimerSettingsModal
        settings={{ pomodoro: 25, short: 5, long: 15 }}
        onSave={onSave}
        onClose={jest.fn()}
      />
    </LanguageProvider>
  );

  fireEvent.change(screen.getByRole('spinbutton', { name: 'Pomodoro Süresi (dakika)' }), { target: { value: '30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));

  expect(onSave).toHaveBeenCalledWith({ pomodoro: 30, short: 5, long: 15 });
});
