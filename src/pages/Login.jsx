import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isConfigured = isSupabaseConfigured();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', padding: '24px 16px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 65%, #1e1b4b 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ── Animated gradient blobs ── */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
        animation: 'blob-move 18s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-10%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        animation: 'blob-move 22s ease-in-out infinite reverse', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '50%', width: '300px', height: '300px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)',
        animation: 'blob-move 25s ease-in-out infinite', pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
      }} />

      {/* ── Configuration Alert ── */}
      {!isConfigured && (
        <div style={{
          maxWidth: '460px', width: '100%', marginBottom: '20px',
          padding: '14px 18px', borderRadius: '16px',
          background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
          color: '#fbbf24', fontSize: '12px', zIndex: 1,
          animation: 'fadeInDown 0.4s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '6px' }}>
            <AlertCircle size={15} /> Supabase Connection Required
          </div>
          <p style={{ margin: 0, lineHeight: 1.5, color: 'rgba(251,191,36,0.8)' }}>
            Set <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> and{' '}
            <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code> in your .env file.
          </p>
        </div>
      )}

      {/* ── Brand Logo ── */}
      <div style={{
        textAlign: 'center', marginBottom: '28px', zIndex: 1,
        animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
        }}>
          <CheckSquare size={34} color="white" strokeWidth={2.5} />
        </div>
        <h1 style={{
          fontSize: '28px', fontWeight: '900', color: '#f8fafc',
          letterSpacing: '-0.5px', margin: '0 0 6px',
        }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.8)', margin: 0, fontWeight: '500' }}>
          Sign in to Iscon Gathiya SOP Management
        </p>
      </div>

      {/* ── Login Card (Glassmorphism) ── */}
      <div style={{
        width: '100%', maxWidth: '420px', zIndex: 1,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', padding: '32px 28px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
      }}>
        {error && (
          <div style={{
            marginBottom: '20px', padding: '12px 14px', borderRadius: '12px',
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
            color: '#fb7185', fontSize: '13px', fontWeight: '600',
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            animation: 'fadeInDown 0.3s ease-out',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email */}
          <div>
            <label htmlFor="login-email" style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'rgba(203,213,225,0.8)', textTransform: 'uppercase',
              letterSpacing: '0.8px', marginBottom: '8px',
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(148,163,184,0.5)', pointerEvents: 'none',
              }}>
                <Mail size={16} />
              </div>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc', fontSize: '14px', fontWeight: '500',
                  outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                }}
                onBlur={e => {
                  e.target.style.background = 'rgba(255,255,255,0.06)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'rgba(203,213,225,0.8)', textTransform: 'uppercase',
              letterSpacing: '0.8px', marginBottom: '8px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(148,163,184,0.5)', pointerEvents: 'none',
              }}>
                <Lock size={16} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 44px 12px 42px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc', fontSize: '14px', fontWeight: '500',
                  outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                }}
                onBlur={e => {
                  e.target.style.background = 'rgba(255,255,255,0.06)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(148,163,184,0.5)',
                  cursor: 'pointer', padding: '2px', transition: 'color 0.15s',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
              background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white', fontSize: '14px', fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              transition: 'all 0.2s', marginTop: '4px',
              transform: 'translateY(0)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '24px', paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{
              color: '#818cf8', fontWeight: '700', textDecoration: 'none',
              transition: 'color 0.15s',
            }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* ── Powered By ── */}
      <div style={{
        marginTop: '32px', textAlign: 'center', zIndex: 1,
        animation: 'fadeIn 0.5s ease-out 0.5s both',
      }}>
        <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.35)', margin: 0, fontWeight: '500' }}>
          Powered by Iscon Gathiya Operations
        </p>
      </div>

      {/* Keyframes (inline for self-contained component) */}
      <style>{`
        @keyframes blob-move {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 50px) scale(1.05); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
};
