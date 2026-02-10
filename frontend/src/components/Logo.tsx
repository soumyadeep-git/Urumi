import React from 'react';

const Logo = ({ className = '', size = 24 }: { className?: string; size?: number }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: size }}>
        <path d="M2 10C2 10 5 4 10 4C15 4 17 10 22 10" />
        <path d="M2 14C2 14 5 20 10 20C15 20 17 14 22 14" />
        <path d="M12 4V20" strokeOpacity="0.3" />
      </svg>
      <span style={{ 
        fontWeight: 300, 
        letterSpacing: '0.2em', 
        fontSize: size * 0.75,
        textTransform: 'uppercase'
      }}>
        URUMI
      </span>
    </div>
  );
};

export default Logo;
