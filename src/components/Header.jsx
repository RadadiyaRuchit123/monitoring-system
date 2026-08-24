import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaSquareCheck, FaCrown, FaUserGear, FaChevronDown,
  FaArrowRightFromBracket, FaUserCheck, FaClipboardList,
} from 'react-icons/fa6';

export const Header = ({ onOpenProfileModal, onError }) => {
  const { user, profile, logout, isOwner, isOfficeStaff, isCashier, isKarigar, userBranch } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadge = () => {
    if (isOwner) return (
      <span style={{
        padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800',
        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a',
        color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: '4px',
        boxShadow: '0 2px 8px rgba(245,158,11,0.15)',
      }}>
        <FaCrown size={9} color="#d97706" /> OWNER
      </span>
    );
    if (isOfficeStaff) return (
      <span style={{
        padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800',
        background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #ddd6fe',
        color: '#5b21b6', display: 'inline-flex', alignItems: 'center', gap: '4px',
        boxShadow: '0 2px 8px rgba(139,92,246,0.12)',
      }}>
        <FaUserCheck size={9} color="#7c3aed" /> OFFICE STAFF
      </span>
    );
    if (isCashier) return (
      <span style={{
        padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800',
        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe',
        color: '#1e40af', display: 'inline-flex', alignItems: 'center', gap: '4px',
        boxShadow: '0 2px 8px rgba(59,130,246,0.12)',
      }}>
        💰 CASHIER
      </span>
    );
    if (isKarigar) return (
      <span style={{
        padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800',
        background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #a7f3d0',
        color: '#065f46', display: 'inline-flex', alignItems: 'center', gap: '4px',
        boxShadow: '0 2px 8px rgba(16,185,129,0.12)',
      }}>
        🍳 KARIGAR
      </span>
    );
    return null;
  };

  const isOnAdmin = location.pathname === '/admin';
  const isOnVerify = location.pathname === '/verify';
  const isOnDash = location.pathname === '/dashboard';

  return (
    <>
      {/* ═══ Sticky Glassmorphism Header ═══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226,232,240,0.7)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
        transition: 'all 0.2s',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            minHeight: '64px', padding: '6px 0', gap: '12px',
          }}>

            {/* ── Brand Logo ── */}
            <div
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', minWidth: 0, flex: 1,
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(79,70,229,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                flexShrink: 0,
              }}>
                <FaSquareCheck size={22} color="white" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontWeight: '900', fontSize: '15px', color: '#0f172a',
                    letterSpacing: '-0.3px',
                  }}>
                    Iscon Gathiya
                  </span>
                  {getRoleBadge()}
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700',
                    background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569',
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    📍 {userBranch}
                  </span>
                </div>
                <div style={{
                  fontSize: '11px', color: '#94a3b8', fontWeight: '500',
                  display: 'none', marginTop: '1px',
                }}
                className="sm-show"
                >
                  SOP & Compliance Management
                </div>
              </div>
            </div>

            {/* ── Desktop Nav ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
              className="desktop-nav">
              <NavButton
                active={isOnDash}
                icon={<FaClipboardList size={13} />}
                label="My Checklist"
                onClick={() => navigate('/dashboard')}
                activeColor="#4f46e5"
                activeBg="linear-gradient(135deg, #eef2ff, #e0e7ff)"
                activeBorder="#c7d2fe"
              />

              {isOfficeStaff && (
                <NavButton
                  active={isOnVerify}
                  icon={<FaUserCheck size={13} />}
                  label="Verify"
                  onClick={() => navigate('/verify')}
                  activeColor="#7c3aed"
                  activeBg="linear-gradient(135deg, #f5f3ff, #ede9fe)"
                  activeBorder="#ddd6fe"
                />
              )}

              {isOwner && (
                <NavButton
                  active={isOnAdmin}
                  icon={<FaCrown size={13} />}
                  label="Control Center"
                  onClick={() => navigate('/admin')}
                  activeColor="#d97706"
                  activeBg="linear-gradient(135deg, #fffbeb, #fef3c7)"
                  activeBorder="#fde68a"
                />
              )}
            </div>

            {/* ── Avatar Dropdown ── */}
            {user && (
              <div style={{ position: 'relative', marginLeft: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '5px 5px 5px 5px', borderRadius: '14px',
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: 'white', fontWeight: '900', fontSize: '13px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textTransform: 'uppercase', boxShadow: '0 2px 6px rgba(79,70,229,0.2)',
                  }}>
                    {(profile?.name || user.email)?.charAt(0)}
                  </div>
                  <FaChevronDown size={10} color="#94a3b8" style={{ marginRight: '6px' }}
                    className="desktop-only" />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      onClick={() => setDropdownOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    />
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      width: '260px', maxWidth: 'calc(100vw - 32px)',
                      background: 'white', borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02)',
                      zIndex: 50, overflow: 'hidden',
                      animation: 'fadeInDown 0.2s ease-out',
                    }}>
                      {/* User Info Section */}
                      <div style={{
                        padding: '16px', borderBottom: '1px solid #f1f5f9',
                        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                      }}>
                        <div style={{ fontWeight: '900', fontSize: '14px', color: '#0f172a' }}>
                          {profile?.name || user.email}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          {user.email}
                        </div>
                        <div style={{
                          marginTop: '8px', display: 'inline-flex', padding: '3px 10px',
                          borderRadius: '20px', fontSize: '10px', fontWeight: '800',
                          background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>
                          {profile?.role?.replace('_', ' ')}
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div style={{ padding: '6px' }}>
                        {isOfficeStaff && (
                          <DropdownItem
                            icon={<FaUserCheck size={14} color="#7c3aed" />}
                            label="Verification Panel"
                            onClick={() => { setDropdownOpen(false); navigate('/verify'); }}
                          />
                        )}

                        {isOwner && (
                          <DropdownItem
                            icon={<FaCrown size={14} color="#d97706" />}
                            label="Control Center"
                            onClick={() => { setDropdownOpen(false); navigate('/admin'); }}
                          />
                        )}

                        {onOpenProfileModal && (
                          <DropdownItem
                            icon={<FaUserGear size={14} color="#64748b" />}
                            label="Account Profile"
                            onClick={() => { setDropdownOpen(false); onOpenProfileModal(); }}
                          />
                        )}

                        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 8px' }} />

                        <button
                          onClick={handleSignOut}
                          style={{
                            width: '100%', textAlign: 'left', padding: '10px 14px',
                            border: 'none', background: 'transparent', borderRadius: '12px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                            fontSize: '13px', color: '#e11d48', fontWeight: '700',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <FaArrowRightFromBracket size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ Mobile Bottom Navigation ═══ */}
      {(isOwner || isOfficeStaff) && (
        <div style={{
          position: 'fixed', bottom: '12px', left: '12px', right: '12px', zIndex: 40,
          background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', padding: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        }}
        className="mobile-nav"
        >
          <MobileNavItem
            active={isOnDash}
            icon={<FaClipboardList size={17} />}
            label="Checklist"
            onClick={() => navigate('/dashboard')}
            activeColor="#818cf8"
          />

          {isOfficeStaff && (
            <MobileNavItem
              active={isOnVerify}
              icon={<FaUserCheck size={17} />}
              label="Verify"
              onClick={() => navigate('/verify')}
              activeColor="#a78bfa"
            />
          )}

          {isOwner && (
            <MobileNavItem
              active={isOnAdmin}
              icon={<FaCrown size={17} />}
              label="Control"
              onClick={() => navigate('/admin')}
              activeColor="#fbbf24"
            />
          )}

          {onOpenProfileModal && (
            <MobileNavItem
              active={false}
              icon={<FaUserGear size={17} />}
              label="Profile"
              onClick={onOpenProfileModal}
              activeColor="#818cf8"
            />
          )}
        </div>
      )}

      {/* ═══ Inline Responsive Styles ═══ */}
      <style>{`
        .desktop-nav { display: none; }
        .desktop-only { display: none; }
        .sm-show { display: none !important; }
        .mobile-nav { display: flex; }

        @media (min-width: 640px) {
          .desktop-nav { display: flex !important; }
          .desktop-only { display: block !important; }
          .sm-show { display: block !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </>
  );
};

/* ─── Sub-components ──────────────────────────────────────────────── */

const NavButton = ({ active, icon, label, onClick, activeColor, activeBg, activeBorder }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '7px',
      padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '800',
      border: active ? `1px solid ${activeBorder}` : '1px solid transparent',
      background: active ? activeBg : 'transparent',
      color: active ? activeColor : '#64748b',
      cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
      boxShadow: active ? `0 2px 8px ${activeColor}15` : 'none',
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.background = '#f1f5f9';
        e.currentTarget.style.color = '#334155';
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#64748b';
      }
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const DropdownItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', textAlign: 'left', padding: '10px 14px',
      border: 'none', background: 'transparent', borderRadius: '12px',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '13px', color: '#334155', fontWeight: '600',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    {icon} {label}
  </button>
);

const MobileNavItem = ({ active, icon, label, onClick, activeColor }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
      padding: '8px 16px', borderRadius: '14px', border: 'none',
      background: active ? `${activeColor}18` : 'transparent',
      color: active ? activeColor : 'rgba(148,163,184,0.7)',
      cursor: 'pointer', fontWeight: active ? '800' : '500',
      transition: 'all 0.2s',
    }}
  >
    {icon}
    <span style={{ fontSize: '10px' }}>{label}</span>
  </button>
);
