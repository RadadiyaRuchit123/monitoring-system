import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { sopService } from '../services/sopService';
import {
  FaSquareCheck, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaCrown, FaUserCheck, FaUtensils, FaCreditCard, FaCircleExclamation, FaStore,
} from 'react-icons/fa6';

const DEFAULT_17_BRANCHES = [
  { id: 'b1', name: 'ISCON Branch', location: 'ISCON Cross Roads' },
  { id: 'b2', name: 'SG Highway Branch', location: 'SG Highway' },
  { id: 'b3', name: 'Vastrapur Branch', location: 'Vastrapur Lake' },
  { id: 'b4', name: 'Satellite Branch', location: 'Star Bazaar Road' },
  { id: 'b5', name: 'Prahladnagar Branch', location: 'Corporate Road' },
  { id: 'b6', name: 'Navrangpura Branch', location: 'CG Road' },
  { id: 'b7', name: 'CG Road Branch', location: 'Municipal Market' },
  { id: 'b8', name: 'Maninagar Branch', location: 'Kankaria' },
  { id: 'b9', name: 'Bodakdev Branch', location: 'Judges Bungalow' },
  { id: 'b10', name: 'Bopal Branch', location: 'South Bopal' },
  { id: 'b11', name: 'Thaltej Branch', location: 'Thaltej Cross Road' },
  { id: 'b12', name: 'Sindhu Bhavan Branch', location: 'SBR Road' },
  { id: 'b13', name: 'Drive In Road Branch', location: 'Drive In' },
  { id: 'b14', name: 'Naranpura Branch', location: 'Ankur' },
  { id: 'b15', name: 'Nikol Branch', location: 'SP Ring Road' },
  { id: 'b16', name: 'Chandkheda Branch', location: 'VT Circle' },
  { id: 'b17', name: 'Main Head Office', location: 'Central Head Office' },
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
    border: '#ddd6fe',
  },
  {
    id: 'owner',
    title: 'Owner',
    desc: 'Full operational control, performance analytics & SOPs',
    icon: FaCrown,
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
  },
];

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('office_staff');
  const [branches, setBranches] = useState(DEFAULT_17_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState(DEFAULT_17_BRANCHES[0].id);
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
      await signup(email.trim(), password, name.trim(), role, 'kitchen', selectedBranch);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const iStyle = {
    width: '100%', padding: '11px 14px 11px 40px', borderRadius: '12px',
    background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%' }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(37,99,235,0.3)', marginBottom: '12px',
          }}>
            <FaSquareCheck size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Create Restaurant Account
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Select your role to view relevant daily SOP checklists
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff', border: '1px solid #e2e8f0',
          borderRadius: '24px', padding: '32px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        }}>
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
              background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
              fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <FaCircleExclamation size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Role Selection Grid */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                SELECT YOUR RESTAURANT ROLE *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {ROLES.map(r => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      style={{
                        padding: '14px', borderRadius: '14px', textAlign: 'left',
                        border: `2px solid ${isSelected ? r.color : '#e2e8f0'}`,
                        background: isSelected ? r.bg : '#ffffff',
                        cursor: 'pointer', transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Icon size={16} color={r.color} />
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{r.title}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3 }}>{r.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                FULL NAME *
              </label>
              <div style={{ position: 'relative' }}>
                <FaUser size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Chef"
                  style={iStyle}
                />
              </div>
            </div>

            {/* Email input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                EMAIL ADDRESS *
              </label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ramesh@restaurant.com"
                  style={iStyle}
                />
              </div>
            </div>

            {/* Branch Selection Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                SELECT YOUR BRANCH (17 BRANCHES) *
              </label>
              <div style={{ position: 'relative' }}>
                <FaStore size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  style={{
                    ...iStyle,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.location ? `(${b.location})` : ''}
                    </option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '10px' }}>
                  ▼
                </div>
              </div>
            </div>

            {/* Password input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                PASSWORD *
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  style={iStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                CONFIRM PASSWORD *
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  style={iStyle}
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#ffffff',
                fontSize: '14px', fontWeight: '800', cursor: loading ? 'default' : 'pointer',
                boxShadow: '0 6px 20px rgba(37,99,235,0.3)', marginTop: '8px',
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account & View SOPs'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: '800', textDecoration: 'none' }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
