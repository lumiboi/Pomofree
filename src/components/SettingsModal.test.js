import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { DEFAULT_FOCUS_SETTINGS } from '../focusModel';
import SettingsModal from './SettingsModal';

test('profil fotoğrafını URL veya dosya olarak alır', () => {
  const setProfilePhoto = jest.fn();
  const handleProfileFile = jest.fn();
  render(
    <LanguageProvider>
      <SettingsModal
        closeModal={jest.fn()}
        tempSettings={DEFAULT_FOCUS_SETTINGS}
        setTempSettings={jest.fn()}
        handleSaveSettings={jest.fn()}
        profilePhoto=""
        setProfilePhoto={setProfilePhoto}
        handleProfileFile={handleProfileFile}
      />
    </LanguageProvider>
  );

  fireEvent.change(screen.getByLabelText('Profil fotoğrafı adresi'), { target: { value: 'https://cdn.example.com/me.webp' } });
  expect(setProfilePhoto).toHaveBeenCalledWith('https://cdn.example.com/me.webp');

  const file = new File(['photo'], 'me.webp', { type: 'image/webp' });
  fireEvent.change(screen.getByLabelText('Fotoğraf yükle'), { target: { files: [file] } });
  expect(handleProfileFile).toHaveBeenCalledWith(file);
});
