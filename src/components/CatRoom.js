import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { themes } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { CAT_STAGES, getCatMood, getCatStage } from '../effortModel';
import { subscribeCollectiveCat } from '../catService';
import Header from './Header';
import './CatRoom.css';

/**
 * Kedi odası (plan §12.4): güncel aşama, açılan eşyalar, dönem hedefi ve
 * topluluğun bugünkü katkısı. Kişisel sıralama veya skor gösterilmez.
 */
const CatRoom = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTheme, setActiveTheme] = useState('default');
  const [cat, setCat] = useState({ totalContribution: 0, dailyContribution: 0, seasonId: '' });

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
    setCat,
    error => console.error('Kedi odası okunamadı:', error)
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

  const stage = getCatStage(cat.totalContribution);
  const mood = getCatMood({ communityContribution: cat.dailyContribution });
  const percent = Math.round(stage.progress * 100);

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
          <img
            src={mood === 'happy' || mood === 'playful' ? '/pomocat-happy.webp' : '/pomocat-normal.webp'}
            alt={t(`cat.mood.${mood}`)}
            width="320"
            height="240"
            loading="lazy"
            decoding="async"
          />
          <div>
            <h1>{t('catRoom.title')}</h1>
            <p>{t('catRoom.intro')}</p>
            <p className="cat-room-season">
              {t('catRoom.season')} {cat.seasonId || '—'} · {t('cat.stageLabel')} {stage.stage}
            </p>
            {!stage.isComplete && (
              <>
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
                <p className="cat-room-goal">
                  {t('catRoom.seasonGoal')} {t(`cat.stage.${stage.nextKey}`)} · {t('cat.slowTogether')}
                </p>
              </>
            )}
            <p className="cat-room-today">
              {t('catRoom.todayTogether')} {cat.dailyContribution} · {t(`cat.mood.${mood}`)}
            </p>
          </div>
        </section>

        <section className="card cat-room-items">
          <h2>{t('catRoom.itemsTitle')}</h2>
          <p className="cat-room-note">{t('catRoom.itemsNote')}</p>
          <ul>
            {CAT_STAGES.map(item => {
              const unlocked = item.stage <= stage.stage;
              return (
                <li key={item.key} className={unlocked ? 'is-unlocked' : ''}>
                  <span aria-hidden="true">{unlocked ? '●' : '○'}</span>
                  <span>{t(`cat.stage.${item.key}`)}</span>
                  <small>{unlocked ? t('catRoom.unlocked') : t('catRoom.locked')}</small>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card cat-room-memories">
          <h2>{t('catRoom.memoriesTitle')}</h2>
          <p>{t('catRoom.memoriesText')}</p>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/reflections')}>
            {t('cat.actionReflect')}
          </button>
        </section>
      </main>
    </div>
  );
};

export default CatRoom;
