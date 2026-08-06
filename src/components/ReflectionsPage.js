import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { themes } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import {
  buildReflection,
  containsPersonalInfo,
  isPublishable,
  orderReflections,
  REFLECTION_MAX_LENGTH,
  REFLECTION_PROMPTS,
  REPORT_REASONS,
  SUPPORT_TYPES
} from '../reflectionModel';
import { recordEffort } from '../catService';
import Header from './Header';
import './ReflectionsPage.css';

const FEED_LIMIT = 60;
const JOURNAL_LIMIT = 50;

const supportIcons = {
  with_you: '🫂',
  read: '👀',
  not_alone: '🤝',
  hug: '💛',
  rest_is_okay: '🌙',
  try_again: '🌱'
};

const formatDate = (value, language) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ReflectionsPage = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTheme, setActiveTheme] = useState('default');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [markedSensitive, setMarkedSensitive] = useState(false);
  const [feed, setFeed] = useState([]);
  const [journal, setJournal] = useState([]);
  const [mySupport, setMySupport] = useState({});
  const [hiddenIds, setHiddenIds] = useState([]);
  const [hiddenAuthorIds, setHiddenAuthorIds] = useState([]);
  const [tab, setTab] = useState('feed');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [reportingId, setReportingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (!currentUser) return;
      try {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid));
        const data = snapshot.exists() ? snapshot.data() : {};
        setActiveTheme(data.theme || 'default');
        setHiddenIds(data.hiddenReflectionIds || []);
        setHiddenAuthorIds(data.hiddenAuthorIds || []);
      } catch (loadError) {
        console.error('Ayarlar okunamadı:', loadError);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const theme = themes[activeTheme] || themes.default;
    const root = document.documentElement;
    [...new Set(Object.values(themes).flatMap(item => Object.keys(item.colors)))]
      .forEach(key => root.style.removeProperty(key));
    Object.entries(theme.colors).forEach(([key, value]) => root.style.setProperty(key, value));
    document.body.style.backgroundColor = theme.colors['--bg-color-pomodoro'];
  }, [activeTheme]);

  useEffect(() => {
    document.title = `${t('reflections.title')} - ${t('general.appName')}`;
  }, [t]);

  useEffect(() => {
    if (!user) {
      setFeed([]);
      return undefined;
    }
    return onSnapshot(
      query(collection(db, 'reflections'), orderBy('createdAt', 'desc'), limit(FEED_LIMIT)),
      snapshot => setFeed(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
      feedError => {
        console.error('Akış okunamadı:', feedError);
        setError(t('reflections.loadError'));
      }
    );
  // t akış aboneliğini yeniden kurmayı gerektirmez.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) {
      setJournal([]);
      return undefined;
    }
    return onSnapshot(
      query(collection(db, 'users', user.uid, 'journal'), orderBy('createdAt', 'desc'), limit(JOURNAL_LIMIT)),
      snapshot => setJournal(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
      journalError => console.error('Günlük okunamadı:', journalError)
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getDocs(query(collection(db, 'users', user.uid, 'supportGiven'), limit(200)))
      .then(snapshot => {
        if (!active) return;
        setMySupport(Object.fromEntries(snapshot.docs.map(item => [item.id, item.data().type])));
      })
      .catch(supportError => console.error('Destekler okunamadı:', supportError));
    return () => { active = false; };
  }, [user]);

  const visibleFeed = useMemo(
    () => orderReflections(feed, { hiddenIds, hiddenAuthorIds }),
    [feed, hiddenAuthorIds, hiddenIds]
  );

  const personalInfoWarning = containsPersonalInfo(body);

  const publish = async () => {
    if (!user || saving || !isPublishable(body)) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const reflection = buildReflection({
        authorId: user.uid,
        displayName: user.displayName,
        body,
        visibility,
        isSensitive: markedSensitive
      });

      if (reflection.visibility === 'private') {
        // Özel günlük topluluk akışına hiç yazılmaz.
        await addDoc(collection(db, 'users', user.uid, 'journal'), {
          ...reflection,
          createdAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'reflections'), {
          ...reflection,
          supportCount: 0,
          createdAt: serverTimestamp()
        });
      }

      await recordEffort(user, 'reflection_written').catch(effortError =>
        console.error('Katkı yazılamadı:', effortError));

      setBody('');
      setMarkedSensitive(false);
      setStatus(t('reflections.saved'));
    } catch (publishError) {
      console.error('İç döküm kaydedilemedi:', publishError);
      setError(t('reflections.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const giveSupport = async (reflection, type) => {
    if (!user || reflection.authorId === user.uid) return;
    const firstSupport = !mySupport[reflection.id];
    try {
      await setDoc(doc(db, 'reflections', reflection.id, 'support', user.uid), {
        userId: user.uid,
        type,
        createdAt: serverTimestamp()
      });
      // Sayaç görünmez; yalnızca az destek almış gönderileri öne almak için tutulur.
      if (firstSupport) {
        await updateDoc(doc(db, 'reflections', reflection.id), { supportCount: increment(1) });
      }
      await setDoc(doc(db, 'users', user.uid, 'supportGiven', reflection.id), {
        type,
        createdAt: serverTimestamp()
      });
      setMySupport(current => ({ ...current, [reflection.id]: type }));
      await recordEffort(user, 'support_given', { relatedPostId: reflection.id })
        .catch(effortError => console.error('Katkı yazılamadı:', effortError));
    } catch (supportError) {
      console.error('Destek gönderilemedi:', supportError);
      setError(t('reflections.supportError'));
    }
  };

  const hideReflection = useCallback(async (reflection, alsoAuthor) => {
    if (!user) return;
    setHiddenIds(current => [...current, reflection.id]);
    if (alsoAuthor) setHiddenAuthorIds(current => [...current, reflection.authorId]);
    await setDoc(doc(db, 'users', user.uid), {
      hiddenReflectionIds: arrayUnion(reflection.id),
      ...(alsoAuthor ? { hiddenAuthorIds: arrayUnion(reflection.authorId) } : {})
    }, { merge: true }).catch(hideError => console.error('Gizlenemedi:', hideError));
  }, [user]);

  const report = async (reflection, reason) => {
    if (!user) return;
    setReportingId(null);
    try {
      await addDoc(collection(db, 'reports'), {
        reflectionId: reflection.id,
        reporterId: user.uid,
        reason,
        createdAt: serverTimestamp()
      });
      setStatus(t('reflections.reported'));
    } catch (reportError) {
      console.error('Rapor gönderilemedi:', reportError);
      setError(t('reflections.reportError'));
    }
  };

  const removeOwn = async reflection => {
    if (!user) return;
    const path = tab === 'journal'
      ? doc(db, 'users', user.uid, 'journal', reflection.id)
      : doc(db, 'reflections', reflection.id);
    await deleteDoc(path).catch(deleteError => console.error('Silinemedi:', deleteError));
  };

  if (!user) {
    return (
      <div className={`app-container theme-${activeTheme}`}>
        <Header user={null} openModal={() => navigate('/')} handleLogout={() => navigate('/')} />
        <main className="reflections-page">
          <section className="card reflections-intro">
            <h1>{t('reflections.title')}</h1>
            <p>{t('reflections.guest')}</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
              {t('reflections.backHome')}
            </button>
          </section>
        </main>
      </div>
    );
  }

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
      <main className="reflections-page">
        <section className="card reflections-intro">
          <h1>{t('reflections.title')}</h1>
          <p>{t('reflections.subtitle')}</p>
        </section>

        <section className="card reflections-composer">
          <div className="reflections-prompts">
            {REFLECTION_PROMPTS.map(prompt => (
              <button
                key={prompt}
                type="button"
                className="reflections-prompt"
                onClick={() => setBody(current => (current ? current : `${t(`reflections.prompt.${prompt}`)} `))}
              >
                {t(`reflections.prompt.${prompt}`)}
              </button>
            ))}
          </div>

          <label className="reflections-label" htmlFor="reflection-body">
            {t('reflections.bodyLabel')}
          </label>
          <textarea
            id="reflection-body"
            value={body}
            maxLength={REFLECTION_MAX_LENGTH}
            rows={6}
            onChange={event => setBody(event.target.value)}
            placeholder={t('reflections.placeholder')}
          />
          <p className="reflections-counter">{body.length}/{REFLECTION_MAX_LENGTH}</p>

          <fieldset className="reflections-visibility">
            <legend>{t('reflections.visibilityLabel')}</legend>
            {['private', 'anonymous', 'public'].map(option => (
              <label key={option}>
                <input
                  type="radio"
                  name="reflection-visibility"
                  value={option}
                  checked={visibility === option}
                  onChange={() => setVisibility(option)}
                />
                <span>
                  <strong>{t(`reflections.visibility.${option}`)}</strong>
                  <small>{t(`reflections.visibilityHint.${option}`)}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="reflections-sensitive">
            <input
              type="checkbox"
              checked={markedSensitive}
              onChange={event => setMarkedSensitive(event.target.checked)}
            />
            {t('reflections.sensitiveLabel')}
          </label>

          <p className="reflections-privacy">{t('reflections.privacyNotice')}</p>
          {personalInfoWarning && visibility !== 'private' && (
            <p className="reflections-warning" role="alert">{t('reflections.personalInfoWarning')}</p>
          )}

          <div className="reflections-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={publish}
              disabled={saving || !isPublishable(body)}
            >
              {t(`reflections.submit.${visibility}`)}
            </button>
            {status && <span className="reflections-status">{status}</span>}
            {error && <span className="reflections-error" role="alert">{error}</span>}
          </div>
        </section>

        <nav className="reflections-tabs" aria-label={t('reflections.title')}>
          {['feed', 'journal'].map(item => (
            <button
              key={item}
              type="button"
              className={`reflections-tab${tab === item ? ' is-active' : ''}`}
              aria-pressed={tab === item}
              onClick={() => setTab(item)}
            >
              {t(`reflections.tab.${item}`)}
            </button>
          ))}
        </nav>

        <section className="reflections-list">
          {(tab === 'feed' ? visibleFeed : journal).map(reflection => (
            <article key={reflection.id} className="card reflection-item">
              <header>
                <span className="reflection-author">
                  {tab === 'journal'
                    ? t('reflections.yourNote')
                    : (reflection.visibility === 'public' && reflection.displayName
                      ? reflection.displayName
                      : t('reflections.anonymousAuthor'))}
                </span>
                <time>{formatDate(reflection.createdAt, language)}</time>
              </header>

              {reflection.isSensitive && (
                <details className="reflection-sensitive">
                  <summary>{t('reflections.sensitiveCover')}</summary>
                  <p>{reflection.body}</p>
                  <p className="reflection-resources">{t('reflections.crisisNote')}</p>
                </details>
              )}
              {!reflection.isSensitive && <p className="reflection-body">{reflection.body}</p>}

              {tab === 'feed' && reflection.authorId !== user.uid && (
                <div className="reflection-support">
                  {SUPPORT_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`reflection-support-btn${mySupport[reflection.id] === type ? ' is-active' : ''}`}
                      onClick={() => giveSupport(reflection, type)}
                      title={t(`reflections.support.${type}`)}
                    >
                      <span aria-hidden="true">{supportIcons[type]}</span>
                      {t(`reflections.support.${type}`)}
                    </button>
                  ))}
                </div>
              )}

              <footer className="reflection-footer">
                {reflection.authorId === user.uid ? (
                  <button type="button" className="reflection-link" onClick={() => removeOwn(reflection)}>
                    {t('reflections.delete')}
                  </button>
                ) : (
                  <>
                    <button type="button" className="reflection-link" onClick={() => hideReflection(reflection, false)}>
                      {t('reflections.hide')}
                    </button>
                    <button type="button" className="reflection-link" onClick={() => hideReflection(reflection, true)}>
                      {t('reflections.hideAuthor')}
                    </button>
                    <button
                      type="button"
                      className="reflection-link"
                      onClick={() => setReportingId(reportingId === reflection.id ? null : reflection.id)}
                    >
                      {t('reflections.report')}
                    </button>
                  </>
                )}
              </footer>

              {reportingId === reflection.id && (
                <div className="reflection-report">
                  {REPORT_REASONS.map(reason => (
                    <button key={reason} type="button" className="reflection-link" onClick={() => report(reflection, reason)}>
                      {t(`reflections.reason.${reason}`)}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}

          {(tab === 'feed' ? visibleFeed : journal).length === 0 && (
            <p className="reflections-empty">{t(`reflections.empty.${tab}`)}</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default ReflectionsPage;
