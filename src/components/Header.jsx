import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSquareCheck, FaCrown, FaUserGear, FaChevronDown, FaArrowRightFromBracket, FaUserCheck, FaClipboardList, FaShieldHalved } from 'react-icons/fa6';
import { HiSparkles, HiMiniBuildingStorefront } from 'react-icons/hi2';

export const Header = ({ onOpenProfileModal, onError }) => {
  const { user, profile, logout, isOwner, isOfficeStaff, isCashier, canAccessControlPanel, userDepartment, userBranch } = useAuth();
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
      <span style={{ padding: '3px 10px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: '10px', fontWeight: '800', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <FaCrown size={10} color="#d97706" /> OWNER
      </span>
    );
    if (isOfficeStaff) return (
      <span style={{ padding: '3px 10px', background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6b21a8', fontSize: '10px', fontWeight: '800', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <FaUserCheck size={10} color="#7c3aed" /> OFFICE STAFF
      </span>
    );
    if (isCashier) return (
      <span style={{ padding: '3px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '10px', fontWeight: '800', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        💰 CASHIER
      </span>
    );
    if (isKarigar) return (
      <span style={{ padding: '3px 10px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '10px', fontWeight: '800', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        🍳 KARIGAR
      </span>
    );
    return null;
  };

  const getDeptLabel = () => {
    const labels = { kitchen: '🍳 Kitchen Operations', cashier: '💰 Cashier & Billing', inventory: '📦 Inventory Stock', hygiene: '✨ Hygiene & Cleaning', all: '🏢 All Departments', general: '⚙️ General SOPs' };
    return labels[userDepartment] || '⚙️ Operations';
  };

  const isOnAdmin = location.pathname === '/admin';
  const isOnVerify = location.pathname === '/verify';
  const isOnDash = location.pathname === '/dashboard';

  const navBtnStyle = (active, activeColor = '#1e293b', activeTextColor = '#fff', defaultBg = '#f8fafc', defaultText = '#475569', border = '#cbd5e1') => ({
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '8px 14px', borderRadius: '10px',
    border: `1px solid ${active ? activeColor : border}`,
    background: active ? activeColor : defaultBg,
    color: active ? activeTextColor : defaultText,
    cursor: 'pointer', fontSize: '12px', fontWeight: '800',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
    boxShadow: active ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
  });

  return (
    <header style={{
      background: '#ffffff', borderBottom: '1px solid #e2e8f0',
      position: 'sticky', top: 0, zIndex: 30,
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', padding: '8px 0', gap: '12px', flexWrap: 'wrap' }}>

          {/* Brand */}
          <div
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            }}>
              <FaSquareCheck size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '900', fontSize: '16px', color: '#0f172a', letterSpacing: '-0.3px' }}>
                  Restaurant SOP
                </span>
                {getRoleBadge()}
                <span style={{ padding: '3px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: '10px', fontWeight: '800', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  📍 {userBranch}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '1px' }}>
                Operational SOP & Compliance System
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* My Checklist */}
            <button onClick={() => navigate('/dashboard')} style={navBtnStyle(isOnDash, '#0f172a', '#ffffff', '#ffffff', '#475569', '#e2e8f0')}>
              <FaClipboardList size={13} />
              <span className="hide-mobile">My Checklist</span>
            </button>

            {/* Verification Panel (ONLY Office Staff) */}
            {isOfficeStaff && (
              <button onClick={() => navigate('/verify')} style={navBtnStyle(isOnVerify, '#7c3aed', '#ffffff', '#f5f3ff', '#6b21a8', '#ddd6fe')}>
                <FaUserCheck size={13} />
                <span className="hide-mobile">Verify</span>
              </button>
            )}

            {/* Control Center (ONLY OWNER) */}
            {isOwner && (
              <button onClick={() => navigate('/admin')} style={navBtnStyle(isOnAdmin, '#d97706', '#ffffff', '#fffbeb', '#b45309', '#fde68a')}>
                <FaCrown size={13} />
                <span className="hide-mobile">Control Center</span>
              </button>
            )}

            {/* User Profile Menu */}
            {user && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 10px', borderRadius: '12px',
                    border: '1px solid #cbd5e1', background: '#f8fafc',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    color: '#ffffff', fontWeight: '900', fontSize: '13px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textTransform: 'uppercase',
                  }}>
                    {(profile?.name || user.email)?.charAt(0)}
                  </div>
                  <FaChevronDown size={11} color="#64748b" />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      onClick={() => setDropdownOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    />
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      width: '230px', background: '#ffffff', borderRadius: '16px',
                      border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                      zIndex: 50, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: '900', fontSize: '14px', color: '#0f172a', marginBottom: '2px' }}>
                          {profile?.name || user.email}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{user.email}</div>
                        <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: '800', marginTop: '6px', textTransform: 'uppercase' }}>
                          Role: {profile?.role?.replace('_', ' ')}
                        </div>
                      </div>

                      {isOfficeStaff && (
                        <button onClick={() => { setDropdownOpen(false); navigate('/verify'); }} style={{
                          width: '100%', textAlign: 'left', padding: '11px 16px',
                          border: 'none', background: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '10px',
                          fontSize: '13px', color: '#334155', fontWeight: '700',
                        }}>
                          <FaUserCheck size={14} color="#7c3aed" /> Verification Panel
                        </button>
                      )}

                      {isOwner && (
                        <button onClick={() => { setDropdownOpen(false); navigate('/admin'); }} style={{
                          width: '100%', textAlign: 'left', padding: '11px 16px',
                          border: 'none', background: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '10px',
                          fontSize: '13px', color: '#334155', fontWeight: '700',
                        }}>
                          <FaCrown size={14} color="#d97706" /> Control Center
                        </button>
                      )}

                      {onOpenProfileModal && (
                        <button onClick={() => { setDropdownOpen(false); onOpenProfileModal(); }} style={{
                          width: '100%', textAlign: 'left', padding: '11px 16px',
                          border: 'none', background: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '10px',
                          fontSize: '13px', color: '#334155', fontWeight: '700',
                        }}>
                          <FaUserGear size={14} color="#475569" /> Account Profile
                        </button>
                      )}

                      <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                      <button onClick={handleSignOut} style={{
                        width: '100%', textAlign: 'left', padding: '11px 16px',
                        border: 'none', background: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontSize: '13px', color: '#dc2626', fontWeight: '800',
                      }}>
                        <FaArrowRightFromBracket size={14} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) { .hide-mobile { display: none; } }
      `}</style>
    </header>
  );
};
