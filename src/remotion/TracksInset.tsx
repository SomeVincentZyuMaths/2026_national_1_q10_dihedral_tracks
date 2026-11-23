import React from 'react';

interface TracksInsetProps {
  opacity: number;
  isMerged?: boolean;
}

export const TracksInset: React.FC<TracksInsetProps> = ({ opacity, isMerged = false }) => {
  if (opacity < 0.01) return null;

  return (
    <div
      style={{
        position: 'absolute',
        right: '40px',
        bottom: '120px',
        width: '320px',
        height: '300px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'rgba(10, 18, 30, 0.82)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.8)',
        opacity,
        transition: 'opacity 0.2s ease',
        zIndex: 10,
        pointerEvents: 'none',
        padding: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '16px',
          top: '12px',
          fontSize: '12px',
          color: '#8e9bb0',
          letterSpacing: '0.08em',
          fontWeight: 600,
        }}
      >
        截面展开图 (y=y_C)
      </div>
      <svg
        viewBox="0 0 320 280"
        style={{ width: '100%', height: '100%', marginTop: '8px' }}
      >
        {/* 截面圆 O1 */}
        <circle cx="160" cy="140" r="100" fill="none" stroke="#4a88e8" strokeWidth="2.5" opacity="0.4" />
        <circle cx="160" cy="140" r="50" fill="none" stroke="#2cb5a0" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
        <circle cx="160" cy="140" r="4" fill="#4a88e8" />
        <text x="145" y="155" fill="#8e9bb0" fontSize="13" fontWeight="600">O₁</text>

        {/* 半径 O1C */}
        <line x1="160" y1="140" x2="160" y2="40" stroke="#4a88e8" strokeWidth="2.2" />
        <circle cx="160" cy="40" r="5.5" fill="#4a88e8" />
        <text x="150" y="28" fill="#4a88e8" fontSize="16" fontWeight="bold">C</text>
        <text x="168" y="90" fill="#4a88e8" fontSize="12" fontWeight="600">2</text>

        {/* 半径 O1D' (与 O1C 夹角 60°) */}
        {/* cos(30°)=0.866, sin(30°)=0.5 -> 60° from vertical: x = 160 + 50*sin(60°) = 160 + 43.3 = 203.3, y = 140 - 50*cos(60°) = 140 - 25 = 115 */}
        <line x1="160" y1="140" x2="203.3" y2="115" stroke="#2cb5a0" strokeWidth="2.2" />
        <circle cx="203.3" cy="115" r="5.5" fill="#2cb5a0" />
        <text x="214" y="118" fill="#2cb5a0" fontSize="15" fontWeight="bold">
          {isMerged ? 'D' : "D′"}
        </text>
        <text x="186" y="142" fill="#2cb5a0" fontSize="12" fontWeight="600">1</text>

        {/* 金色 60° 角弧 */}
        <path d="M 160 115 A 25 25 0 0 1 181.6 127.5" fill="none" stroke="#f0b232" strokeWidth="2.5" />
        <text x="170" y="112" fill="#f0b232" fontSize="12" fontWeight="bold">60°</text>

        {/* 红色弦 CD' */}
        <line x1="160" y1="40" x2="203.3" y2="115" stroke="#e05344" strokeWidth="3" strokeLinecap="round" />
        <text x="190" y="70" fill="#e05344" fontSize="14" fontWeight="bold">√3</text>
      </svg>
    </div>
  );
};
