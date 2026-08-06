import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTranslation } from '../hooks/useTranslation';
import { MODERATION_STATUSES } from '../reflectionModel';
import Header from './Header';
import './ReflectionsPage.css';

/**
 * Basit moderasyon kuyruğu (plan §15, §8.4). Yalnızca moderators/{uid}
 * belgesi olan hesaplar raporları görebilir; kurallar da aynı şeyi doğrular.
 */
const ModerationPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isModerator, setIsModerator] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (!currentUser) {
        setIsModerator(false);
        return;
      }
      const moderator = await getDoc(doc(db, 'moderators', currentUser.uid)).catch(() => null);
      setIsModerator(Boolean(moderator?.exists()));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isModerator) return;
    let active = true;
    (async () => {
      try {
        const reports = await getDocs(query(
          collection(db, 'reports'),
          orderBy('createdAt', 'desc'),
          limit(100)
        ));
        const enriched = await Promise.all(reports.docs.map(async item => {
          const report = { id: item.id, ...item.data() };
          const target = await getDoc(doc(db, 'reflections', report.reflectionId)).catch(() => null);
          return {
            ...report,
            reflection: target?.exists() ? { id: target.id, ...target.data() } : null
          };
        }));
        if (active) setRows(enriched);
      } catch (loadError) {
        console.error('Moderasyon kuyruğu okunamadı:', loadError);
        if (active) setError(t('moderation.loadError'));
      }
    })();
    return () => { active = false; };
  // t kuyruk okumasını tekrarlamayı gerektirmez.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModerator]);

  const setStatus = async (row, status) => {
    if (!row.reflection) return;
    try {
      await updateDoc(doc(db, 'reflections', row.reflection.id), { moderationStatus: status });
      await updateDoc(doc(db, 'reports', row.id), { handled: true }).catch(() => {});
      setRows(current => current.map(item => (
        item.id === row.id
          ? { ...item, handled: true, reflection: { ...item.reflection, moderationStatus: status } }
          : item
      )));
    } catch (updateError) {
      console.error('Durum güncellenemedi:', updateError);
      setError(t('moderation.updateError'));
    }
  };

  if (isModerator === false) {
    return (
      <div className="app-container">
        <Header user={user} openModal={() => navigate('/')} handleLogout={() => navigate('/')} />
        <main className="reflections-page">
          <section className="card reflections-intro">
            <h1>{t('moderation.title')}</h1>
            <p>{t('moderation.noAccess')}</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        user={user}
        openModal={() => navigate('/')}
        handleLogout={async () => {
          await signOut(auth);
          navigate('/');
        }}
      />
      <main className="reflections-page">
        <section className="card reflections-intro">
          <h1>{t('moderation.title')}</h1>
          <p>{t('moderation.intro')}</p>
          {error && <p className="reflections-error" role="alert">{error}</p>}
        </section>

        {rows.map(row => (
          <article key={row.id} className="card reflection-item">
            <header>
              <span className="reflection-author">{t(`reflections.reason.${row.reason}`)}</span>
              <span className="reflection-kind">
                {row.reflection?.moderationStatus || t('moderation.missing')}
              </span>
            </header>
            <p className="reflection-body">{row.reflection?.body || t('moderation.missing')}</p>
            <footer className="reflection-footer">
              {MODERATION_STATUSES.map(status => (
                <button
                  key={status}
                  type="button"
                  className="reflection-link"
                  onClick={() => setStatus(row, status)}
                  disabled={!row.reflection}
                >
                  {t(`moderation.status.${status}`)}
                </button>
              ))}
            </footer>
          </article>
        ))}

        {rows.length === 0 && <p className="reflections-empty">{t('moderation.empty')}</p>}
      </main>
    </div>
  );
};

export default ModerationPage;
