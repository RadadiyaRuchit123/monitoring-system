import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaSquareCheck, FaCrown, FaUserGear, FaChevronDown,
  FaArrowRightFromBracket, FaUserCheck, FaClipboardList,
} from 'react-icons/fa6';

export const Header = ({ onOpenProfileModal }) => {
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
        padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '800',
        background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
        display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap',
      }}>
        <FaCrown size={9} color="#d97706" /> OWNER
      </span>
    );
    if (isOfficeStaff) return (
      <span style={{
        padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '800',
        background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#5b21b6',
        display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap',
      }}>
        <FaUserCheck size={9} color="#7c3aed" /> OFFICE STAFF
      </span>
    );
    if (isCashier) return (
      <span style={{
        padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '800',
        background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af',
        display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap',
      }}>
        💰 CASHIER
      </span>
    );
    if (isKarigar) return (
      <span style={{
        padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '800',
        background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46',
        display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap',
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
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '60px', gap: '12px',
        }}>

          {/* ── Brand Logo & Info (Left) ── */}
          <div
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              cursor: 'pointer', minWidth: 0, flexShrink: 1,
            }}
          >
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79,70,229,0.25)', flexShrink: 0,
            }}>
              <FaSquareCheck size={20} color="white" />
            </div>

            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{
                  fontWeight: '900', fontSize: '15px', color: '#0f172a',
                  letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  Iscon Gathiya
                </span>
                {getRoleBadge()}
              </div>
              <div style={{
                fontSize: '11px', color: '#64748b', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', marginTop: '1px',
              }}>
                <span>📍 {userBranch}</span>
              </div>
            </div>
          </div>

          {/* ── Avatar Dropdown Button (Right) ── */}
          {user && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 10px', borderRadius: '12px',
                  border: '1px solid #cbd5e1', background: '#f8fafc',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: '9px',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white', fontWeight: '900', fontSize: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textTransform: 'uppercase', boxShadow: '0 2px 6px rgba(79,70,229,0.2)',
                }}>
                  {(profile?.name || user.email)?.charAt(0)}
                </div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                  {profile?.name || 'Account'}
                </span>
                <FaChevronDown size={10} color="#64748b" />
              </button>

              {/* ── Dropdown Menu ── */}
              {dropdownOpen && (
                <>
                  <div
                    onClick={() => setDropdownOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 60 }}
                  />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    width: '260px', maxWidth: 'calc(100vw - 24px)',
                    background: '#ffffff', borderRadius: '18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02)',
                    zIndex: 70, overflow: 'hidden',
                    animation: 'fadeInDown 0.2s ease-out',
                  }}>
                    {/* User Profile Summary Header */}
                    <div style={{
                      padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
                      background: '#f8fafc',
                    }}>
                      <div style={{ fontWeight: '900', fontSize: '14px', color: '#0f172a' }}>
                        {profile?.name || user.email}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', wordBreak: 'break-all' }}>
                        {user.email}
                      </div>
                      <div style={{
                        marginTop: '8px', display: 'inline-flex', padding: '2px 8px',
                        borderRadius: '12px', fontSize: '10px', fontWeight: '800',
                        background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {profile?.role?.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Navigation Menu Links */}
                    <div style={{ padding: '6px' }}>
                      <DropdownItem
                        icon={<FaClipboardList size={14} color="#4f46e5" />}
                        label="My Checklist"
                        active={isOnDash}
                        onClick={() => { setDropdownOpen(false); navigate('/dashboard'); }}
                      />

                      {(isOfficeStaff || isOwner) && (
                        <DropdownItem
                          icon={<FaUserCheck size={14} color="#7c3aed" />}
                          label="Verification Panel"
                          active={isOnVerify}
                          onClick={() => { setDropdownOpen(false); navigate('/verify'); }}
                        />
                      )}

                      {(isOwner || isOfficeStaff) && (
                        <DropdownItem
                          icon={<FaCrown size={14} color="#d97706" />}
                          label="Control Center"
                          active={isOnAdmin}
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
                          width: '100%', textAlign: 'left', padding: '10px 12px',
                          border: 'none', background: 'transparent', borderRadius: '10px',
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

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
};

/* ─── Sub-component ────────────────────────────────────────────────── */

const DropdownItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', textAlign: 'left', padding: '10px 12px',
      border: 'none',
      background: active ? '#f1f5f9' : 'transparent',
      borderRadius: '10px',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '13px', color: active ? '#0f172a' : '#334155', fontWeight: active ? '800' : '600',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Header;
