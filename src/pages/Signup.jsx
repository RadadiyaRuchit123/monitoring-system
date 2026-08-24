import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { sopService } from '../services/sopService';
import {
  FaSquareCheck, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaCrown, FaUserCheck, FaUtensils, FaCreditCard, FaCircleExclamation, FaStore,
} from 'react-icons/fa6';

const RESTAURANT_BRANCHES = [
  { id: 'b1', name: 'Himmatnagar', location: 'Himmatnagar' },
  { id: 'b2', name: 'Sola Bridge', location: 'Sola Bridge' },
  { id: 'b3', name: 'Bopal', location: 'Bopal' },
  { id: 'b4', name: 'Mehsana', location: 'Mehsana' },
  { id: 'b5', name: 'Statue of Unity', location: 'Statue of Unity' },
  { id: 'b6', name: 'VS Hospital', location: 'VS Hospital' },
  { id: 'b7', name: 'Fedra', location: 'Fedra' },
  { id: 'b8', name: 'Bhadaj', location: 'Bhadaj' },
  { id: 'b9', name: 'Food Mall', location: 'Food Mall' },
  { id: 'b10', name: 'Gandhinagar', location: 'Gandhinagar' },
  { id: 'b11', name: 'Changodar', location: 'Changodar' },
  { id: 'b12', name: 'Vadodara', location: 'Vadodara' },
  { id: 'b13', name: 'Adalaj', location: 'Adalaj' },
  { id: 'b14', name: 'Makarba', location: 'Makarba' },
  { id: 'b15', name: 'Chotila', location: 'Chotila' },
  { id: 'b16', name: 'Bliss Resort (Mehsana)', location: 'Bliss Resort' },
];

const ROLES = [
  {
    id: 'karigar',
    title: 'Karigar (Chef)',
    desc: 'Kitchen preparation, food quality & cooking SOPs',
    icon: FaUtensils,
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#ffedd5',
    gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
  },
  {
    id: 'cashier',
    title: 'Cashier',
    desc: 'Cash counter float, sales entry & bill handover',
    icon: FaCreditCard,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#dbeafe',
    gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
  },
  {
    id: 'office_staff',
    title: 'Office Staff',
    desc: 'Task verification, staff follow-up & escalation',
    icon: FaUserCheck,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ede9fe',
    gradient: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
  },
];

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [branches, setBranches] = useState(RESTAURANT_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState(RESTAURANT_BRANCHES[0].id);
  const [selectedShift, setSelectedShift] = useState('day');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    sopService.getBranches()
      .then(dbBranches => {
        if (dbBranches && dbBranches.length > 0) {
          setBranches(dbBranches);
          setSelectedBranch(dbBranches[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError('Role selection is mandatory. Please select your restaurant role above.');
      return;
    }
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup(email.trim(), password, name.trim(), role, 'kitchen', selectedBranch, selectedShift);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f8fafc', fontSize: '14px', fontWeight: '500',
    outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s',
  };

  const handleInputFocus = (e) => {
    e.target.style.background = 'rgba(255,255,255,0.1)';
    e.target.style.borderColor = 'rgba(99,102,241,0.5)';
    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
  };

  const handleInputBlur = (e) => {
    e.target.style.background = 'rgba(255,255,255,0.06)';
    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
    e.target.style.boxShadow = 'none';
  };

  const selectStyle = {
    ...inputStyle,
    paddingLeft: '42px',
    appearance: 'none', WebkitAppearance: 'none',
    cursor: 'pointer', fontWeight: '600',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', padding: '32px 16px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 65%, #1e1b4b 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated blobs */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-10%', width: '450px', height: '450px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
        animation: 'blob-move 20s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-10%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        animation: 'blob-move 24s ease-in-out infinite reverse', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '480px', width: '100%', zIndex: 1 }}>
        {/* Brand Header */}
        <div style={{
          textAlign: 'center', marginBottom: '24px',
          animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px', margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            <FaSquareCheck size={28} color="#ffffff" />
          </div>
          <h1 style={{
            fontSize: '26px', fontWeight: '900', color: '#f8fafc',
            letterSpacing: '-0.5px', margin: '0 0 6px',
          }}>
            Create Your Account
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.8)', margin: 0, fontWeight: '500' }}>
            Select your role to view relevant daily SOP checklists
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px', padding: '28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
        }}>
          {error && (
            <div style={{
              padding: '12px 14px', borderRadius: '12px', marginBottom: '18px',
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
              color: '#fb7185', fontSize: '13px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px',
              animation: 'fadeInDown 0.3s ease-out',
            }}>
              <FaCircleExclamation size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Role Selection */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '700',
                color: 'rgba(203,213,225,0.8)', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: '10px',
              }}>
                Select Your Restaurant Role *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                {ROLES.map(r => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      style={{
                        padding: '14px 12px', borderRadius: '14px', textAlign: 'left',
                        border: isSelected
                          ? `2px solid ${r.color}`
                          : '2px solid rgba(255,255,255,0.08)',
                        background: isSelected
                          ? `${r.color}15`
                          : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: isSelected ? `0 4px 16px ${r.color}25` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={14} color={r.color} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: isSelected ? r.color : 'rgba(248,250,252,0.9)' }}>
                          {r.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(148,163,184,0.7)', lineHeight: 1.4, marginLeft: '36px' }}>
                        {r.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '700',
                color: 'rgba(203,213,225,0.8)', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: '8px',
              }}>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <FaUser size={14} color="rgba(148,163,184,0.5)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Chef" style={inputStyle}
                  onFocus={handleInputFocus} onBlur={handleInputBlur}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '700',
                color: 'rgba(203,213,225,0.8)', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: '8px',
              }}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope size={14} color="rgba(148,163,184,0.5)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ramesh@restaurant.com" style={inputStyle}
                  onFocus={handleInputFocus} onBlur={handleInputBlur}
                />
              </div>
            </div>

            {/* Branch & Shift Selection (Karigar / Cashier only) */}
            {['karigar', 'cashier'].includes(role) && (
              <>
                {/* Branch */}
                <div>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: '700',
                    color: 'rgba(203,213,225,0.8)', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: '8px',
                  }}>Select Your Branch *</label>
                  <div style={{ position: 'relative' }}>
                    <FaStore size={14} color="rgba(148,163,184,0.5)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                    <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                      style={selectStyle}
                      onFocus={handleInputFocus} onBlur={handleInputBlur}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id} style={{ background: '#1e1b4b', color: '#f8fafc' }}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(148,163,184,0.5)', fontSize: '10px' }}>▼</div>
                  </div>
                </div>

                {/* Shift */}
                <div>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: '700',
                    color: 'rgba(203,213,225,0.8)', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: '8px',
                  }}>Select Shift *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { id: 'day', label: '☀️ Day Shift', desc: 'Morning / Afternoon', color: '#f59e0b' },
                      { id: 'night', label: '🌙 Night Shift', desc: 'Evening / Closing', color: '#8b5cf6' },
                    ].map(s => {
                      const active = selectedShift === s.id;
                      return (
                        <button
                          key={s.id} type="button" onClick={() => setSelectedShift(s.id)}
                          style={{
                            padding: '12px 14px', borderRadius: '12px', textAlign: 'left',
                            border: active
                              ? `2px solid ${s.color}`
                              : '2px solid rgba(255,255,255,0.08)',
                            background: active ? `${s.color}15` : 'rgba(255,255,255,0.04)',
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: '800', color: active ? s.color : 'rgba(248,250,252,0.8)' }}>
                            {s.label}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(148,163,184,0.6)', marginTop: '3px' }}>{s.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '700',
                color: 'rgba(203,213,225,0.8)', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: '8px',
              }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <FaLock size={14} color="rgba(148,163,184,0.5)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters" style={inputStyle}
                  onFocus={handleInputFocus} onBlur={handleInputBlur}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(148,163,184,0.5)', cursor: 'pointer' }}>
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '700',
                color: 'rgba(203,213,225,0.8)', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: '8px',
              }}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <FaLock size={14} color="rgba(148,163,184,0.5)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'} required
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password" style={inputStyle}
                  onFocus={handleInputFocus} onBlur={handleInputBlur}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white', fontSize: '14px', fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                transition: 'all 0.2s', marginTop: '4px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? 'Creating Account...' : 'Create Account & View SOPs'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: '24px', fontSize: '13px',
          color: 'rgba(148,163,184,0.6)',
          animation: 'fadeIn 0.5s ease-out 0.4s both',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: '700', textDecoration: 'none' }}>
            Sign In Here
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', animation: 'fadeIn 0.5s ease-out 0.6s both' }}>
          <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.3)', margin: 0, fontWeight: '500' }}>
            Powered by Iscon Gathiya Operations
          </p>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes blob-move {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 50px) scale(1.05); }
        }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Signup;
