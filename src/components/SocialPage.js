import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
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
import { safeProfilePhoto } from '../profilePhoto';
import {
  buildSocialProfile,
  cleanSocialText,
  rankProfiles,
  SOCIAL_LIMITS,
  SOCIAL_MOODS,
  SOCIAL_REACTIONS
} from '../socialModel';
import Header from './Header';
import ThemeSelector from './ThemeSelector';
import './SocialPage.css';

const moodIcons = {
  progress: '↗',
  victory: '✓',
  question: '?',
  break: '☕'
};

const reactionIcons = {
  support: '🤝',
  spark: '✨',
  focus: '🎯'
};

const displayNameFor = user => cleanSocialText(user?.displayName, 50) || 'Pomofree Kullanıcısı';

const loadCommunity = async currentUser => {
  const [userSnapshot, sessionsSnapshot] = await Promise.all([
    getDoc(doc(db, 'users', currentUser.uid)),
    getDocs(query(
      collection(db, 'users', currentUser.uid, 'focusSessions'),
      limit(5000)
    ))
  ]);
  const userData = userSnapshot.exists() ? userSnapshot.data() : {};
  const profile = buildSocialProfile({
    sessions: sessionsSnapshot.docs.map(item => item.data()),
    user: { uid: currentUser.uid, displayName: currentUser.displayName || userData.username }
  });

  await setDoc(doc(db, 'socialProfiles', currentUser.uid), {
    ...profile,
    updatedAt: serverTimestamp()
  });

  return {
    theme: userData.theme || 'default',
    profilePhoto: safeProfilePhoto(
      userData.profilePhoto !== undefined ? userData.profilePhoto : currentUser.photoURL
    )
  };
};

const SocialPage = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTheme, setActiveTheme] = useState('default');
  const [profiles, setProfiles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [openPostId, setOpenPostId] = useState(null);
  const [postText, setPostText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [mood, setMood] = useState('progress');
  const [activeBoard, setActiveBoard] = useState('totalMinutes');
  const [modalOpen, setModalOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilesReady, setProfilesReady] = useState(false);
  const [postsReady, setPostsReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const loadErrorMessage = t('social.loadError');

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (!currentUser) {
        if (active) {
          setUser(null);
          setProfilesReady(true);
          setPostsReady(true);
          setLoading(false);
        }
        return;
      }

      setUser(currentUser);
      try {
        const profile = await loadCommunity(currentUser);
        if (active) {
          setActiveTheme(profile.theme);
          setProfilePhoto(profile.profilePhoto);
        }
      } catch (loadError) {
        console.error('Sosyal alan yüklenemedi:', loadError);
        if (active) setError(t('social.loadError'));
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  // Authentication is subscribed once; language changes do not require another read.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      setProfiles([]);
      setPosts([]);
      return undefined;
    }

    const handleError = snapshotError => {
      console.error('Sosyal akış senkronize edilemedi:', snapshotError);
      setProfilesReady(true);
      setPostsReady(true);
      setError(loadErrorMessage);
    };
    const unsubscribeProfiles = onSnapshot(query(
      collection(db, 'socialProfiles'),
      limit(SOCIAL_LIMITS.profiles)
    ), snapshot => {
      setProfiles(snapshot.docs
        .map(item => ({ id: item.id, ...item.data() })));
      setProfilesReady(true);
    }, handleError);
    const unsubscribePosts = onSnapshot(query(
      collection(db, 'socialPosts'),
      orderBy('createdAt', 'desc'),
      limit(SOCIAL_LIMITS.posts)
    ), snapshot => {
      setPosts(snapshot.docs.map(item => ({
        id: item.id,
        ...item.data(),
        reactions: item.data().reactions || {}
      })));
      setPostsReady(true);
    }, handleError);

    return () => {
      unsubscribeProfiles();
      unsubscribePosts();
    };
  }, [loadErrorMessage, user]);

  useEffect(() => {
    if (!user || !openPostId) return undefined;
    return onSnapshot(query(
      collection(db, 'socialPosts', openPostId, 'comments'),
      orderBy('createdAt', 'asc'),
      limit(SOCIAL_LIMITS.comments)
    ), snapshot => setComments(current => ({
      ...current,
      [openPostId]: snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
    })), commentError => {
      console.error('Yorumlar senkronize edilemedi:', commentError);
      setError(loadErrorMessage);
    });
  }, [loadErrorMessage, openPostId, user]);

  useEffect(() => {
    const theme = themes[activeTheme] || themes.default;
    const root = document.documentElement;
    [...new Set(Object.values(themes).flatMap(item => Object.keys(item.colors)))]
      .forEach(key => root.style.removeProperty(key));
    Object.entries(theme.colors).forEach(([key, value]) => root.style.setProperty(key, value));
    document.body.style.backgroundColor = theme.colors['--bg-color-pomodoro'];
  }, [activeTheme]);

  useEffect(() => {
    document.title = `${t('social.title')} - ${t('general.appName')}`;
  }, [t]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await loadCommunity(user);
    } catch (refreshError) {
      console.error('Sosyal alan yenilenemedi:', refreshError);
      setError(t('social.loadError'));
    } finally {
      setSaving(false);
    }
  }, [t, user]);

  const handleThemeChange = async themeKey => {
    setActiveTheme(themeKey);
    if (user) await setDoc(doc(db, 'users', user.uid), { theme: themeKey }, { merge: true });
  };

  const sharePost = async event => {
    event.preventDefault();
    const body = cleanSocialText(postText, SOCIAL_LIMITS.postLength);
    if (!user || !body || saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'socialPosts'), {
        authorId: user.uid,
        authorName: displayNameFor(user),
        body,
        mood,
        createdAt: serverTimestamp(),
        reactions: {}
      });
      setPostText('');
    } catch (saveError) {
      console.error('Sosyal not kaydedilemedi:', saveError);
      setError(t('social.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const reactToPost = async (post, type) => {
    if (!user || !SOCIAL_REACTIONS.includes(type)) return;
    const previous = post.reactions?.[user.uid];
    try {
      await updateDoc(doc(db, 'socialPosts', post.id), {
        [`reactions.${user.uid}`]: previous === type ? deleteField() : type
      });
    } catch (reactionError) {
      console.error('Tepki kaydedilemedi:', reactionError);
      setError(t('social.saveError'));
    }
  };

  const toggleComments = postId => {
    setOpenPostId(current => current === postId ? null : postId);
    setCommentText('');
  };

  const saveComment = async event => {
    event.preventDefault();
    const body = cleanSocialText(commentText, SOCIAL_LIMITS.commentLength);
    if (!user || !openPostId || !body || saving) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'socialPosts', openPostId, 'comments', user.uid), {
        authorId: user.uid,
        authorName: displayNameFor(user),
        body,
        createdAt: serverTimestamp()
      });
      setCommentText('');
    } catch (commentError) {
      console.error('Yorum kaydedilemedi:', commentError);
      setError(t('social.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const removePost = async post => {
    if (!user || post.authorId !== user.uid || !window.confirm(t('social.deleteConfirm'))) return;
    try {
      await deleteDoc(doc(db, 'socialPosts', post.id));
      if (openPostId === post.id) setOpenPostId(null);
    } catch (deleteError) {
      console.error('Sosyal not silinemedi:', deleteError);
      setError(t('social.saveError'));
    }
  };

  const removeComment = async (postId, comment) => {
    if (!user || comment.authorId !== user.uid) return;
    try {
      await deleteDoc(doc(db, 'socialPosts', postId, 'comments', comment.id));
    } catch (deleteError) {
      console.error('Yorum silinemedi:', deleteError);
      setError(t('social.saveError'));
    }
  };

  const boards = useMemo(() => ([
    { metric: 'totalMinutes', title: t('social.focusChampions'), unit: t('social.minutes') },
    { metric: 'completedSessions', title: t('social.finishers'), unit: t('social.sessions') },
    { metric: 'activeDays', title: t('social.activeDays'), unit: t('social.days') }
  ]), [t]);
  const selectedBoard = boards.find(board => board.metric === activeBoard) || boards[0];
  const ownProfile = profiles.find(profile => profile.userId === user?.uid);
  const totalMinutes = profiles.reduce((total, profile) => total + (profile.totalMinutes || 0), 0);

  if (loading) return <SocialLoading t={t} />;

  return (
    <div className={`app-container social-page theme-${activeTheme}`}>
      <Header
        user={user}
        profilePhoto={profilePhoto}
        openModal={name => name === 'login' ? navigate('/') : setModalOpen(name)}
        handleLogout={async () => {
          await signOut(auth);
          navigate('/');
        }}
        isSocialPage
      />

      {error && (
        <div className="social-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label={t('general.close')}>×</button>
        </div>
      )}

      <main className="social-shell">
        <header className="social-intro">
          <div>
            <h1>{t('social.title')}</h1>
            <p>{t('social.heroText')}</p>
          </div>
          <div className="social-live" aria-live="polite">
            <span aria-hidden="true" />
            {t('social.liveData')}
          </div>
        </header>

        <section className="social-community-strip" aria-label={t('social.weekLabel')}>
          <p><strong>{profilesReady ? profiles.length : '…'}</strong> {t('social.activePeople')}</p>
          <p><strong>{profilesReady ? totalMinutes.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US') : '…'}</strong> {t('social.totalMinutes')}</p>
          <span>{t('social.syncHint')}</span>
        </section>

        {!user && (
          <section className="social-guest" role="status">
            <div>
              <h2>{t('social.guestTitle')}</h2>
              <p>{t('social.guestText')}</p>
            </div>
            <button type="button" onClick={() => navigate('/')}>{t('social.guestButton')}</button>
          </section>
        )}

        <div className="social-layout">
          <section className="social-feed" aria-labelledby="social-feed-title">
            <header className="social-section-heading">
              <div>
                <h2 id="social-feed-title">{t('social.feedTitle')}</h2>
                <p>{t('social.feedText')}</p>
              </div>
              <span>{postsReady ? posts.length : '…'}</span>
            </header>

            <Composer
              user={user}
              postText={postText}
              mood={mood}
              saving={saving}
              t={t}
              onPostText={setPostText}
              onMood={setMood}
              onSubmit={sharePost}
            />

            <div className="social-post-list" aria-busy={!postsReady}>
              {!postsReady && <FeedSkeleton />}
              {postsReady && posts.length === 0 && <p className="social-empty">{t('social.emptyFeed')}</p>}
              {postsReady && posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                  comments={comments[post.id] || []}
                  isOpen={openPostId === post.id}
                  commentText={commentText}
                  saving={saving}
                  language={language}
                  t={t}
                  onReact={type => reactToPost(post, type)}
                  onToggleComments={() => toggleComments(post.id)}
                  onCommentText={setCommentText}
                  onSaveComment={saveComment}
                  onDeletePost={() => removePost(post)}
                  onDeleteComment={comment => removeComment(post.id, comment)}
                />
              ))}
            </div>
          </section>

          <aside className="social-sidebar">
            <section className="social-personal" data-testid="personal-week">
              <header>
                <h2>{t('social.myWeek')}</h2>
                <button type="button" onClick={refresh} disabled={saving || !user}>
                  {saving ? t('social.refreshing') : t('social.refresh')}
                </button>
              </header>
              {!profilesReady ? <StatsSkeleton /> : ownProfile ? (
                <dl>
                  <div><dt>{t('social.focusTime')}</dt><dd><strong>{ownProfile.totalMinutes || 0}</strong> {t('social.minutes')}</dd></div>
                  <div><dt>{t('social.completedSessions')}</dt><dd><strong>{ownProfile.completedSessions || 0}</strong></dd></div>
                  <div><dt>{t('social.activeDays')}</dt><dd><strong>{ownProfile.activeDays || 0}</strong> {t('social.days')}</dd></div>
                </dl>
              ) : <p className="social-empty">{t('social.noPersonalStats')}</p>}
            </section>

            <section className="social-ranking" aria-labelledby="social-leaders-title">
              <header>
                <h2 id="social-leaders-title">{t('social.leadersTitle')}</h2>
                <p>{t('social.leadersText')}</p>
              </header>
              <div className="social-board-tabs" role="tablist" aria-label={t('social.leadersTitle')}>
                {boards.map(board => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeBoard === board.metric}
                    key={board.metric}
                    onClick={() => setActiveBoard(board.metric)}
                  >
                    {board.title}
                  </button>
                ))}
              </div>
              <LeaderboardList board={selectedBoard} profiles={profiles} ready={profilesReady} t={t} />
            </section>
          </aside>
        </div>
      </main>

      {modalOpen === 'themes' && (
        <ThemeSelector closeModal={() => setModalOpen(null)} handleThemeChange={handleThemeChange} />
      )}
    </div>
  );
};

const SocialLoading = ({ t }) => (
  <main className="social-loading" role="status" aria-busy="true">
    <span />
    <p>{t('social.loading')}</p>
  </main>
);

const Composer = ({ user, postText, mood, saving, t, onPostText, onMood, onSubmit }) => (
  <form className="social-composer" onSubmit={onSubmit}>
    <span className="social-avatar" aria-hidden="true">{displayNameFor(user).slice(0, 1).toUpperCase()}</span>
    <div>
      <textarea
        rows="3"
        value={postText}
        onChange={event => onPostText(event.target.value)}
        placeholder={t(user ? 'social.sharePlaceholder' : 'social.guestSharePlaceholder')}
        maxLength={SOCIAL_LIMITS.postLength}
        aria-label={t(user ? 'social.sharePlaceholder' : 'social.guestSharePlaceholder')}
        disabled={!user}
      />
      <div className="social-composer-footer">
        <div className="social-moods" aria-label={t('social.mood')}>
          {SOCIAL_MOODS.map(item => (
            <button
              type="button"
              key={item}
              className={mood === item ? 'active' : ''}
              onClick={() => onMood(item)}
              aria-pressed={mood === item}
            >
              <span aria-hidden="true">{moodIcons[item]}</span>
              {t(`social.mood.${item}`)}
            </button>
          ))}
        </div>
        <span>{postText.length}/{SOCIAL_LIMITS.postLength}</span>
        <button type="submit" disabled={!user || !postText.trim() || saving}>{t('social.share')}</button>
      </div>
    </div>
  </form>
);

const LeaderboardList = ({ board, profiles, ready, t }) => {
  if (!ready) return <StatsSkeleton />;
  const ranked = rankProfiles(profiles, board.metric, 5);
  if (ranked.length === 0) return <p className="social-empty">{t('social.emptyLeaders')}</p>;

  return (
    <ol className="social-leader-list">
      {ranked.map((profile, index) => (
        <li key={profile.userId}>
          <span className="social-rank">{index + 1}</span>
          <span className="social-mini-avatar" aria-hidden="true">{profile.displayName.slice(0, 1).toUpperCase()}</span>
          <strong>{profile.displayName}</strong>
          <span>{profile[board.metric] || 0} {board.unit}</span>
        </li>
      ))}
    </ol>
  );
};

const PostCard = ({
  post,
  user,
  comments,
  isOpen,
  commentText,
  saving,
  language,
  t,
  onReact,
  onToggleComments,
  onCommentText,
  onSaveComment,
  onDeletePost,
  onDeleteComment
}) => {
  const reactionValues = Object.values(post.reactions || {});
  const createdAt = post.createdAt?.toDate?.();
  const formattedDate = createdAt
    ? new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(createdAt)
    : t('social.now');

  return (
    <article className="social-post">
      <header>
        <span className="social-avatar" aria-hidden="true">{post.authorName.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{post.authorName}</strong>
          <time dateTime={createdAt?.toISOString?.()}>{formattedDate}</time>
        </div>
        <span className="social-post-mood"><span aria-hidden="true">{moodIcons[post.mood]}</span>{t(`social.mood.${post.mood}`)}</span>
        {post.authorId === user?.uid && (
          <button type="button" className="social-delete" onClick={onDeletePost}>{t('social.delete')}</button>
        )}
      </header>
      <p>{post.body}</p>
      <footer>
        <div className="social-reactions">
          {SOCIAL_REACTIONS.map(type => {
            const count = reactionValues.filter(value => value === type).length;
            return (
              <button
                type="button"
                key={type}
                className={post.reactions?.[user?.uid] === type ? 'active' : ''}
                onClick={() => onReact(type)}
                disabled={!user}
                aria-pressed={post.reactions?.[user?.uid] === type}
              >
                <span aria-hidden="true">{reactionIcons[type]}</span>
                {t(`social.reaction.${type}`)}{count > 0 && <strong>{count}</strong>}
              </button>
            );
          })}
        </div>
        <button type="button" className="social-comments-toggle" onClick={onToggleComments} disabled={!user}>
          {isOpen ? t('social.hideComments') : t('social.comments')}
        </button>
      </footer>

      {isOpen && (
        <div className="social-comments">
          {comments.length === 0 && <p className="social-empty">{t('social.noComments')}</p>}
          {comments.map(comment => (
            <div className="social-comment" key={comment.id}>
              <span className="social-mini-avatar" aria-hidden="true">{comment.authorName.slice(0, 1).toUpperCase()}</span>
              <p><strong>{comment.authorName}</strong>{comment.body}</p>
              {comment.authorId === user?.uid && (
                <button type="button" onClick={() => onDeleteComment(comment)}>{t('social.delete')}</button>
              )}
            </div>
          ))}
          <form onSubmit={onSaveComment}>
            <input
              value={commentText}
              onChange={event => onCommentText(event.target.value)}
              maxLength={SOCIAL_LIMITS.commentLength}
              placeholder={t('social.commentPlaceholder')}
              aria-label={t('social.commentPlaceholder')}
            />
            <button type="submit" disabled={!commentText.trim() || saving}>{t('social.commentSubmit')}</button>
          </form>
        </div>
      )}
    </article>
  );
};

const FeedSkeleton = () => <div className="social-feed-skeleton" aria-hidden="true"><span /><span /><span /></div>;
const StatsSkeleton = () => <div className="social-stats-skeleton" aria-hidden="true"><span /><span /><span /></div>;

export default SocialPage;
