import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { getCatMood, getCatStage } from '../effortModel';
import { subscribeCollectiveCat } from '../catService';
import './CollectiveCat.css';

const CAT_SOURCES = {
  happy: '/pomocat-happy.webp',
  normal: '/pomocat-normal.webp'
};

const PANEL_WIDTH = 300;
const PANEL_HEIGHT = 420;
const POSITION_KEY = 'pomofree_cat_panel_v1';

const MOBILE_WIDTH = 720;

const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_WIDTH;

const readPanelState = () => {
  const viewport = typeof window === 'undefined' ? 1200 : window.innerWidth;
  const fallback = {
    x: Math.max(16, viewport - PANEL_WIDTH - 24),
    y: 120,
    minimized: false,
    closed: false
  };
  let state = fallback;
  try {
    const stored = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
    if (stored) state = { ...fallback, ...stored };
  } catch {
    state = fallback;
  }

  // Dar ekranda panel açık hâlde her şeyin üstünü kapatıyor; simge durumunda başlar.
  if (isMobileViewport()) return { ...state, minimized: true, x: 12, y: 12 };

  // Masaüstünde de kayıtlı konum ekran dışında kalmışsa geri çekiyoruz.
  return {
    ...state,
    x: Math.max(0, Math.min(state.x, Math.max(0, viewport - PANEL_WIDTH))),
    y: Math.max(0, Math.min(state.y, Math.max(0, (typeof window === 'undefined' ? 800 : window.innerHeight) - 60)))
  };
};

const CollectiveCat = ({ user, todayContribution = 0, rested = false, onChooseRest }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cat, setCat] = useState({ totalContribution: 0, dailyContribution: 0 });
  const [failed, setFailed] = useState(false);
  const [panel, setPanel] = useState(readPanelState);
  const [dragOffset, setDragOffset] = useState(null);

  useEffect(() => subscribeCollectiveCat(
    current => {
      setCat(current);
      setFailed(false);
    },
    error => {
      console.error('Kolektif kedi okunamadı:', error);
      setFailed(true);
    }
  ), []);

  useEffect(() => {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(panel));
    } catch {
      // Konum hatırlanamazsa panel yine çalışır.
    }
  }, [panel]);

  useEffect(() => {
    if (!dragOffset) return undefined;
    let frame = null;
    const onMove = event => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const maxX = window.innerWidth - PANEL_WIDTH;
        const maxY = window.innerHeight - (panel.minimized ? 44 : PANEL_HEIGHT);
        setPanel(current => ({
          ...current,
          x: Math.max(0, Math.min(event.clientX - dragOffset.x, Math.max(0, maxX))),
          y: Math.max(0, Math.min(event.clientY - dragOffset.y, Math.max(0, maxY)))
        }));
      });
    };
    const onUp = () => setDragOffset(null);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [dragOffset, panel.minimized]);

  const stage = useMemo(() => getCatStage(cat.totalContribution), [cat.totalContribution]);
  const mood = getCatMood({
    recentContribution: todayContribution,
    communityContribution: cat.dailyContribution,
    userRested: rested
  });
  // İki animasyon var: keyifli hâller mutlu kediyi, diğerleri sakin kediyi gösterir.
  const isHappy = mood === 'happy' || mood === 'playful';
  const percent = Math.round(stage.progress * 100);

  const startDrag = event => {
    if (event.target.closest('.cat-panel-controls')) return;
    event.preventDefault();
    setDragOffset({ x: event.clientX - panel.x, y: event.clientY - panel.y });
  };

  if (panel.closed) {
    return (
      <button
        type="button"
        className="cat-panel-reopen"
        onClick={() => setPanel(current => ({ ...current, closed: false }))}
      >
        {t('cat.reopen')}
      </button>
    );
  }

  return (
    <section
      className={`cat-panel${panel.minimized ? ' is-minimized' : ''}`}
      style={{ left: `${panel.x}px`, top: `${panel.y}px` }}
      aria-labelledby="collective-cat-title"
    >
      <header className="cat-panel-header" onPointerDown={startDrag}>
        <h2 id="collective-cat-title">{t('cat.title')}</h2>
        <div className="cat-panel-controls">
          <button
            type="button"
            onClick={() => setPanel(current => ({ ...current, minimized: !current.minimized }))}
            title={t(panel.minimized ? 'cat.restore' : 'cat.minimize')}
            aria-label={t(panel.minimized ? 'cat.restore' : 'cat.minimize')}
          >
            {panel.minimized ? '□' : '—'}
          </button>
          <button
            type="button"
            onClick={() => setPanel(current => ({ ...current, closed: true }))}
            title={t('cat.close')}
            aria-label={t('cat.close')}
          >
            ×
          </button>
        </div>
      </header>

      {!panel.minimized && (
        <div className="cat-panel-body">
          <div className="cat-panel-figure">
            <img
              src={isHappy ? CAT_SOURCES.happy : CAT_SOURCES.normal}
              alt={t(`cat.mood.${mood}`)}
              width="320"
              height="240"
              loading="lazy"
              decoding="async"
            />
            <span className="cat-panel-mood">{t(`cat.mood.${mood}`)}</span>
          </div>

          <p className="cat-panel-stage">
            {t('cat.stageLabel')} {stage.stage} · {t(`cat.stage.${stage.key}`)}
          </p>

          {stage.isComplete ? (
            <p className="cat-panel-note">{t('cat.roomComplete')}</p>
          ) : (
            <>
              <div
                className="cat-panel-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label={t('cat.progressLabel')}
              >
                <span style={{ width: `${percent}%` }} />
              </div>
              <p className="cat-panel-note">
                {t('cat.nextStage')} {t(`cat.stage.${stage.nextKey}`)} · {t('cat.slowTogether')}
              </p>
            </>
          )}

          {failed && <p className="cat-panel-note">{t('cat.offline')}</p>}

          <div className="cat-panel-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/cat')}>
              {t('catRoom.title')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/reflections')}>
              {t('cat.actionReflect')}
            </button>
            {user && (
              <button type="button" className="btn btn-secondary" onClick={onChooseRest} disabled={rested}>
                {rested ? t('cat.restedToday') : t('cat.actionRest')}
              </button>
            )}
          </div>

          <p className="cat-panel-hint">{user ? t('cat.hintSignedIn') : t('cat.hintGuest')}</p>
        </div>
      )}
    </section>
  );
};

export default CollectiveCat;
