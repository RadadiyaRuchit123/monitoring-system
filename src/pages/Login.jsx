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
      background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Configuration Alert */}
      {!isConfigured && (
        <div style={{
          maxWidth: '420px', width: '100%', marginBottom: '20px',
          padding: '14px 18px', borderRadius: '16px',
          background: '#fffbeb', border: '1px solid #fde68a',
          color: '#b45309', fontSize: '12px', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '4px' }}>
            <AlertCircle size={15} /> Supabase Connection Required
          </div>
          <p style={{ margin: 0, lineHeight: 1.5, color: '#92400e' }}>
            Set <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> and{' '}
            <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code> in your .env file.
          </p>
        </div>
      )}

      {/* Brand Logo */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '18px', margin: '0 auto 14px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(79,70,229,0.3)',
        }}>
          <CheckSquare size={32} color="white" strokeWidth={2.5} />
        </div>
        <h1 style={{
          fontSize: '26px', fontWeight: '900', color: '#0f172a',
          letterSpacing: '-0.5px', margin: '0 0 6px',
        }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: '500' }}>
          Sign in to Iscon Gathiya SOP Management
        </p>
      </div>

      {/* Clean White Card */}
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#ffffff', border: '1px solid #e2e8f0',
        borderRadius: '24px', padding: '32px 28px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
      }}>
        {error && (
          <div style={{
            marginBottom: '20px', padding: '12px 14px', borderRadius: '12px',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#b91c1c', fontSize: '13px', fontWeight: '600',
            display: 'flex', alignItems: 'flex-start', gap: '8px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email */}
          <div>
            <label htmlFor="login-email" style={{
              display: 'block', fontSize: '11px', fontWeight: '800',
              color: '#475569', textTransform: 'uppercase',
              letterSpacing: '0.8px', marginBottom: '6px',
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8', pointerEvents: 'none',
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
                  background: '#f8fafc', border: '1px solid #cbd5e1',
                  color: '#0f172a', fontSize: '14px', fontWeight: '500',
                  outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                }}
                onBlur={e => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" style={{
              display: 'block', fontSize: '11px', fontWeight: '800',
              color: '#475569', textTransform: 'uppercase',
              letterSpacing: '0.8px', marginBottom: '6px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8', pointerEvents: 'none',
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
                  background: '#f8fafc', border: '1px solid #cbd5e1',
                  color: '#0f172a', fontSize: '14px', fontWeight: '500',
                  outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                }}
                onBlur={e => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#94a3b8',
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
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: 'white', fontSize: '14px', fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(79,70,229,0.25)',
              transition: 'all 0.2s', marginTop: '4px',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '24px', paddingTop: '20px',
          borderTop: '1px solid #f1f5f9', textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{
              color: '#4f46e5', fontWeight: '800', textDecoration: 'none',
            }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
