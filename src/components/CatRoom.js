import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { themes } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import {
  CAT_STAGES,
  DAILY_CONTRIBUTION_CAP,
  EFFORT_CONTRIBUTION,
  getCatMood,
  getCatStage
} from '../effortModel';
import { fetchCollectiveCat, subscribeCollectiveCat, subscribeContributors } from '../catService';
import Header from './Header';
import Icon from './Icon';
import './CatRoom.css';

const STAGE_ICONS = {
  kitten: 'cat',
  bowl: 'bowl',
  cushion: 'cushion',
  mouse: 'mouse',
  window: 'window',
  shelf: 'shelf',
  plants: 'plants',
  playground: 'playground',
  wall: 'wall',
  room: 'room'
};

// Katkı tablosu: değerleri modelden okuyoruz ki metin ile kod ayrışmasın.
const EFFORT_ROWS = [
  'focus_started',
  'focus_completed',
  'focus_retried',
  'focus_stopped',
  'rest_chosen',
  'reflection_written',
  'support_given',
  'returned_after_break',
  'weekly_review'
];

const relativeTime = (value, language) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return '';
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  const formatter = new Intl.RelativeTimeFormat(language === 'tr' ? 'tr' : 'en', { numeric: 'auto' });
  if (minutes < 60) return formatter.format(-minutes, 'minute');
  if (minutes < 60 * 24) return formatter.format(-Math.round(minutes / 60), 'hour');
  return formatter.format(-Math.round(minutes / (60 * 24)), 'day');
};

/**
 * Kedi odası (plan §12.4): güncel aşama, açılan eşyalar, dönem hedefi,
 * sistemin nasıl işlediği ve bugün kediye dokunanlar.
 */
const CatRoom = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTheme, setActiveTheme] = useState('default');
  const [cat, setCat] = useState({
    totalContribution: 0,
    dailyContribution: 0,
    weeklyContribution: 0,
    seasonContribution: 0,
    seasonId: '',
    updatedAt: null
  });
  const [contributors, setContributors] = useState([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (!currentUser) return;
      const snapshot = await getDoc(doc(db, 'users', currentUser.uid)).catch(() => null);
      if (snapshot?.exists()) setActiveTheme(snapshot.data().theme || 'default');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => subscribeCollectiveCat(
    current => {
      setCat(current);
      setFailed(false);
    },
    error => {
      console.error('Kedi odası okunamadı:', error);
      setFailed(true);
    }
  ), []);

  useEffect(() => subscribeContributors(
    setContributors,
    error => console.error('Katkı listesi okunamadı:', error)
  ), []);

  useEffect(() => {
    const theme = themes[activeTheme] || themes.default;
    const root = document.documentElement;
    [...new Set(Object.values(themes).flatMap(item => Object.keys(item.colors)))]
      .forEach(key => root.style.removeProperty(key));
    Object.entries(theme.colors).forEach(([key, value]) => root.style.setProperty(key, value));
    document.body.style.backgroundColor = theme.colors['--bg-color-pomodoro'];
  }, [activeTheme]);

  useEffect(() => {
    document.title = `${t('catRoom.title')} - ${t('general.appName')}`;
  }, [t]);

  const stage = useMemo(() => getCatStage(cat.totalContribution), [cat.totalContribution]);
  const mood = getCatMood({ communityContribution: cat.dailyContribution });
  const percent = Math.round(stage.progress * 100);
  const remaining = stage.nextThreshold ? Math.max(0, stage.nextThreshold - cat.totalContribution) : 0;

  const retry = async () => {
    const current = await fetchCollectiveCat().catch(() => null);
    if (current) {
      setCat(current);
      setFailed(false);
    }
  };

  return (
    <div className={`app-container theme-${activeTheme}`}>
      <Header
        user={user}
        openModal={() => navigate('/')}
        handleLogout={async () => {
          await signOut(auth);
          navigate('/');
        }}
      />
      <main className="cat-room">
        <section className="card cat-room-hero">
          <div className="cat-room-portrait">
            <img
              src={mood === 'happy' || mood === 'playful' ? '/pomocat-happy.webp' : '/pomocat-normal.webp'}
              alt={t(`cat.mood.${mood}`)}
              width="320"
              height="240"
              loading="lazy"
              decoding="async"
            />
            <span className="cat-room-mood">{t(`cat.mood.${mood}`)}</span>
          </div>

          <div className="cat-room-summary">
            <p className="cat-room-kicker">{t('catRoom.season')} {cat.seasonId || '—'}</p>
            <h1>{t('catRoom.title')}</h1>
            <p className="cat-room-intro">{t('catRoom.intro')}</p>

            <div className="cat-room-stagebar">
              <div className="cat-room-stagebar-head">
                <strong>
                  <Icon name={STAGE_ICONS[stage.key]} size={18} />
                  {t('cat.stageLabel')} {stage.stage} · {t(`cat.stage.${stage.key}`)}
                </strong>
                <span>{cat.totalContribution}{stage.nextThreshold ? ` / ${stage.nextThreshold}` : ''}</span>
              </div>
              <div
                className="cat-room-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label={t('cat.progressLabel')}
              >
                <span style={{ width: `${percent}%` }} />
              </div>
              {stage.isComplete ? (
                <p className="cat-room-goal">{t('cat.roomComplete')}</p>
              ) : (
                <p className="cat-room-goal">
                  {t('catRoom.seasonGoal')} {t(`cat.stage.${stage.nextKey}`)} ·{' '}
                  {t('catRoom.remaining')} {remaining} · {t('cat.slowTogether')}
                </p>
              )}
            </div>

            <div className="cat-room-stats">
              <div>
                <strong>{cat.dailyContribution}</strong>
                <span>{t('catRoom.todayTogether')}</span>
              </div>
              <div>
                <strong>{cat.weeklyContribution}</strong>
                <span>{t('catRoom.thisWeek')}</span>
              </div>
              <div>
                <strong>{cat.seasonContribution}</strong>
                <span>{t('catRoom.thisMonth')}</span>
              </div>
              <div>
                <strong>{cat.totalContribution}</strong>
                <span>{t('catRoom.allTime')}</span>
              </div>
              <div>
                <strong>{contributors.length}</strong>
                <span>{t('catRoom.handsOnDeck')}</span>
              </div>
            </div>

            {failed && (
              <p className="cat-room-error" role="alert">
                {t('cat.offline')}{' '}
                <button type="button" className="btn btn-secondary" onClick={retry}>
                  <Icon name="refresh" size={16} /> {t('audio.retry')}
                </button>
              </p>
            )}
            <p className="cat-room-sync">
              {t('catRoom.sharedNumber')} {cat.updatedAt ? relativeTime(cat.updatedAt, language) : ''}
            </p>
          </div>
        </section>

        <section className="card cat-room-how">
          <h2>{t('catRoom.howTitle')}</h2>
          <p>{t('catRoom.how1')}</p>
          <p>{t('catRoom.how2')}</p>
          <p>{t('catRoom.how3')}</p>

          <ul className="cat-room-effort">
            {EFFORT_ROWS.map(type => (
              <li key={type}>
                <span>{t(`catRoom.effort.${type}`)}</span>
                <em>+{EFFORT_CONTRIBUTION[type]}</em>
              </li>
            ))}
          </ul>

          <ul className="cat-room-fineprint">
            <li>{t('catRoom.rule1')} {DAILY_CONTRIBUTION_CAP}.</li>
            <li>{t('catRoom.rule2')}</li>
            <li>{t('catRoom.rule3')}</li>
            <li>{t('catRoom.rule4')}</li>
          </ul>
        </section>

        <section className="card cat-room-items">
          <h2>{t('catRoom.itemsTitle')}</h2>
          <p className="cat-room-note">{t('catRoom.itemsNote')}</p>
          <ol className="cat-room-timeline">
            {CAT_STAGES.map(item => {
              const unlocked = item.stage <= stage.stage;
              const isNext = item.stage === stage.stage + 1;
              return (
                <li key={item.key} className={`${unlocked ? 'is-unlocked' : ''}${isNext ? ' is-next' : ''}`}>
                  <span className="cat-room-item-icon"><Icon name={STAGE_ICONS[item.key]} size={20} /></span>
                  <span className="cat-room-item-name">{t(`cat.stage.${item.key}`)}</span>
                  <span className="cat-room-item-state">
                    {unlocked ? t('catRoom.unlocked') : `${item.threshold} ${t('catRoom.atContribution')}`}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="card cat-room-hands">
          <h2>{t('catRoom.handsTitle')}</h2>
          <p className="cat-room-note">{t('catRoom.handsNote')}</p>
          {contributors.length === 0 ? (
            <p className="cat-room-note">{t('catRoom.handsEmpty')}</p>
          ) : (
            <ul className="cat-room-contributors">
              {contributors.map(person => (
                <li key={person.id}>
                  <span className="cat-room-avatar" aria-hidden="true">
                    {(person.displayName || '?').trim().charAt(0).toLocaleUpperCase('tr-TR')}
                  </span>
                  <span className="cat-room-contributor-name">{person.displayName}</span>
                  <span className="cat-room-contributor-time">{relativeTime(person.lastContributionAt, language)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="cat-room-note cat-room-privacy">{t('catRoom.handsPrivacy')}</p>
        </section>

        <section className="card cat-room-memories">
          <h2>{t('catRoom.memoriesTitle')}</h2>
          <p>{t('catRoom.memoriesText')}</p>
          <div className="cat-room-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/reflections')}>
              {t('cat.actionReflect')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              {t('reflections.backHome')}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CatRoom;
