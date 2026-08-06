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

const CollectiveCat = ({ user, todayContribution = 0, rested = false, onChooseRest }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => subscribeCollectiveCat(
    cat => {
      setTotal(cat.totalContribution);
      setFailed(false);
    },
    error => {
      console.error('Kolektif kedi okunamadı:', error);
      setFailed(true);
    }
  ), []);

  const stage = useMemo(() => getCatStage(total), [total]);
  const mood = getCatMood({ recentContribution: todayContribution, userRested: rested });
  // İki animasyon var: keyifli hâller mutlu kediyi, diğerleri sakin kediyi gösterir.
  const isHappy = mood === 'happy' || mood === 'playful';
  const percent = Math.round(stage.progress * 100);

  return (
    <section className="collective-cat card" aria-labelledby="collective-cat-title">
      <div className="collective-cat-figure">
        <img
          src={isHappy ? CAT_SOURCES.happy : CAT_SOURCES.normal}
          alt={t(`cat.mood.${mood}`)}
          className="collective-cat-image"
          width="320"
          height="240"
          loading="lazy"
          decoding="async"
        />
        <span className="collective-cat-mood">{t(`cat.mood.${mood}`)}</span>
      </div>

      <div className="collective-cat-body">
        <h2 id="collective-cat-title">{t('cat.title')}</h2>
        <p className="collective-cat-stage">
          {t('cat.stageLabel')} {stage.stage} · {t(`cat.stage.${stage.key}`)}
        </p>

        {stage.isComplete ? (
          <p className="collective-cat-note">{t('cat.roomComplete')}</p>
        ) : (
          <>
            <div
              className="collective-cat-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={t('cat.progressLabel')}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
            <p className="collective-cat-note">
              {t('cat.nextStage')} {t(`cat.stage.${stage.nextKey}`)} · {t('cat.slowTogether')}
            </p>
          </>
        )}

        {failed && <p className="collective-cat-note">{t('cat.offline')}</p>}

        <div className="collective-cat-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/reflections')}>
            {t('cat.actionReflect')}
          </button>
          {user && (
            <button type="button" className="btn btn-secondary" onClick={onChooseRest} disabled={rested}>
              {rested ? t('cat.restedToday') : t('cat.actionRest')}
            </button>
          )}
        </div>

        <p className="collective-cat-hint">{user ? t('cat.hintSignedIn') : t('cat.hintGuest')}</p>
      </div>
    </section>
  );
};

export default CollectiveCat;
