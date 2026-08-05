import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { safeProfilePhoto } from '../profilePhoto';

const SettingsModal = ({
  closeModal,
  tempSettings,
  setTempSettings,
  handleSaveSettings,
  handleExportData,
  handleDeleteAccount,
  profilePhoto,
  setProfilePhoto,
  handleProfileFile,
  profilePhotoError
}) => {
  const { t } = useTranslation();
  const photoPreview = safeProfilePhoto(profilePhoto);
  const update = patch => setTempSettings({ ...tempSettings, ...patch });
  const updateShortcut = (name, value) => update({
    shortcuts: {
      ...tempSettings.shortcuts,
      [name]: value.trim().slice(-1).toLocaleLowerCase()
    }
  });
  const updateBreakCategory = (name, checked) => update({
    breakCategories: {
      ...tempSettings.breakCategories,
      [name]: checked
    }
  });
  const updateNotificationType = (name, checked) => update({
    notificationTypes: {
      ...tempSettings.notificationTypes,
      [name]: checked
    }
  });

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('settings.title')}</h2>
        {setProfilePhoto && (
          <>
            <h3>{t('settings.profileSection')}</h3>
            <div className="profile-settings">
              <div className="profile-settings-preview" aria-hidden="true">
                {photoPreview ? <img src={photoPreview} alt="" referrerPolicy="no-referrer" /> : '👤'}
              </div>
              <div className="profile-settings-controls">
                <label htmlFor="profile-photo-url">{t('settings.profilePhotoUrl')}</label>
                <input
                  id="profile-photo-url"
                  type="url"
                  value={profilePhoto}
                  onChange={event => setProfilePhoto(event.target.value)}
                  placeholder={t('settings.profilePhotoUrlPlaceholder')}
                  maxLength={100000}
                />
                <div className="profile-settings-actions">
                  <label className="btn btn-secondary" htmlFor="profile-photo-file">
                    {t('settings.uploadPhoto')}
                  </label>
                  <input
                    id="profile-photo-file"
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label={t('settings.uploadPhoto')}
                    onChange={event => event.target.files?.[0] && handleProfileFile(event.target.files[0])}
                  />
                  {profilePhoto && (
                    <button type="button" className="btn btn-secondary" onClick={() => setProfilePhoto('')}>
                      {t('settings.removePhoto')}
                    </button>
                  )}
                </div>
                <p className="settings-helper">{t('settings.profilePhotoHelp')}</p>
                {profilePhotoError && <p className="settings-error" role="alert">{profilePhotoError}</p>}
              </div>
            </div>
          </>
        )}
        <h3>{t('settings.timerSection')}</h3>
        <div className="form-group">
          <label>{t('settings.pomodoro')}</label>
          <input 
            type="number" 
            min="1"
            value={tempSettings.pomodoro} 
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value));
              update({ pomodoro: value });
            }} 
          />
        </div>
        <div className="form-group">
          <label>{t('settings.shortBreak')}</label>
          <input 
            type="number" 
            min="1"
            value={tempSettings.short} 
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value));
              update({ short: value });
            }} 
          />
        </div>
        <div className="form-group">
          <label>{t('settings.longBreak')}</label>
          <input 
            type="number" 
            min="1"
            value={tempSettings.long} 
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value));
              update({ long: value });
            }} 
          />
        </div>
        <div className="form-group">
          <label>{t('settings.emergencyMinutes')}</label>
          <input
            type="number"
            min="3"
            max="10"
            value={tempSettings.emergencyMinutes}
            onChange={event => update({
              emergencyMinutes: Math.min(10, Math.max(3, Number(event.target.value) || 5))
            })}
          />
        </div>

        <h3>{t('settings.socialSection')}</h3>
        <SettingToggle
          label={t('settings.socialProfilePublic')}
          checked={tempSettings.socialProfilePublic}
          onChange={checked => update({ socialProfilePublic: checked })}
        />
        <p className="settings-helper">{t('settings.socialProfileHelp')}</p>

        <h3>{t('settings.focusFlow')}</h3>
        <SettingToggle label={t('settings.goalRequired')} checked={tempSettings.goalRequired} onChange={checked => update({ goalRequired: checked })} />
        <SettingToggle label={t('settings.notifications')} checked={tempSettings.notifications} onChange={checked => update({ notifications: checked })} />
        {tempSettings.notifications && (
          <div className="settings-subgroup">
            <SettingToggle label={t('settings.notifySessionEnd')} checked={tempSettings.notificationTypes?.sessionEnd} onChange={checked => updateNotificationType('sessionEnd', checked)} />
            <SettingToggle label={t('settings.notifyBreakEnd')} checked={tempSettings.notificationTypes?.breakEnd} onChange={checked => updateNotificationType('breakEnd', checked)} />
            <SettingToggle label={t('settings.notifyLongBreak')} checked={tempSettings.notificationTypes?.longBreak} onChange={checked => updateNotificationType('longBreak', checked)} />
            <SettingToggle label={t('settings.notifyRoomStarted')} checked={tempSettings.notificationTypes?.roomStarted} onChange={checked => updateNotificationType('roomStarted', checked)} />
            <SettingToggle label={t('settings.notifyParticipantJoined')} checked={tempSettings.notificationTypes?.participantJoined} onChange={checked => updateNotificationType('participantJoined', checked)} />
          </div>
        )}
        <SettingToggle label={t('settings.adaptive')} checked={tempSettings.adaptiveSuggestions} onChange={checked => update({ adaptiveSuggestions: checked })} />
        {tempSettings.adaptiveSuggestions && (
          <div className="form-group">
            <label>{t('settings.adaptiveFrequency')}</label>
            <select value={tempSettings.adaptiveFrequency} onChange={event => update({ adaptiveFrequency: event.target.value })}>
              <option value="frequent">{t('settings.frequencyFrequent')}</option>
              <option value="balanced">{t('settings.frequencyBalanced')}</option>
              <option value="rare">{t('settings.frequencyRare')}</option>
            </select>
          </div>
        )}
        <SettingToggle label={t('settings.breakTips')} checked={tempSettings.breakTips} onChange={checked => update({ breakTips: checked })} />
        {tempSettings.breakTips && (
          <div className="settings-subgroup">
            <SettingToggle label={t('settings.breakMovement')} checked={tempSettings.breakCategories?.movement} onChange={checked => updateBreakCategory('movement', checked)} />
            <SettingToggle label={t('settings.breakEyes')} checked={tempSettings.breakCategories?.eyes} onChange={checked => updateBreakCategory('eyes', checked)} />
            <SettingToggle label={t('settings.breakHydration')} checked={tempSettings.breakCategories?.hydration} onChange={checked => updateBreakCategory('hydration', checked)} />
            <SettingToggle label={t('settings.breakPlanning')} checked={tempSettings.breakCategories?.planning} onChange={checked => updateBreakCategory('planning', checked)} />
          </div>
        )}
        <div className="form-group">
          <label>{t('settings.interruptionAction')}</label>
          <select value={tempSettings.interruptionAction} onChange={event => update({ interruptionAction: event.target.value })}>
            <option value="continue">{t('settings.keepRunning')}</option>
            <option value="pause">{t('settings.autoPause')}</option>
            <option value="ask">{t('settings.askMe')}</option>
          </select>
        </div>

        <h3>{t('settings.accessibility')}</h3>
        <SettingToggle label={t('settings.reducedMotion')} checked={tempSettings.reducedMotion} onChange={checked => update({ reducedMotion: checked })} />
        <SettingToggle label={t('settings.highContrast')} checked={tempSettings.highContrast} onChange={checked => update({ highContrast: checked })} />
        <div className="form-group">
          <label>{t('settings.colorVision')}</label>
          <select value={tempSettings.colorVision} onChange={event => update({ colorVision: event.target.value })}>
            <option value="default">{t('settings.colorDefault')}</option>
            <option value="deuteranopia">{t('settings.colorGreen')}</option>
            <option value="protanopia">{t('settings.colorRed')}</option>
            <option value="tritanopia">{t('settings.colorBlue')}</option>
          </select>
        </div>

        <h3>{t('settings.shortcuts')}</h3>
        <SettingToggle label={t('settings.shortcutsEnabled')} checked={tempSettings.shortcutsEnabled} onChange={checked => update({ shortcutsEnabled: checked })} />
        {tempSettings.shortcutsEnabled && (
          <div className="shortcut-grid">
            {[
              ['task', t('settings.shortcutTask')],
              ['distraction', t('settings.shortcutDistraction')],
              ['interruption', t('settings.shortcutInterruption')],
              ['project', t('settings.shortcutProject')],
              ['taskSelect', t('settings.shortcutTaskSelect')],
              ['mixer', t('settings.shortcutMixer')]
            ].map(([name, label]) => (
              <label key={name}>
                <span>{label}</span>
                <input
                  value={tempSettings.shortcuts?.[name] || ''}
                  maxLength={1}
                  onChange={event => updateShortcut(name, event.target.value)}
                />
              </label>
            ))}
          </div>
        )}

        {handleExportData && (
          <>
            <h3>{t('settings.data')}</h3>
            <p className="settings-helper">{t('settings.dataDescription')}</p>
            <div className="settings-data-actions">
              <button type="button" onClick={() => handleExportData('csv')} className="btn btn-secondary">CSV</button>
              <button type="button" onClick={() => handleExportData('json')} className="btn btn-secondary">JSON</button>
              {handleDeleteAccount && (
                <button type="button" onClick={handleDeleteAccount} className="btn settings-delete-account">
                  {t('settings.deleteAccount')}
                </button>
              )}
            </div>
          </>
        )}

        <footer className="settings-footer">
          <button onClick={handleSaveSettings} className="btn btn-primary">{t('settings.save')}</button>
          <button onClick={closeModal} className="btn btn-secondary">{t('settings.cancel')}</button>
        </footer>
      </div>
    </div>
  );
};

const SettingToggle = ({ label, checked, onChange }) => (
  <label className="settings-toggle">
    <span>{label}</span>
    <input type="checkbox" checked={Boolean(checked)} onChange={event => onChange(event.target.checked)} />
  </label>
);

export default SettingsModal;
