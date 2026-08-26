import React from 'react';

export const ROLE_STYLES = {
  owner: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  office_staff: { bg: '#f5f3ff', text: '#6b21a8', border: '#ddd6fe' },
  karigar: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  cashier: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  ground_staff: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

export const ComplianceRing = ({ pct = 0, size = 110 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (pct / 100) * circum;
  const color = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#dc2626';
  const label = pct >= 90 ? 'Excellent' : pct >= 75 ? 'Good' : 'Attention!';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: '9px', fontWeight: '800', color, marginTop: '2px', textTransform: 'uppercase' }}>{label}</span>
      </div>
    </div>
  );
};

export const ComplianceBar = ({ pct = 0, showLabel = true }) => {
  const color = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#dc2626';
  return (
    <div>
      <div style={{ height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '3px', width: `${Math.min(pct, 100)}%`,
          background: color, transition: 'width 0.8s ease',
        }} />
      </div>
      {showLabel && (
        <div style={{ color, fontSize: '11px', fontWeight: '700', marginTop: '3px', textAlign: 'right' }}>{pct}%</div>
      )}
    </div>
  );
};

export const StatCard = ({ icon: Icon, label, value, subtext, color, bg, border }) => (
  <div style={{
    background: bg, border: `1px solid ${border}`, borderRadius: '16px',
    padding: '16px 18px', flex: 1, minWidth: '130px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      {Icon && <Icon size={16} color={color} />}
    </div>
    <div style={{ fontSize: '28px', fontWeight: '900', color, lineHeight: 1 }}>{value}</div>
    {subtext && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{subtext}</div>}
  </div>
);
