import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './DomainNotice.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const ENDS_AT = Date.parse('2026-08-27T00:00:00+03:00');
const STORAGE_KEY = 'pomofree-domain-notice-2026-08-27';

export const getDomainNoticeDaysLeft = now => Math.max(0, Math.ceil((ENDS_AT - now) / DAY_MS));

const DomainNotice = ({ now = Date.now() }) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'dismissed');
  const daysLeft = getDomainNoticeDaysLeft(now);

  if (dismissed || daysLeft === 0) return null;

  const closeNotice = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setDismissed(true);
  };

  return (
    <aside className="domain-notice card" role="status" aria-label={t('domainNotice.label')}>
      <div>
        <strong>{t('domainNotice.title')}</strong>
        <p>
          {t('domainNotice.newAddress')}{' '}
          <a href="https://pomofree.app/">pomofree.app</a>.{' '}
          {t('domainNotice.countdown').replace('{days}', daysLeft)}
        </p>
      </div>
      <button type="button" className="domain-notice-close" onClick={closeNotice} aria-label={t('domainNotice.close')}>
        ×
      </button>
    </aside>
  );
};

export default DomainNotice;
