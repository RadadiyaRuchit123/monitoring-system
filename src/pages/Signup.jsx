import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { sopService } from '../services/sopService';
import {
  FaSquareCheck, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaUserCheck, FaUtensils, FaCreditCard, FaCircleExclamation, FaStore,
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
  },
  {
    id: 'cashier',
    title: 'Cashier',
    desc: 'Cash counter float, sales entry & bill handover',
    icon: FaCreditCard,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#dbeafe',
  },
  {
    id: 'office_staff',
    title: 'Office Staff',
    desc: 'Task verification, staff follow-up & escalation',
    icon: FaUserCheck,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ede9fe',
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
      let finalBranchId = null;
      let finalShift = 'all';

      // Branch & Shift ONLY apply to Karigar & Cashier
      if (['karigar', 'cashier'].includes(role)) {
        finalBranchId = selectedBranch;
        const matchedBranch = branches.find(b => b.id === selectedBranch || b.name === selectedBranch);
        if (matchedBranch) {
          finalBranchId = matchedBranch.id;
        }
        finalShift = selectedShift || 'day';
      }

      await signup(email.trim(), password, name.trim(), role, 'kitchen', finalBranchId, finalShift);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
    background: '#f8fafc', border: '1px solid #cbd5e1',
    color: '#0f172a', fontSize: '14px', fontWeight: '500',
    outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s',
  };

  const handleInputFocus = (e) => {
    e.target.style.background = '#ffffff';
    e.target.style.borderColor = '#6366f1';
    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
  };

  const handleInputBlur = (e) => {
    e.target.style.background = '#f8fafc';
    e.target.style.borderColor = '#cbd5e1';
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
      background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px', margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(79,70,229,0.3)',
          }}>
            <FaSquareCheck size={28} color="#ffffff" />
          </div>
          <h1 style={{
            fontSize: '26px', fontWeight: '900', color: '#0f172a',
            letterSpacing: '-0.5px', margin: '0 0 6px',
          }}>
            Create Your Account
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: '500' }}>
            Select your role to view relevant daily SOP checklists
          </p>
        </div>

        {/* Clean White Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px', padding: '28px 24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        }}>
          {error && (
            <div style={{
              padding: '12px 14px', borderRadius: '12px', marginBottom: '18px',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#b91c1c', fontSize: '13px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <FaCircleExclamation size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Role Selection */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '800',
                color: '#475569', textTransform: 'uppercase',
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
                          : '2px solid #e2e8f0',
                        background: isSelected
                          ? r.bg
                          : '#ffffff',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: `${r.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={14} color={r.color} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: isSelected ? r.color : '#0f172a' }}>
                          {r.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4, marginLeft: '36px' }}>
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
                display: 'block', fontSize: '11px', fontWeight: '800',
                color: '#475569', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: '6px',
              }}>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <FaUser size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
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
                display: 'block', fontSize: '11px', fontWeight: '800',
                color: '#475569', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: '6px',
              }}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ramesh@restaurant.com" style={inputStyle}
                  onFocus={handleInputFocus} onBlur={handleInputBlur}
                />
              </div>
            </div>

            {/* Branch & Shift Selection (Karigar & Cashier ONLY) */}
            {['karigar', 'cashier'].includes(role) && (
              <>
                {/* Branch */}
                <div>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: '800',
                    color: '#475569', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: '6px',
                  }}>Select Your Branch *</label>
                  <div style={{ position: 'relative' }}>
                    <FaStore size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                    <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                      style={selectStyle}
                      onFocus={handleInputFocus} onBlur={handleInputBlur}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '10px' }}>▼</div>
                  </div>
                </div>

                {/* Shift */}
                <div>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: '800',
                    color: '#475569', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: '6px',
                  }}>Select Shift *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { id: 'day', label: '☀️ Day Shift', desc: 'Morning / Afternoon', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
                      { id: 'night', label: '🌙 Night Shift', desc: 'Evening / Closing', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
                    ].map(s => {
                      const active = selectedShift === s.id;
                      return (
                        <button
                          key={s.id} type="button" onClick={() => setSelectedShift(s.id)}
                          style={{
                            padding: '12px 14px', borderRadius: '12px', textAlign: 'left',
                            border: `2px solid ${active ? s.color : '#e2e8f0'}`,
                            background: active ? s.bg : '#ffffff',
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: '800', color: active ? s.color : '#0f172a' }}>
                            {s.label}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>{s.desc}</div>
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
                display: 'block', fontSize: '11px', fontWeight: '800',
                color: '#475569', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: '6px',
              }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <FaLock size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters" style={inputStyle}
                  onFocus={handleInputFocus} onBlur={handleInputBlur}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '800',
                color: '#475569', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: '6px',
              }}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <FaLock size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
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
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #4338ca)',
                color: 'white', fontSize: '14px', fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(79,70,229,0.25)',
                transition: 'all 0.2s', marginTop: '4px',
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account & View SOPs'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4f46e5', fontWeight: '800', textDecoration: 'none' }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
