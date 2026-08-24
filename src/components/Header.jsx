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
      <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 shadow-2xs">
        <FaCrown size={10} className="text-amber-600" /> OWNER
      </span>
    );
    if (isOfficeStaff) return (
      <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 shadow-2xs">
        <FaUserCheck size={10} className="text-purple-600" /> OFFICE STAFF
      </span>
    );
    if (isCashier) return (
      <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 shadow-2xs">
        💰 CASHIER
      </span>
    );
    if (isKarigar) return (
      <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 shadow-2xs">
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
      {/* Top Sticky Glassmorphism Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between min-h-[64px] py-2 gap-3">
            
            {/* Brand Logo & Info */}
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <FaSquareCheck size={22} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-base text-slate-900 tracking-tight">
                    Restaurant SOP
                  </span>
                  {getRoleBadge()}
                  <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 truncate max-w-[140px] sm:max-w-xs">
                    📍 {userBranch}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-semibold truncate hidden sm:block">
                  Operational SOP & Compliance System
                </div>
              </div>
            </div>

            {/* Desktop Navigation Items */}
            <div className="hidden sm:flex items-center gap-2 ml-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                  isOnDash
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FaClipboardList size={13} />
                <span>My Checklist</span>
              </button>

              {isOfficeStaff && (
                <button
                  onClick={() => navigate('/verify')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    isOnVerify
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                      : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <FaUserCheck size={13} />
                  <span>Verify</span>
                </button>
              )}

              {isOwner && (
                <button
                  onClick={() => navigate('/admin')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    isOnAdmin
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <FaCrown size={13} />
                  <span>Control Center</span>
                </button>
              )}
            </div>

            {/* User Profile Avatar Dropdown */}
            {user && (
              <div className="relative ml-2 flex-shrink-0">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-xs">
                    {(profile?.name || user.email)?.charAt(0)}
                  </div>
                  <FaChevronDown size={11} className="text-slate-500 hidden sm:block" />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      onClick={() => setDropdownOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <div className="absolute right-0 top-[calc(100%+8px)] w-60 max-w-[calc(100vw-32px)] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
                      <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
                        <div className="font-black text-sm text-slate-900 truncate">
                          {profile?.name || user.email}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                        <div className="text-[10px] text-blue-600 font-extrabold mt-1.5 uppercase tracking-wider">
                          Role: {profile?.role?.replace('_', ' ')}
                        </div>
                      </div>

                      {isOfficeStaff && (
                        <button
                          onClick={() => { setDropdownOpen(false); navigate('/verify'); }}
                          className="w-full text-left px-4 py-2.5 border-none bg-transparent hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 text-xs text-slate-700 font-bold transition-colors"
                        >
                          <FaUserCheck size={14} className="text-purple-600" /> Verification Panel
                        </button>
                      )}

                      {isOwner && (
                        <button
                          onClick={() => { setDropdownOpen(false); navigate('/admin'); }}
                          className="w-full text-left px-4 py-2.5 border-none bg-transparent hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 text-xs text-slate-700 font-bold transition-colors"
                        >
                          <FaCrown size={14} className="text-amber-600" /> Control Center
                        </button>
                      )}

                      {onOpenProfileModal && (
                        <button
                          onClick={() => { setDropdownOpen(false); onOpenProfileModal(); }}
                          className="w-full text-left px-4 py-2.5 border-none bg-transparent hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 text-xs text-slate-700 font-bold transition-colors"
                        >
                          <FaUserGear size={14} className="text-slate-500" /> Account Profile
                        </button>
                      )}

                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 border-none bg-transparent hover:bg-rose-50 cursor-pointer flex items-center gap-2.5 text-xs text-rose-600 font-extrabold transition-colors"
                      >
                        <FaArrowRightFromBracket size={14} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Bottom Navigation Bar for Mobile (< 640px) - ONLY for Owner & Office Staff */}
      {(isOwner || isOfficeStaff) && (
        <div className="fixed bottom-3 left-3 right-3 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white rounded-2xl p-1.5 shadow-2xl flex items-center justify-around sm:hidden">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              isOnDash ? 'bg-blue-600 text-white font-extrabold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FaClipboardList size={16} />
            <span className="text-[10px]">Checklist</span>
          </button>

          {isOfficeStaff && (
            <button
              onClick={() => navigate('/verify')}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                isOnVerify ? 'bg-purple-600 text-white font-extrabold shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaUserCheck size={16} />
              <span className="text-[10px]">Verify</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={() => navigate('/admin')}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                isOnAdmin ? 'bg-amber-600 text-white font-extrabold shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaCrown size={16} />
              <span className="text-[10px]">Control</span>
            </button>
          )}

          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
            >
              <FaUserGear size={16} />
              <span className="text-[10px]">Profile</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};
