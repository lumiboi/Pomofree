import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './FocusTools.css';

const INTERRUPTION_TYPES = [
  ['phone', 'focus.phone'],
  ['notification', 'focus.notification'],
  ['person', 'focus.person'],
  ['water', 'focus.water'],
  ['other-task', 'focus.otherTask'],
  ['internal', 'focus.internal'],
  ['technical', 'focus.technical'],
  ['other', 'focus.other']
];

const FocusTools = ({
  mode,
  isActive,
  session,
  onChange,
  onConvertToTask,
  onInterruption,
  onOpenMixer,
  breakTip
}) => {
  const { t } = useTranslation();
  const [panel, setPanel] = useState(null);
  const [distraction, setDistraction] = useState('');
  const [interruptionNote, setInterruptionNote] = useState('');
  const distractionRef = useRef(null);

  useEffect(() => {
    const openTool = event => setPanel(event.detail);
    window.addEventListener('pomofree:focus-tool', openTool);
    return () => window.removeEventListener('pomofree:focus-tool', openTool);
  }, []);

  useEffect(() => {
    if (panel === 'distraction') distractionRef.current?.focus();
  }, [panel]);

  if (mode !== 'pomodoro') {
    return breakTip ? (
      <section className="focus-tools break-coach" aria-live="polite">
        <span aria-hidden="true">◌</span>
        <div>
          <strong>{t('focus.smartBreak')}</strong>
          <p>{breakTip}</p>
        </div>
      </section>
    ) : null;
  }

  const addDistraction = event => {
    event.preventDefault();
    const text = distraction.trim().slice(0, 300);
    if (!text) return;
    onChange(current => ({
      ...current,
      distractions: [...current.distractions, {
        id: `${Date.now()}-${current.distractions.length}`,
        text,
        completed: false,
        at: new Date()
      }].slice(-50)
    }));
    setDistraction('');
  };

  const updateDistraction = (id, patch) => {
    onChange(current => ({
      ...current,
      distractions: current.distractions.map(item => (
        item.id === id ? { ...item, ...patch } : item
      ))
    }));
  };

  const removeDistraction = id => {
    onChange(current => ({
      ...current,
      distractions: current.distractions.filter(item => item.id !== id)
    }));
  };

  const recordInterruption = type => {
    const item = {
      id: `${Date.now()}-${session.interruptions.length}`,
      type,
      note: interruptionNote.trim().slice(0, 300),
      at: new Date()
    };
    onChange(current => ({
      ...current,
      interruptions: [...current.interruptions, item].slice(-50)
    }));
    setInterruptionNote('');
    setPanel(null);
    onInterruption?.(item);
  };

  return (
    <section className="focus-tools" aria-label={t('focus.tools')}>
      <header>
        <div>
          <span className={`focus-live-dot ${isActive ? 'active' : ''}`} aria-hidden="true" />
          <strong>{isActive ? t('focus.sessionActive') : t('focus.sessionReady')}</strong>
        </div>
        <small>
          {session.distractions.length} {t('focus.notes')} · {session.interruptions.length} {t('focus.interruptions')}
        </small>
      </header>

      <div className="focus-tool-actions">
        <button type="button" onClick={() => setPanel(panel === 'distraction' ? null : 'distraction')}>
          <span aria-hidden="true">＋</span>{t('focus.thoughtParking')}
          <kbd>D</kbd>
        </button>
        <button type="button" onClick={() => setPanel(panel === 'interruption' ? null : 'interruption')}>
          <span aria-hidden="true">!</span>{t('focus.interrupted')}
          <kbd>I</kbd>
        </button>
        <button type="button" onClick={onOpenMixer}>
          <span aria-hidden="true">♪</span>{t('focus.sounds')}
          <kbd>M</kbd>
        </button>
      </div>

      {panel === 'distraction' && (
        <form className="focus-inline-form" onSubmit={addDistraction}>
          <label htmlFor="distraction-note">{t('focus.thoughtPrompt')}</label>
          <div>
            <input
              ref={distractionRef}
              id="distraction-note"
              value={distraction}
              onChange={event => setDistraction(event.target.value)}
              maxLength={300}
              placeholder={t('focus.thoughtPlaceholder')}
            />
            <button type="submit">{t('focus.save')}</button>
          </div>
        </form>
      )}

      {panel === 'interruption' && (
        <div className="focus-interruption-form">
          <label htmlFor="interruption-note">{t('focus.interruptionReason')}</label>
          <input
            id="interruption-note"
            value={interruptionNote}
            onChange={event => setInterruptionNote(event.target.value)}
            maxLength={300}
            placeholder={t('focus.optionalNote')}
          />
          <div>
            {INTERRUPTION_TYPES.map(([type, label]) => (
              <button type="button" key={type} onClick={() => recordInterruption(type)}>
                {t(label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {session.distractions.length > 0 && (
        <ul className="focus-note-list">
          {session.distractions.map(item => (
            <li key={item.id} className={item.completed ? 'completed' : ''}>
              <button
                type="button"
                className="focus-note-check"
                onClick={() => updateDistraction(item.id, { completed: !item.completed })}
                aria-label={t('focus.completeNote')}
              >
                {item.completed ? '✓' : ''}
              </button>
              <span>{item.text}</span>
              <button
                type="button"
                onClick={() => {
                  onConvertToTask(item.text);
                  removeDistraction(item.id);
                }}
              >
                {t('focus.toTask')}
              </button>
              <button type="button" onClick={() => removeDistraction(item.id)} aria-label={t('focus.deleteNote')}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const SessionReviewModal = ({ session, onSubmit, onSkip, onContinue }) => {
  const { t } = useTranslation();
  const [completionStatus, setCompletionStatus] = useState('completed');
  const [focus, setFocus] = useState('normal');
  const [difficulty, setDifficulty] = useState('normal');
  const [energy, setEnergy] = useState('normal');
  const [note, setNote] = useState('');

  const scale = [
    ['low', t('focus.low')],
    ['normal', t('focus.normal')],
    ['high', t('focus.high')]
  ];
  const outcomes = [
    ['completed', t('focus.completed')],
    ['partially-completed', t('focus.partial')],
    ['not-completed', t('focus.notCompleted')],
    ['distracted', t('focus.distracted')],
    ['needs-rest', t('focus.needsRest')]
  ];

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-content session-review" role="dialog" aria-modal="true" aria-labelledby="session-review-title">
        <header>
          <div>
            <small>{t('focus.sessionComplete')}</small>
            <h2 id="session-review-title">{session.completionCriterion || t('focus.reviewTitle')}</h2>
          </div>
          <button type="button" onClick={onSkip} aria-label={t('general.close')}>×</button>
        </header>

        {session.type === 'short-start' && (
          <div className="emergency-next">
            <strong>{t('focus.fiveDone')}</strong>
            <div>
              <button type="button" onClick={() => onContinue(10)}>{t('focus.continueTen')}</button>
              <button type="button" onClick={() => onContinue('normal')}>{t('focus.switchNormal')}</button>
            </div>
          </div>
        )}

        <ReviewChoice label={t('focus.result')} options={outcomes} value={completionStatus} onChange={setCompletionStatus} />
        <ReviewChoice label={t('focus.focusLevel')} options={scale} value={focus} onChange={setFocus} />
        <ReviewChoice
          label={t('focus.difficulty')}
          options={[
            ['low', t('focus.easy')],
            ['normal', t('focus.normal')],
            ['high', t('focus.hard')]
          ]}
          value={difficulty}
          onChange={setDifficulty}
        />
        <ReviewChoice label={t('focus.energy')} options={scale} value={energy} onChange={setEnergy} />

        <label className="review-note">
          <span>{t('focus.reviewNote')}</span>
          <textarea value={note} onChange={event => setNote(event.target.value)} maxLength={500} />
        </label>
        <footer>
          <button type="button" className="btn btn-secondary" onClick={onSkip}>{t('focus.skip')}</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSubmit({ completionStatus, focus, difficulty, energy, note: note.trim() })}
          >
            {t('focus.saveReview')}
          </button>
        </footer>
      </div>
    </div>
  );
};

const ReviewChoice = ({ label, options, value, onChange }) => (
  <fieldset className="review-choice">
    <legend>{label}</legend>
    <div>
      {options.map(([id, text]) => (
        <button
          type="button"
          key={id}
          className={value === id ? 'active' : ''}
          onClick={() => onChange(id)}
          aria-pressed={value === id}
        >
          {text}
        </button>
      ))}
    </div>
  </fieldset>
);

export const CommandPalette = ({ onClose, actions }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const visible = actions.filter(action => (
    action.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  ));

  return (
    <div className="modal-overlay command-overlay" onClick={onClose}>
      <div className="command-palette" role="dialog" aria-modal="true" aria-label={t('focus.commandPalette')} onClick={event => event.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={t('focus.commandSearch')}
        />
        <div>
          {visible.map(action => (
            <button type="button" key={action.id} onClick={() => { action.run(); onClose(); }}>
              <span>{action.icon}</span>
              <strong>{action.label}</strong>
              {action.shortcut && <kbd>{action.shortcut}</kbd>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FocusTools;
