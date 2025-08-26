import React from 'react';

const Logo = () => {
  return (
    <div className="logo-container">
      <svg className="logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tomatoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ff6b6b', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#ff4757', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
             <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
             <feOffset dx="1" dy="2" result="offsetblur"/>
             <feComponentTransfer>
               <feFuncA type="linear" slope="0.3"/>
             </feComponentTransfer>
             <feMerge> 
               <feMergeNode/>
               <feMergeNode in="SourceGraphic"/> 
             </feMerge>
          </filter>
        </defs>
        <path className="logo-leaf" d="M40 25 C 45 15, 55 15, 60 25" stroke="#4cd137" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="60" r="35" fill="url(#tomatoGradient)" filter="url(#dropShadow)" />
      </svg>
      <span className="logo-text">Pomofree</span>
    </div>
  );
};

export default Logo;