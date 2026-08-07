import React from 'react';

/**
 * Emoji yerine tek biçimli çizgi ikonlar. Hepsi currentColor kullanır,
 * yani temanın metin rengini alır ve platformdan platforma değişmez.
 */
const PATHS = {
  // Gezinme
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></>,
  check: <path d="M4 12.5 9 17.5 20 6.5" />,
  pencil: <><path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4z" /><path d="M14.5 5.5 18.5 9.5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  minimize: <path d="M6 12h12" />,
  expand: <rect x="6" y="6" width="12" height="12" rx="2" />,
  music: <><circle cx="7" cy="18" r="3" /><circle cx="18" cy="16" r="3" /><path d="M10 18V6l11-2v12" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" /></>,

  // Kedi ve oda eşyaları
  cat: <>
    <path d="M5 11 5.5 4.5 10.5 8" />
    <path d="M19 11 18.5 4.5 13.5 8" />
    <path d="M4.8 10.5c0 5 3 8.5 7.2 8.5s7.2-3.5 7.2-8.5" />
    <path d="M9.5 12.5v.6M14.5 12.5v.6" />
    <path d="M10.5 15.5c.6.7 2.4.7 3 0" />
  </>,
  bowl: <><path d="M3.5 11h17c0 4.7-3.8 8.5-8.5 8.5S3.5 15.7 3.5 11z" /><path d="M8 11c0-2.2 1.8-4 4-4s4 1.8 4 4" /></>,
  cushion: <><path d="M4 9.5c4-2.2 12-2.2 16 0 1.8 3.6 1.8 4.4 0 8-4 2.2-12 2.2-16 0-1.8-3.6-1.8-4.4 0-8z" /><path d="M6.5 8.5 4.5 6M17.5 8.5 19.5 6" /></>,
  mouse: <><circle cx="10" cy="14" r="5" /><circle cx="6.5" cy="9.5" r="2.5" /><path d="M15 14c3.5 0 4.5-2 4.5-4" /><path d="M8 13.5h.01" /></>,
  window: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 4v16M4 12h16" /></>,
  shelf: <><rect x="4" y="6" width="4" height="12" rx="1" /><rect x="10" y="8" width="4" height="10" rx="1" /><path d="M16.5 8.5 20 9.5 17.5 18.5 14 17.5z" /></>,
  plants: <><path d="M6 12h12l-1.2 8H7.2z" /><path d="M12 12c0-4 2-6.5 5-7-.3 3.6-2 6-5 7z" /><path d="M12 12c-.3-3-1.8-5-4.5-5.5.3 3 1.8 4.8 4.5 5.5z" /></>,
  playground: <><path d="M12 3 4 19h16z" /><path d="M12 3v16" /><circle cx="12" cy="15" r="2" /></>,
  wall: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3 10h18M3 15h18M9 5v5M15 10v5M9 15v4M15 5v5" /></>,
  room: <><path d="M4 11 12 4l8 7v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" /><path d="M9.5 20v-6h5v6" /></>,

  // Destek tepkileri
  hands: <><path d="M4 13V8.5a1.5 1.5 0 0 1 3 0V12" /><path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V12" /><path d="M10 12V7.5a1.5 1.5 0 0 1 3 0V13" /><path d="M13 13V9.5a1.5 1.5 0 0 1 3 0V16c0 2.5-2 4.5-4.5 4.5h-1A6.5 6.5 0 0 1 4 14" /></>,
  eye: <><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1.2 1.2" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1.2-1.2" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />,
  sprout: <><path d="M12 20v-7" /><path d="M12 13c0-3.3 2.2-5.5 5.5-5.5C17.5 11 15.3 13 12 13z" /><path d="M12 15c-3 0-5-1.8-5-4.8 3 0 5 1.8 5 4.8z" /></>
};

const Icon = ({ name, size = 20, className = '', title }) => {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      className={`app-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {path}
    </svg>
  );
};

export default Icon;
