import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { themes } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import {
  buildWeeklyProfile,
  cleanSocialText,
  getWeekKey,
  getWeekStart,
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
  victory: '✦',
  question: '?',
  break: '☕'
};

const reactionIcons = {
  support: '🤝',
  spark: '✨',
  focus: '🎯'
};

const displayNameFor = user => cleanSocialText(user?.displayName, 50) || 'Pomofree Kullanıcısı';

const readPosts = async () => {
  const snapshot = await getDocs(query(
    collection(db, 'socialPosts'),
    orderBy('createdAt', 'desc'),
    limit(SOCIAL_LIMITS.posts)
  ));
  return snapshot.docs.map(item => ({
    id: item.id,
    ...item.data(),
    reactions: item.data().reactions || {}
  }));
};

const loadCommunity = async currentUser => {
  const weekStart = getWeekStart();
  const [userSnapshot, sessionsSnapshot] = await Promise.all([
    getDoc(doc(db, 'users', currentUser.uid)),
    getDocs(query(
      collection(db, 'users', currentUser.uid, 'focusSessions'),
      where('completedAt', '>=', Timestamp.fromDate(weekStart)),
      limit(200)
    ))
  ]);
  const ownProfile = buildWeeklyProfile({
    sessions: sessionsSnapshot.docs.map(item => item.data()),
    user: currentUser
  });
  await setDoc(doc(db, 'socialProfiles', currentUser.uid), {
    ...ownProfile,
    updatedAt: serverTimestamp()
  });

  const [profilesSnapshot, posts] = await Promise.all([
    getDocs(query(
      collection(db, 'socialProfiles'),
      where('weekKey', '==', getWeekKey()),
      limit(SOCIAL_LIMITS.profiles)
    )),
    readPosts()
  ]);

  return {
    theme: userSnapshot.exists() ? userSnapshot.data().theme || 'default' : 'default',
    profiles: profilesSnapshot.docs.map(item => ({ id: item.id, ...item.data() })),
    posts
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
  const [modalOpen, setModalOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (!currentUser) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      setUser(currentUser);
      try {
        const community = await loadCommunity(currentUser);
        if (!active) return;
        setActiveTheme(community.theme);
        setProfiles(community.profiles);
        setPosts(community.posts);
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
      const community = await loadCommunity(user);
      setProfiles(community.profiles);
      setPosts(community.posts);
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
      setPosts(await readPosts());
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
    const nextValue = previous === type ? deleteField() : type;
    try {
      await updateDoc(doc(db, 'socialPosts', post.id), {
        [`reactions.${user.uid}`]: nextValue
      });
      setPosts(current => current.map(item => {
        if (item.id !== post.id) return item;
        const reactions = { ...(item.reactions || {}) };
        if (previous === type) delete reactions[user.uid];
        else reactions[user.uid] = type;
        return { ...item, reactions };
      }));
    } catch (reactionError) {
      console.error('Tepki kaydedilemedi:', reactionError);
      setError(t('social.saveError'));
    }
  };

  const loadComments = async postId => {
    const snapshot = await getDocs(query(
      collection(db, 'socialPosts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
      limit(SOCIAL_LIMITS.comments)
    ));
    setComments(current => ({
      ...current,
      [postId]: snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
    }));
  };

  const toggleComments = async postId => {
    if (openPostId === postId) {
      setOpenPostId(null);
      setCommentText('');
      return;
    }
    setOpenPostId(postId);
    setCommentText('');
    try {
      await loadComments(postId);
    } catch (commentError) {
      console.error('Yorumlar yüklenemedi:', commentError);
      setError(t('social.loadError'));
    }
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
      await loadComments(openPostId);
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
      setPosts(current => current.filter(item => item.id !== post.id));
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
      setComments(current => ({
        ...current,
        [postId]: (current[postId] || []).filter(item => item.id !== comment.id)
      }));
    } catch (deleteError) {
      console.error('Yorum silinemedi:', deleteError);
      setError(t('social.saveError'));
    }
  };

  const leaderboards = useMemo(() => ([
    { metric: 'weeklyMinutes', icon: '◷', title: t('social.focusChampions'), unit: t('social.minutes') },
    { metric: 'completedSessions', icon: '✓', title: t('social.finishers'), unit: t('social.sessions') },
    { metric: 'projectCount', icon: '◇', title: t('social.versatile'), unit: t('social.projects') }
  ]), [t]);
  const totalMinutes = profiles.reduce((total, profile) => total + (profile.weeklyMinutes || 0), 0);

  if (loading) {
    return <div className="social-loading" role="status">{t('social.loading')}</div>;
  }
  return (
    <div className={`app-container social-page theme-${activeTheme}`}>
      <Header
        user={user}
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
        <section className="social-hero">
          <SocialConstellation profileCount={profiles.length} themeKey={activeTheme} />
          <div className="social-hero-copy">
            <p>{t('social.heroEyebrow')}</p>
            <h1>{t('social.heroTitle')}</h1>
            <span>{t('social.heroText')}</span>
          </div>
          <div className="social-pulse">
            <div><strong>{profiles.length}</strong><span>{t('social.activePeople')}</span></div>
            <div><strong>{totalMinutes}</strong><span>{t('social.weeklyMinutes')}</span></div>
            <button type="button" onClick={refresh} disabled={saving || !user}>↻ {t('social.refresh')}</button>
          </div>
        </section>

        {!user && (
          <section className="social-guest" role="status">
            <div><strong>{t('social.guestTitle')}</strong><span>{t('social.guestText')}</span></div>
            <button type="button" onClick={() => navigate('/')}>{t('social.guestButton')}</button>
          </section>
        )}

        <section className="social-leaders" aria-labelledby="social-leaders-title">
          <header>
            <div>
              <p>{t('social.weekLabel')}</p>
              <h2 id="social-leaders-title">{t('social.leadersTitle')}</h2>
            </div>
            <span>{t('social.leadersText')}</span>
          </header>
          <div className="social-leader-grid">
            {leaderboards.map(board => (
              <LeaderboardCard key={board.metric} {...board} profiles={profiles} t={t} />
            ))}
          </div>
        </section>

        <section className="social-community-grid">
          <aside className="social-community-note">
            <span className="social-orbit" aria-hidden="true">◎</span>
            <p>{t('social.communityEyebrow')}</p>
            <h2>{t('social.communityTitle')}</h2>
            <span>{t('social.communityText')}</span>
            <small>{t('social.syncHint')}</small>
          </aside>

          <div className="social-feed">
            <header className="social-feed-heading">
              <div>
                <p>{t('social.feedEyebrow')}</p>
                <h2>{t('social.feedTitle')}</h2>
              </div>
              <span>{t('social.feedText')}</span>
            </header>

            <form className="social-composer" onSubmit={sharePost}>
              <div className="social-avatar" aria-hidden="true">{displayNameFor(user).slice(0, 1).toUpperCase()}</div>
              <div>
                <textarea
                  value={postText}
                  onChange={event => setPostText(event.target.value)}
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
                        onClick={() => setMood(item)}
                        title={t(`social.mood.${item}`)}
                        aria-label={t(`social.mood.${item}`)}
                      >
                        {moodIcons[item]}
                      </button>
                    ))}
                  </div>
                  <span>{postText.length}/{SOCIAL_LIMITS.postLength}</span>
                  <button type="submit" disabled={!user || !postText.trim() || saving}>{t('social.share')}</button>
                </div>
              </div>
            </form>

            <div className="social-post-list">
              {posts.length === 0 && <p className="social-empty">{t('social.emptyFeed')}</p>}
              {posts.map(post => (
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
          </div>
        </section>
      </main>

      {modalOpen === 'themes' && (
        <ThemeSelector closeModal={() => setModalOpen(null)} handleThemeChange={handleThemeChange} />
      )}
    </div>
  );
};

const LeaderboardCard = ({ metric, icon, title, unit, profiles, t }) => {
  const ranked = rankProfiles(profiles, metric, 5);
  return (
    <article className={`social-leader-card metric-${metric}`}>
      <header><span aria-hidden="true">{icon}</span><h3>{title}</h3></header>
      {ranked.length === 0 ? (
        <p className="social-empty">{t('social.emptyLeaders')}</p>
      ) : (
        <ol>
          {ranked.map((profile, index) => (
            <li key={profile.userId}>
              <span className="social-rank">{index === 0 ? '♛' : index + 1}</span>
              <span className="social-mini-avatar">{profile.displayName.slice(0, 1).toUpperCase()}</span>
              <strong>{profile.displayName}</strong>
              <span>{profile[metric] || 0} {unit}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
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
    <article className={`social-post mood-${post.mood}`}>
      <header>
        <span className="social-avatar" aria-hidden="true">{post.authorName.slice(0, 1).toUpperCase()}</span>
        <div><strong>{post.authorName}</strong><span>{formattedDate}</span></div>
        <span className="social-post-mood" title={t(`social.mood.${post.mood}`)}>{moodIcons[post.mood]}</span>
        {post.authorId === user.uid && (
          <button type="button" className="social-delete" onClick={onDeletePost} aria-label={t('social.delete')}>×</button>
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
                className={post.reactions?.[user.uid] === type ? 'active' : ''}
                onClick={() => onReact(type)}
                aria-label={t(`social.reaction.${type}`)}
                title={t(`social.reaction.${type}`)}
              >
                {reactionIcons[type]} {count > 0 && <span>{count}</span>}
              </button>
            );
          })}
        </div>
        <button type="button" className="social-comments-toggle" onClick={onToggleComments}>
          ◌ {isOpen ? t('social.hideComments') : t('social.comments')}
        </button>
      </footer>

      {isOpen && (
        <div className="social-comments">
          {comments.length === 0 && <p className="social-empty">{t('social.noComments')}</p>}
          {comments.map(comment => (
            <div className="social-comment" key={comment.id}>
              <span className="social-mini-avatar">{comment.authorName.slice(0, 1).toUpperCase()}</span>
              <p><strong>{comment.authorName}</strong>{comment.body}</p>
              {comment.authorId === user.uid && (
                <button type="button" onClick={() => onDeleteComment(comment)} aria-label={t('social.delete')}>×</button>
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

const SocialConstellation = ({ profileCount, themeKey }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodeCount = Math.min(38, 18 + profileCount * 2);
    const nodes = Array.from({ length: nodeCount }, (_, index) => ({
      x: ((index * 47) % 101) / 100,
      y: ((index * 71 + 13) % 97) / 96,
      size: 1.5 + (index % 4),
      speed: 0.00018 + (index % 5) * 0.000025,
      phase: index * 0.83
    }));
    let frame;

    const draw = time => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const accent = getComputedStyle(canvas).getPropertyValue('--primary-accent').trim() || '#7bd8ff';
      context.clearRect(0, 0, width, height);
      const points = nodes.map(node => ({
        x: node.x * width + Math.sin(time * node.speed + node.phase) * 16,
        y: node.y * height + Math.cos(time * node.speed * 0.8 + node.phase) * 12,
        size: node.size
      }));

      context.strokeStyle = accent;
      context.lineWidth = 0.8;
      points.forEach((point, index) => {
        points.slice(index + 1).forEach(other => {
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance > 125) return;
          context.globalAlpha = (1 - distance / 125) * 0.22;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        });
      });

      context.fillStyle = accent;
      points.forEach((point, index) => {
        context.globalAlpha = 0.35 + (index % 5) * 0.12;
        context.beginPath();
        context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (reducedMotion) draw(0);
    };
    resize();
    window.addEventListener('resize', resize);
    if (!reducedMotion) frame = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [profileCount, themeKey]);

  return <canvas ref={canvasRef} className="social-constellation" aria-hidden="true" />;
};

export default SocialPage;
