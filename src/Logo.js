import React from 'react';

const Logo = () => {
  return (
    <div className="logo-container">
      <svg className="logo-svg" width="200" height="40" viewBox="0 0 200 40">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f2f6" />
          </linearGradient>
        </defs>
        
        {/* Pomo */}
        <text x="5" y="32" fontFamily="Poppins, sans-serif" fontSize="30" fontWeight="700" fill="url(#logoGradient)">
          P
        </text>
        <text x="30" y="32" fontFamily="Poppins, sans-serif" fontSize="30" fontWeight="700" fill="url(#logoGradient)">
          m
        </text>

        {/* Hareketli "o" harfi */}
        <g className="logo-target" transform="translate(70, 20)">
          <circle cx="0" cy="0" r="14" fill="none" stroke="#ff6b6b" strokeWidth="4" />
          <circle cx="0" cy="0" r="7" fill="#ff6b6b" />
        </g>
        
        {/* free */}
        <text x="95" y="32" fontFamily="Poppins, sans-serif" fontSize="30" fontWeight="700" fill="url(#logoGradient)">
          free
        </text>
      </svg>
    </div>
  );
};

export default Logo;