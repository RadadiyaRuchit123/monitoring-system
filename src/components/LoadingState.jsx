import React from 'react';

/**
 * Premium Loading States — Spinner & Skeleton
 */
export const LoadingSpinner = ({ label = 'Loading...' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '48px 20px', gap: '14px',
  }}>
    <div style={{
      width: '40px', height: '40px',
      borderRadius: '50%',
      border: '3px solid rgba(99,102,241,0.15)',
      borderTopColor: '#6366f1',
      animation: 'spin 0.7s linear infinite',
    }} />
    <span style={{
      fontSize: '13px', fontWeight: '600', color: '#94a3b8',
      animation: 'pulse-soft 1.5s ease-in-out infinite',
    }}>
      {label}
    </span>
  </div>
);

export const SkeletonDashboard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {/* Stats skeleton row */}
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
    }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          height: '90px', borderRadius: '16px',
          background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
          backgroundSize: '200% 100%',
          animation: `shimmer 1.5s ease-in-out infinite`,
          animationDelay: `${i * 100}ms`,
        }} />
      ))}
    </div>

    {/* Banner skeleton */}
    <div style={{
      height: '120px', borderRadius: '20px',
      background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      animationDelay: '200ms',
    }} />

    {/* Task card skeletons */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: '72px', borderRadius: '16px',
          background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
          backgroundSize: '200% 100%',
          animation: `shimmer 1.5s ease-in-out infinite`,
          animationDelay: `${(i + 4) * 100}ms`,
        }} />
      ))}
    </div>
  </div>
);
