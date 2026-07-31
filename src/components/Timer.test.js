import React from 'react';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import Timer from './Timer';

const renderTimer = isActive => render(
  <LanguageProvider>
    <Timer
      mode="pomodoro"
      time={900}
      isActive={isActive}
      switchMode={jest.fn()}
      toggleTimer={jest.fn()}
      formatTime={() => '15:00'}
      totalTime={900}
    />
  </LanguageProvider>
);

test('zamanlayıcı çalışırken play yerine stop simgesi gösterir', () => {
  const { rerender } = renderTimer(false);
  expect(screen.getByRole('button', { name: 'BAŞLAT' })).toHaveTextContent('▶');

  rerender(
    <LanguageProvider>
      <Timer
        mode="pomodoro"
        time={899}
        isActive
        switchMode={jest.fn()}
        toggleTimer={jest.fn()}
        formatTime={() => '14:59'}
        totalTime={900}
      />
    </LanguageProvider>
  );

  expect(screen.getByRole('button', { name: 'DURDUR' })).toHaveTextContent('■');
});
