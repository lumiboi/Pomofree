import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc,
  arrayUnion,
  collection,
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
  containsPersonalInfo,
  FEED_TABS,
  getCatFeedMessage,
  isPublishable,
  looksSensitive,
  orderReflections,
  REFLECTION_KINDS,
  REFLECTION_MAX_LENGTH,
  REFLECTION_PROMPTS,
  REPORT_REASONS,
  SUPPORT_TYPES
} from '../reflectionModel';
import { deleteReflection, publishReflection, readOwnedReflectionIds } from '../reflectionService';
import { recordEffort, saveCheckIn } from '../catService';
import { createCheckIn, isWeeklyReviewDue, toDayKey } from '../effortModel';
import Header from './Header';
import DailyCheckIn from './DailyCheckIn';
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
  const [kind, setKind] = useState('reflection');
  const [markedSensitive, setMarkedSensitive] = useState(false);
  const [sensitiveConfirmed, setSensitiveConfirmed] = useState(false);
  const [feed, setFeed] = useState([]);
  const [journal, setJournal] = useState([]);
  const [ownedIds, setOwnedIds] = useState([]);
  const [mySupport, setMySupport] = useState({});
  const [hiddenIds, setHiddenIds] = useState([]);
  const [hiddenAuthorIds, setHiddenAuthorIds] = useState([]);
  const [tab, setTab] = useState('today');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [reportingId, setReportingId] = useState(null);
  const [capacity, setCapacity] = useState('');
  const [restedToday, setRestedToday] = useState(false);
  const [weeklyReviewDue, setWeeklyReviewDue] = useState(false);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [socialProfilePublic, setSocialProfilePublic] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (!currentUser) return;
      try {
        const [snapshot, checkInSnap, owned] = await Promise.all([
          getDoc(doc(db, 'users', currentUser.uid)),
          getDoc(doc(db, 'users', currentUser.uid, 'checkIns', toDayKey())),
          readOwnedReflectionIds(currentUser.uid)
        ]);
        const data = snapshot.exists() ? snapshot.data() : {};
        setActiveTheme(data.theme || 'default');
        setHiddenIds(data.hiddenReflectionIds || []);
        setHiddenAuthorIds(data.hiddenAuthorIds || []);
        setGamificationEnabled(data.settings?.gamification !== false);
        setSocialProfilePublic(data.settings?.socialProfilePublic === true);
        setWeeklyReviewDue(isWeeklyReviewDue(data.lastWeeklyReviewAt));
        setOwnedIds(owned);
        if (checkInSnap.exists()) {
          setCapacity(checkInSnap.data().capacity || '');
          setRestedToday(Boolean(checkInSnap.data().restChosen));
        }
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
    if (!user) return undefined;
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
    () => orderReflections(feed, { hiddenIds, hiddenAuthorIds, tab, ownedIds }),
    [feed, hiddenAuthorIds, hiddenIds, ownedIds, tab]
  );
  // Kedinin cümlesi seçili sekmeye değil, günün tamamına bakar.
  const catMessage = useMemo(() => getCatFeedMessage(feed), [feed]);

  const personalInfoWarning = containsPersonalInfo(body);
  const sensitiveDetected = markedSensitive || looksSensitive(body);
  const needsSensitiveConfirm = sensitiveDetected && visibility !== 'private' && !sensitiveConfirmed;

  const logEffort = useCallback(async (type, extra = {}) => {
    if (!user) return;
    await recordEffort(user, type, {
      ...extra,
      gamificationEnabled,
      displayName: user.displayName,
      publicProfile: socialProfilePublic
    }).catch(effortError => console.error('Katkı yazılamadı:', effortError));
  }, [gamificationEnabled, socialProfilePublic, user]);

  const publish = async () => {
    if (!user || saving || !isPublishable(body) || needsSensitiveConfirm) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const created = await publishReflection(user, {
        body,
        visibility,
        kind,
        isSensitive: markedSensitive
      });
      if (created.visibility !== 'private') setOwnedIds(current => [...current, created.id]);

      await logEffort('reflection_written', { relatedPostId: created.id });

      setBody('');
      setMarkedSensitive(false);
      setSensitiveConfirmed(false);
      setStatus(t('reflections.saved'));
    } catch (publishError) {
      console.error('İç döküm kaydedilemedi:', publishError);
      setError(t('reflections.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const giveSupport = async (reflection, type) => {
    if (!user || ownedIds.includes(reflection.id) || reflection.authorId === user.uid) return;
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
      await logEffort('support_given', { relatedPostId: reflection.id });
    } catch (supportError) {
      console.error('Destek gönderilemedi:', supportError);
      setError(t('reflections.supportError'));
    }
  };

  const hideReflection = useCallback(async (reflection, alsoAuthor) => {
    if (!user) return;
    setHiddenIds(current => [...current, reflection.id]);
    if (alsoAuthor && reflection.authorId) {
      setHiddenAuthorIds(current => [...current, reflection.authorId]);
    }
    await setDoc(doc(db, 'users', user.uid), {
      hiddenReflectionIds: arrayUnion(reflection.id),
      ...(alsoAuthor && reflection.authorId ? { hiddenAuthorIds: arrayUnion(reflection.authorId) } : {})
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

  const removeOwn = async (reflection, fromJournal) => {
    if (!user) return;
    await deleteReflection(user.uid, reflection.id, { fromJournal })
      .catch(deleteError => console.error('Silinemedi:', deleteError));
    if (!fromJournal) setOwnedIds(current => current.filter(id => id !== reflection.id));
  };

  const selectCapacity = async level => {
    setCapacity(level);
    if (!user) return;
    await saveCheckIn(user.uid, { ...createCheckIn(level), restChosen: restedToday })
      .catch(saveError => console.error('Kapasite kaydedilemedi:', saveError));
  };

  const completeWeeklyReview = async () => {
    if (!user) return;
    setWeeklyReviewDue(false);
    await setDoc(doc(db, 'users', user.uid), { lastWeeklyReviewAt: new Date() }, { merge: true })
      .catch(saveError => console.error('Öz değerlendirme kaydedilemedi:', saveError));
    await logEffort('weekly_review');
    setStatus(t('reflections.weeklyReviewDone'));
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

  const isJournalTab = tab === 'journal';
  const listed = isJournalTab ? journal : visibleFeed;

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
          <p className="reflections-cat-line">🐈 {t(`reflections.catMessage.${catMessage}`)}</p>
        </section>

        <DailyCheckIn
          capacity={capacity}
          onSelect={selectCapacity}
          onApplySuggestion={minutes => navigate('/', { state: { focusMinutes: minutes } })}
        />

        {weeklyReviewDue && gamificationEnabled && (
          <section className="card reflections-weekly">
            <div>
              <h2>{t('reflections.weeklyReviewTitle')}</h2>
              <p>{t('reflections.weeklyReviewText')}</p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={completeWeeklyReview}>
              {t('reflections.weeklyReviewAction')}
            </button>
          </section>
        )}

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
            onChange={event => {
              setBody(event.target.value);
              setSensitiveConfirmed(false);
            }}
            placeholder={t('reflections.placeholder')}
          />
          <p className="reflections-counter">{body.length}/{REFLECTION_MAX_LENGTH}</p>

          <fieldset className="reflections-kind">
            <legend>{t('reflections.kindLabel')}</legend>
            {REFLECTION_KINDS.map(option => (
              <label key={option}>
                <input
                  type="radio"
                  name="reflection-kind"
                  value={option}
                  checked={kind === option}
                  onChange={() => setKind(option)}
                />
                {t(`reflections.kind.${option}`)}
              </label>
            ))}
          </fieldset>

          <fieldset className="reflections-visibility">
            <legend>{t('reflections.visibilityLabel')}</legend>
            {['private', 'anonymous', 'public'].map(option => (
              <label key={option}>
                <input
                  type="radio"
                  name="reflection-visibility"
                  value={option}
                  checked={visibility === option}
                  onChange={() => {
                    setVisibility(option);
                    setSensitiveConfirmed(false);
                  }}
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
              onChange={event => {
                setMarkedSensitive(event.target.checked);
                setSensitiveConfirmed(false);
              }}
            />
            {t('reflections.sensitiveLabel')}
          </label>

          <p className="reflections-privacy">{t('reflections.privacyNotice')}</p>
          {personalInfoWarning && visibility !== 'private' && (
            <p className="reflections-warning" role="alert">{t('reflections.personalInfoWarning')}</p>
          )}

          {needsSensitiveConfirm && (
            <div className="reflections-confirm" role="alert">
              <p>{t('reflections.sensitiveConfirm')}</p>
              <p className="reflections-crisis">{t('reflections.crisisNote')}</p>
              <div>
                <button type="button" className="btn btn-secondary" onClick={() => setSensitiveConfirmed(true)}>
                  {t('reflections.sensitiveConfirmShare')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setVisibility('private');
                    setSensitiveConfirmed(true);
                  }}
                >
                  {t('reflections.sensitiveKeepPrivate')}
                </button>
              </div>
            </div>
          )}

          <div className="reflections-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={publish}
              disabled={saving || !isPublishable(body) || needsSensitiveConfirm}
            >
              {t(`reflections.submit.${visibility}`)}
            </button>
            {status && <span className="reflections-status">{status}</span>}
            {error && <span className="reflections-error" role="alert">{error}</span>}
          </div>
        </section>

        <nav className="reflections-tabs" aria-label={t('reflections.title')}>
          {[...FEED_TABS, 'journal'].map(item => (
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
          {listed.map(reflection => {
            // Eski paylaşımlarda sahiplik kaydı yok; açık gönderilerde yazar kimliği yeter.
            const isOwn = isJournalTab
              || ownedIds.includes(reflection.id)
              || (reflection.authorId && reflection.authorId === user.uid);
            return (
              <article key={reflection.id} className="card reflection-item">
                <header>
                  <span className="reflection-author">
                    {isJournalTab
                      ? t('reflections.yourNote')
                      : (reflection.visibility === 'public' && reflection.displayName
                        ? reflection.displayName
                        : t('reflections.anonymousAuthor'))}
                  </span>
                  <span className="reflection-kind">{t(`reflections.kind.${reflection.kind || 'reflection'}`)}</span>
                  <time>{formatDate(reflection.createdAt, language)}</time>
                </header>

                {reflection.moderationStatus === 'limited' && (
                  <p className="reflection-limited">{t('reflections.limitedNotice')}</p>
                )}

                {reflection.isSensitive ? (
                  <details className="reflection-sensitive">
                    <summary>{t('reflections.sensitiveCover')}</summary>
                    <p>{reflection.body}</p>
                    <p className="reflection-resources">{t('reflections.crisisNote')}</p>
                  </details>
                ) : (
                  <p className="reflection-body">{reflection.body}</p>
                )}

                {!isJournalTab && !isOwn && (
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
                  {isOwn ? (
                    <button type="button" className="reflection-link" onClick={() => removeOwn(reflection, isJournalTab)}>
                      {t('reflections.delete')}
                    </button>
                  ) : (
                    <>
                      <button type="button" className="reflection-link" onClick={() => hideReflection(reflection, false)}>
                        {t('reflections.hide')}
                      </button>
                      {reflection.authorId && (
                        <button type="button" className="reflection-link" onClick={() => hideReflection(reflection, true)}>
                          {t('reflections.hideAuthor')}
                        </button>
                      )}
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
            );
          })}

          {listed.length === 0 && (
            <p className="reflections-empty">{t(`reflections.empty.${isJournalTab ? 'journal' : 'feed'}`)}</p>
          )}
        </section>

        <section className="card reflections-rules">
          <h2>{t('rules.title')}</h2>
          <p>{t('rules.intro')}</p>
          <ul>
            {['harassment', 'hate', 'personalData', 'ads', 'toxicProductivity', 'diagnosis'].map(rule => (
              <li key={rule}>{t(`rules.${rule}`)}</li>
            ))}
          </ul>
          <p className="reflections-crisis">{t('rules.support')}</p>
        </section>
      </main>
    </div>
  );
};

export default ReflectionsPage;
