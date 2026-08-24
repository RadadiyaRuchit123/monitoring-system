import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown, TrendingUp, Users, CheckCircle2,
  XCircle, AlertTriangle, Clock, RefreshCw,
  ShieldAlert, Send, Plus, Trash2, X, BookOpen,
  FileSpreadsheet, Trash, UserPlus, Zap,
} from 'lucide-react';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { ownerService } from '../services/ownerService';
import { sopService } from '../services/sopService';

// ─── STYLING CONSTANTS ────────────────────────────────────────────────

const ROLE_STYLES = {
  owner: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  office_staff: { bg: '#f5f3ff', text: '#6b21a8', border: '#ddd6fe' },
  karigar: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  cashier: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  ground_staff: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

// ─── COMPLIANCE RING ──────────────────────────────────────────────────

const ComplianceRing = ({ pct = 0, size = 110 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (pct / 100) * circum;
  const color = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#dc2626';
  const label = pct >= 90 ? 'Excellent' : pct >= 75 ? 'Good' : 'Attention!';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: '9px', fontWeight: '800', color, marginTop: '2px', textTransform: 'uppercase' }}>{label}</span>
      </div>
    </div>
  );
};

// ─── MINI COMPLIANCE BAR ──────────────────────────────────────────────

const ComplianceBar = ({ pct = 0, showLabel = true }) => {
  const color = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#dc2626';
  return (
    <div>
      <div style={{ height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '3px', width: `${Math.min(pct, 100)}%`,
          background: color, transition: 'width 0.8s ease',
        }} />
      </div>
      {showLabel && (
        <div style={{ color, fontSize: '11px', fontWeight: '700', marginTop: '3px', textAlign: 'right' }}>{pct}%</div>
      )}
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, subtext, color, bg, border }) => (
  <div style={{
    background: bg, border: `1px solid ${border}`, borderRadius: '16px',
    padding: '16px 18px', flex: 1, minWidth: '130px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      {Icon && <Icon size={16} color={color} />}
    </div>
    <div style={{ fontSize: '28px', fontWeight: '900', color, lineHeight: 1 }}>{value}</div>
    {subtext && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{subtext}</div>}
  </div>
);

// ─── STAFF CARD ────────────────────────────────────────────────────────

const StaffCard = ({ staff = {}, rank, onRoleChange, onDelete }) => {
  const pct = staff.compliance_pct || 0;
  const color = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#dc2626';
  const roleSt = ROLE_STYLES[staff.role] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: '16px', padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    }}>
      {/* Rank */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '900', color: '#64748b', flexShrink: 0,
      }}>
        #{rank}
      </div>

      {/* Avatar */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        background: roleSt.bg, border: `1px solid ${roleSt.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: '900', color: roleSt.text, flexShrink: 0,
        textTransform: 'uppercase',
      }}>
        {(staff.name || 'S').charAt(0)}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: '160px' }}>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '14px' }}>{staff.name || 'Staff Member'}</div>
        <div style={{ color: '#64748b', fontSize: '11px' }}>{staff.email}</div>
      </div>

      {/* Interactive Role Selector */}
      <div>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '2px', textTransform: 'uppercase' }}>ASSIGNED ROLE</div>
        <select
          value={staff.role || 'karigar'}
          onChange={e => onRoleChange(staff.user_id || staff.id, { role: e.target.value })}
          style={{
            padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
            background: roleSt.bg, color: roleSt.text, border: `1px solid ${roleSt.border}`,
            cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="karigar">🍳 KARIGAR (CHEF)</option>
          <option value="cashier">💰 CASHIER</option>
          <option value="office_staff">📋 OFFICE STAFF</option>
          <option value="owner">👑 OWNER</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '90px' }}>
        <div style={{ fontSize: '18px', fontWeight: '900', color }}>{pct}%</div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>{staff.completed || 0}/{staff.eligible || 0} done</div>
        <div style={{ width: '90px', marginTop: '3px' }}>
          <ComplianceBar pct={pct} showLabel={false} />
        </div>
      </div>

      {/* Delete Staff Member Button */}
      {onDelete && (
        <button
          onClick={() => onDelete(staff.id, staff.user_id, staff.name)}
          style={{
            padding: '8px 12px', borderRadius: '10px', border: '1px solid #fecaca',
            background: '#fef2f2', color: '#b91c1c', cursor: 'pointer',
            fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <Trash size={12} /> Remove
        </button>
      )}
    </div>
  );
};

// ─── ADD MEMBER MODAL ────────────────────────────────────────────────

const AddMemberModal = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('karigar');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), email: email.trim(), password, role });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create member');
    } finally {
      setSaving(false);
    }
  };

  const iStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '12px', background: '#f8fafc',
    border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  };
  const lStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '6px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '440px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '18px' }}>➕ Add New Team Member</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '12px', marginBottom: '14px', fontWeight: '600' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={lStyle}>SELECT ROLE *</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={iStyle}>
              <option value="karigar">🍳 KARIGAR (CHEF)</option>
              <option value="cashier">💰 CASHIER</option>
              <option value="office_staff">📋 OFFICE STAFF</option>
              <option value="owner">👑 OWNER</option>
            </select>
          </div>
          <div>
            <label style={lStyle}>FULL NAME *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh Chef" style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>EMAIL ADDRESS *</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ramesh@restaurant.com" style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>PASSWORD *</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={iStyle} />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
              {saving ? 'Creating...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── ADD TEMPLATE MODAL ───────────────────────────────────────────────

const AddTemplateModal = ({ onSave, onClose }) => {
  const [form, setForm] = useState({
    title: '', description: '',
    frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff',
    deadline_time: '10:00 AM', requires_evidence: false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const iStyle = { width: '100%', padding: '9px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '12px', outline: 'none' };
  const lStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '520px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '18px' }}>📋 Create SOP Template</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div><label style={lStyle}>TASK TITLE *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Clean & Prep Chutneys" style={iStyle} /></div>
          <div><label style={lStyle}>DESCRIPTION / INSTRUCTIONS</label><textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed step-by-step instructions..." rows={3} style={{ ...iStyle, resize: 'vertical' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={lStyle}>ASSIGNED ROLE *</label>
              <select value={form.assigned_role} onChange={e => set('assigned_role', e.target.value)} style={iStyle}>
                <option value="karigar">🍳 Karigar (Chef)</option>
                <option value="cashier">💰 Cashier</option>
                <option value="office_staff">📋 Office Staff</option>
                <option value="all">👥 All Staff</option>
              </select>
            </div>
            <div><label style={lStyle}>FREQUENCY</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} style={iStyle}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div><label style={lStyle}>DEADLINE TIME</label><input value={form.deadline_time} onChange={e => set('deadline_time', e.target.value)} placeholder="e.g. 10:00 AM" style={iStyle} /></div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Cancel</button>
          <button onClick={async () => { if (!form.title.trim()) return; setSaving(true); try { await onSave(form); onClose(); } finally { setSaving(false); } }} disabled={saving} style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN OWNER DASHBOARD ──────────────────────────────────────────────

export const AdminDashboard = () => {
  const { isOwner, isOfficeStaff, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data state
  const [summary, setSummary] = useState({ overall: {}, staffStats: [], exceptions: [] });
  const [escalations, setEscalations] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [frequency, setFrequency] = useState('daily');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ─── LOAD DATA ───────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sum = await ownerService.getPerformanceSummary().catch(e => null);
      const escs = await ownerService.getOpenEscalations().catch(e => []);
      const trend = await ownerService.getWeeklyTrend().catch(e => []);
      const activity = await ownerService.getRecentActivity(15).catch(e => []);
      const staff = await ownerService.getAllStaff().catch(e => []);
      const bList = await sopService.getBranches().catch(e => []);

      setSummary(sum || { overall: {}, staffStats: [], exceptions: [] });
      setEscalations(Array.isArray(escs) ? escs : []);
      setWeeklyTrend(Array.isArray(trend) ? trend : []);
      setRecentActivity(Array.isArray(activity) ? activity : []);
      setStaffList(Array.isArray(staff) ? staff : []);
      setBranchesList(Array.isArray(bList) ? bList : []);
    } catch (err) {
      console.warn('loadDashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = await sopService.getTemplates({ frequency }).catch(e => []);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, [frequency]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (activeTab === 'sop') loadTemplates(); }, [activeTab, loadTemplates]);

  // ─── ACTIONS ─────────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      const count = await sopService.syncTasksForToday(frequency);
      setSuccess(`✅ ${count} SOP tasks pushed & assigned to staff checklist for today!`);
      await loadDashboard();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError(err.message || 'Failed to push tasks'); }
    finally { setSyncing(false); }
  };

  const handleAddTemplate = async (form) => {
    await sopService.createTemplate(form);
    setSuccess('SOP Template created!');
    await loadTemplates();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return;
    await sopService.deleteTemplate(id);
    setSuccess('Deleted!');
    await loadTemplates();
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleLoadSamples = async () => {
    if (!confirm('Load standard restaurant SOP templates?')) return;
    setLoadingSample(true);
    try {
      const loaded = await sopService.loadSampleSOPTemplates();
      setSuccess(`✅ ${loaded.length} SOP templates loaded! Click "Push Tasks" to assign them to staff.`);
      await loadTemplates();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError(err.message); }
    finally { setLoadingSample(false); }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    setError('');
    try {
      const res = await sopService.exportTasksToCSV();
      setSuccess(`📥 Exported ${res.count} tasks to CSV file! Check your downloads.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleClearTodayTasks = async () => {
    if (!confirm('⚠️ Are you sure you want to clear today\'s assigned tasks?')) return;
    setClearing(true);
    setError('');
    try {
      const res = await sopService.clearTodayTasks();
      setSuccess(`🗑️ Cleared ${res.count} tasks from today's checklist.`);
      await loadDashboard();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Clear failed');
    } finally {
      setClearing(false);
    }
  };

  const handleUpdateStaff = async (userId, updates) => {
    try {
      if (updates?.role === 'removed') {
        const staff = staffList.find(s => s.user_id === userId || s.id === userId);
        await handleDeleteStaff(staff?.id, userId, staff?.name || 'Staff Member');
        return;
      }
      await sopService.updateStaffProfile(userId, updates);
      const fresh = await ownerService.getAllStaff().catch(e => []);
      setStaffList(Array.isArray(fresh) ? fresh.filter(s => s.role !== 'removed') : []);
      setSuccess('Staff role updated!');
      await loadDashboard();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message || 'Failed to update staff role');
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      const newProfile = await sopService.createTeamMember(memberData);
      const fresh = await ownerService.getAllStaff().catch(e => []);
      setStaffList(Array.isArray(fresh) ? fresh.filter(s => s.role !== 'removed') : []);
      setSuccess(`✅ Created team member: ${newProfile.name}`);
      await loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create member');
    }
  };

  const handleDeleteStaff = async (profileId, userId, name) => {
    if (!confirm(`⚠️ Are you sure you want to remove ${name} from team?`)) return;
    try {
      // Optimistically remove from state immediately
      setStaffList(prev => prev.filter(s => s.id !== profileId && s.user_id !== userId));
      setSummary(prev => ({
        ...prev,
        staffStats: (prev.staffStats || []).filter(s => s.id !== profileId && s.user_id !== userId),
      }));

      await sopService.deleteStaffProfile(profileId, userId);
      const fresh = await ownerService.getAllStaff().catch(e => []);
      setStaffList(Array.isArray(fresh) ? fresh.filter(s => s.role !== 'removed') : []);
      setSuccess(`🗑️ Removed ${name} from team.`);
      await loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete staff member');
    }
  };

  const handlePromoteToOwner = async () => {
    if (!profile?.user_id) return;
    try {
      await sopService.updateStaffProfile(profile.user_id, { role: 'owner' });
      setSuccess('👑 Promoted your account to Owner! Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err.message || 'Failed to promote');
    }
  };

  // ─── RENDER HELPERS ──────────────────────────────────────────────

  const ROLE_PRIORITY = { owner: 1, admin: 1, office_staff: 2, karigar: 3, ground_staff: 3, cashier: 4, user: 5 };

  const overall = summary?.overall || {};
  const compliancePct = overall.compliancePct || 0;

  const safeStaffList = Array.isArray(staffList)
    ? staffList
      .filter(s => s.role !== 'removed')
      .sort((a, b) => {
        const pA = ROLE_PRIORITY[a.role] || 99;
        const pB = ROLE_PRIORITY[b.role] || 99;
        if (pA !== pB) return pA - pB;
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return (a.name || '').localeCompare(b.name || '');
      })
    : [];

  const filteredStaffList = safeStaffList.filter(s => {
    if (selectedRoleFilter !== 'all') {
      if (selectedRoleFilter === 'karigar') {
        if (!['karigar', 'ground_staff', 'user'].includes(s.role)) return false;
      } else if (s.role !== selectedRoleFilter) {
        return false;
      }
    }
    if (selectedBranchFilter !== 'all') {
      const bName = s.branches?.name || s.branch_name || s.branch || '';
      if (bName !== selectedBranchFilter && s.branch_id !== selectedBranchFilter) {
        return false;
      }
    }
    return true;
  });

  const safeTemplates = Array.isArray(templates) ? templates : [];
  const safeEscalations = Array.isArray(escalations) ? escalations : [];

  const groundStaffStats = (summary?.staffStats || []).filter(s =>
    ['karigar', 'cashier', 'ground_staff', 'user'].includes(s.role)
  );
  const criticalStaff = groundStaffStats.filter(s => s.compliance_pct < 75);
  const openIssues = (overall.notCompleted || 0) + (overall.partial || 0);

  const TABS = [
    { id: 'dashboard', label: '📊 Control Dashboard', desc: 'Real-time performance' },
    { id: 'sop', label: '📋 SOP Builder', desc: 'Templates & tasks' },
    { id: 'team', label: '👥 Team Hierarchy', desc: 'Roles & team members' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {showAddModal && <AddTemplateModal onSave={handleAddTemplate} onClose={() => setShowAddModal(false)} />}
      {showAddMemberModal && <AddMemberModal onSave={handleAddMember} onClose={() => setShowAddMemberModal(false)} />}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>

        {/* PROMOTIONAL OWNER ALERT IF LOGGED IN ACCOUNT IS NOT OWNER YET */}
        {profile?.role !== 'owner' && (
          <div style={{
            padding: '14px 20px', borderRadius: '16px', marginBottom: '20px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a', display: 'flex', alignItems: 'center',
            justify: 'space-between', gap: '16px', boxShadow: '0 4px 12px rgba(217,119,6,0.1)', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Crown size={20} color="#d97706" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#92400e' }}>
                  Your account is currently set to "{profile?.role || 'karigar'}".
                </div>
                <div style={{ fontSize: '11px', color: '#b45309' }}>
                  Click promote to set your account as Owner & access full Control Center rights.
                </div>
              </div>
            </div>
            <button
              onClick={handlePromoteToOwner}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                color: '#ffffff', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(217,119,6,0.25)', whiteSpace: 'nowrap',
              }}
            >
              👑 Promote Me to Owner
            </button>
          </div>
        )}

        {/* ══════════════════ HEADER BANNER (Clean Light) ══════════════════ */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          borderRadius: '24px', padding: '18px 20px', marginBottom: '20px',
          border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ minWidth: '220px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: '20px', background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Crown size={12} color="#d97706" /> {isOwner ? 'OWNER CONTROL CENTER' : 'MANAGER PANEL'}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>• {today}</span>
              </div>
              <div style={{ color: '#0f172a', fontSize: 'clamp(20px, 4.5vw, 26px)', fontWeight: '900', letterSpacing: '-0.5px' }}>
                Restaurant SOP Control Center
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                Manage SOP checklists, staff roles & push daily tasks to team
              </div>
            </div>

            {/* Right: Ring + Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
              {summary && <ComplianceRing pct={compliancePct} size={84} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button onClick={handleSync} disabled={syncing} style={{
                    flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '9px 12px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff', cursor: syncing ? 'default' : 'pointer', fontSize: '12px', fontWeight: '800',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)', whiteSpace: 'nowrap',
                  }}>
                    <Send size={12} />
                    {syncing ? 'Pushing...' : 'Push Tasks'}
                  </button>
                  <button onClick={handleExportCSV} disabled={exporting} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '9px 12px', borderRadius: '10px', border: '1px solid #a7f3d0',
                    background: '#ecfdf5', color: '#047857', cursor: exporting ? 'default' : 'pointer', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap',
                  }}>
                    <FileSpreadsheet size={12} /> {exporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button onClick={loadDashboard} style={{
                    flex: 1, minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1',
                    background: '#ffffff', color: '#475569', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
                  }}>
                    <RefreshCw size={11} /> Refresh
                  </button>
                  <button onClick={handleClearTodayTasks} disabled={clearing} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '8px 12px', borderRadius: '10px', border: '1px solid #fecaca',
                    background: '#fef2f2', color: '#b91c1c', cursor: clearing ? 'default' : 'pointer', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap',
                  }}>
                    <Trash size={11} /> {clearing ? 'Clearing...' : 'Clear Tasks'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
        {success && <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '13px', fontWeight: '600' }}>{success}</div>}

        {/* ══════════════════ NAVIGATION TABS ══════════════════ */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px',
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 14px', borderRadius: '16px', border: `2px solid ${active ? '#2563eb' : '#e2e8f0'}`,
                  background: active ? '#eff6ff' : '#ffffff', color: active ? '#2563eb' : '#475569',
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: active ? '0 4px 14px rgba(37,99,235,0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: '900', color: active ? '#2563eb' : '#0f172a' }}>{tab.label}</div>
                <div style={{ fontSize: '11px', color: active ? '#3b82f6' : '#64748b', marginTop: '2px', fontWeight: '500' }}>{tab.desc}</div>
              </button>
            );
          })}
        </div>

        {/* ══════════════════ TAB 1: CONTROL DASHBOARD ══════════════════ */}
        {activeTab === 'dashboard' && (
          loading ? (
            <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <LoadingSpinner label="Analyzing compliance data..." />
            </div>
          ) : (
            <>
              {/* KPI Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <StatCard icon={BookOpen} label="Total SOPs Today" value={overall.total || 0} subtext={`${overall.completed || 0} completed`} color="#2563eb" bg="#eff6ff" border="#bfdbfe" />
                <StatCard icon={CheckCircle2} label="Completed SOPs" value={overall.completed || 0} subtext={`${compliancePct}% compliance`} color="#059669" bg="#ecfdf5" border="#a7f3d0" />
                <StatCard icon={Clock} label="Pending Submission" value={overall.pending || 0} subtext="Awaiting ground staff" color="#d97706" bg="#fffbeb" border="#fde68a" />
                <StatCard icon={AlertTriangle} label="Partial / Delayed" value={overall.partial || 0} subtext="Reason recorded" color="#b45309" bg="#fef3c7" border="#fde68a" />
                <StatCard icon={XCircle} label="Not Completed" value={overall.notCompleted || 0} subtext="Critical issues" color="#dc2626" bg="#fef2f2" border="#fecaca" />
                <StatCard icon={ShieldAlert} label="Open Escalations" value={safeEscalations.length} subtext="Requires owner decision" color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
              </div>

              {/* Grid: Escalations + Staff Performance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

                {/* Left: Open Escalations Panel */}
                <div style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '22px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldAlert size={16} color="#7c3aed" />
                      <span style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>Escalations Panel</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', background: safeEscalations.length ? '#fef2f2' : '#ecfdf5', color: safeEscalations.length ? '#dc2626' : '#059669' }}>
                      {safeEscalations.length} Open
                    </span>
                  </div>

                  {safeEscalations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
                      🎉 No unresolved escalations right now! All issues clear.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {safeEscalations.map(esc => (
                        <div key={esc.id} style={{
                          padding: '14px', borderRadius: '14px', background: '#fef2f2', border: '1px solid #fecaca',
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#991b1b', marginBottom: '4px' }}>
                            🚨 {esc.assigned_task?.task_templates?.title || 'SOP Task Issue'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#7f1d1d', marginBottom: '6px' }}>
                            <strong>Reason:</strong> {esc.reason}
                          </div>
                          <div style={{ fontSize: '11px', color: '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Staff: {esc.assigned_task?.staff?.name || 'Ground Staff'}</span>
                            <span>{new Date(esc.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Staff Leaderboard */}
                <div style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '22px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} color="#2563eb" />
                      <span style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>Staff Leaderboard</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Sorted by %</span>
                  </div>

                  {groundStaffStats.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
                      No ground staff task entries today yet. Click "Push Tasks".
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {groundStaffStats.map(s => {
                        const cColor = s.compliance_pct >= 90 ? '#059669' : s.compliance_pct >= 75 ? '#d97706' : '#dc2626';
                        return (
                          <div key={s.user_id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0',
                          }}>
                            <div>
                              <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>{s.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
                                {s.role?.replace('_', ' ')} • {s.completed}/{s.total} done
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '16px', fontWeight: '900', color: cColor }}>{s.compliance_pct}%</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom: Staff List with Role Management */}
              <div style={{
                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '22px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)', marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="#2563eb" />
                    <span style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>Team Compliance & Roles</span>
                  </div>
                  {criticalStaff.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                      ⚠️ {criticalStaff.length} below 75%
                    </span>
                  )}
                </div>

                {safeStaffList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
                    No staff profiles registered yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(() => {
                      const groundStaffFull = safeStaffList.filter(s => ['karigar', 'cashier', 'ground_staff', 'user'].includes(s.role));
                      const withStats = groundStaffFull.map(s => {
                        const stats = groundStaffStats.find(gs => gs.user_id === s.user_id);
                        return stats || {
                          id: s.id, user_id: s.user_id, name: s.name, email: s.email, role: s.role,
                          total: 0, completed: 0, eligible: 0, compliance_pct: 0,
                        };
                      });
                      return withStats
                        .sort((a, b) => b.compliance_pct - a.compliance_pct)
                        .map((s, i) => <StaffCard key={s.user_id || s.id} staff={s} rank={i + 1} onRoleChange={handleUpdateStaff} onDelete={handleDeleteStaff} />);
                    })()}
                  </div>
                )}
              </div>
            </>
          )
        )}

        {/* ══════════════════ TAB 2: SOP BUILDER ══════════════════ */}
        {activeTab === 'sop' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: '#ffffff', borderRadius: '10px', padding: '3px', border: '1px solid #cbd5e1', gap: '3px' }}>
                {['daily', 'weekly', 'monthly'].map(f => (
                  <button key={f} onClick={() => setFrequency(f)} style={{
                    padding: '6px 14px', borderRadius: '7px', border: 'none',
                    background: frequency === f ? '#eff6ff' : 'transparent',
                    color: frequency === f ? '#2563eb' : '#64748b',
                    cursor: 'pointer', fontSize: '12px', fontWeight: frequency === f ? '800' : '600', textTransform: 'capitalize',
                  }}>{f}</button>
                ))}
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button onClick={handleLoadSamples} disabled={loadingSample} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '9px 14px', borderRadius: '10px', border: '1px solid #fde68a',
                  background: '#fffbeb', color: '#b45309',
                  cursor: loadingSample ? 'default' : 'pointer', fontSize: '12px', fontWeight: '800',
                }}>
                  <Zap size={13} /> {loadingSample ? 'Loading...' : '⚡ Load Master SOPs'}
                </button>
                <button onClick={() => setShowAddModal(true)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '800',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                }}>
                  <Plus size={14} /> New Template
                </button>
              </div>
            </div>

            {loadingTemplates ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <LoadingSpinner label="Loading templates..." />
              </div>
            ) : safeTemplates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>No SOP templates created yet</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Click "Load Master SOPs" to generate standard restaurant checklists</div>
                <button onClick={handleLoadSamples} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>
                  ⚡ Load Master Restaurant SOPs
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {safeTemplates.map(t => (
                  <div key={t.id} style={{
                    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: '14px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>{t.title}</div>
                      {t.description && <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>{t.description}</div>}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: '#64748b' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: '800', color: '#2563eb' }}>
                          Assigned: {t.assigned_role?.replace('_', ' ')}
                        </span>
                        {t.deadline_time && <><span>·</span><span>📅 Due: {t.deadline_time}</span></>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTemplate(t.id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════ TAB 3: TEAM HIERARCHY ══════════════════ */}
        {activeTab === 'team' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                Restaurant Staff & Team Roles ({safeStaffList.length})
              </div>
              <button onClick={() => setShowAddMemberModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 18px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#ffffff',
                cursor: 'pointer', fontSize: '13px', fontWeight: '800',
                boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
              }}>
                <UserPlus size={14} /> ➕ Add Team Member
              </button>
            </div>

            {/* Summary Count Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Owner', value: safeStaffList.filter(s => s.role === 'owner').length, color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
                { label: 'Office Staff', value: safeStaffList.filter(s => s.role === 'office_staff').length, color: '#6b21a8', bg: '#f5f3ff', border: '#ddd6fe' },
                { label: 'Karigar (Chef)', value: safeStaffList.filter(s => ['karigar', 'ground_staff', 'user'].includes(s.role)).length, color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
                { label: 'Cashier', value: safeStaffList.filter(s => s.role === 'cashier').length, color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
              ].map(s => (
                <div key={s.label} style={{ padding: '14px', borderRadius: '14px', textAlign: 'center', background: s.bg, border: `1px solid ${s.border}` }}>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: s.color, fontWeight: '700' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter Bar: Branch & Role */}
            <div style={{
              display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '16px',
              background: '#ffffff', padding: '12px 18px', borderRadius: '16px',
              border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}>
              {/* Branch Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569' }}>📍 Filter Branch:</span>
                <select
                  value={selectedBranchFilter}
                  onChange={e => setSelectedBranchFilter(e.target.value)}
                  style={{
                    padding: '6px 12px', borderRadius: '10px', border: '1px solid #cbd5e1',
                    background: '#f8fafc', fontSize: '12px', fontWeight: '700', color: '#0f172a',
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="all">All Branches ({branchesList.length || 16})</option>
                  {branchesList.map(b => (
                    <option key={b.id || b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Role Filter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginRight: '4px' }}>👤 Role:</span>
                {[
                  { id: 'all', label: 'All Roles' },
                  { id: 'owner', label: '👑 Owner' },
                  { id: 'office_staff', label: '👤 Office Staff' },
                  { id: 'karigar', label: '🍳 Karigar' },
                  { id: 'cashier', label: '💰 Cashier' },
                ].map(rf => (
                  <button
                    key={rf.id}
                    onClick={() => setSelectedRoleFilter(rf.id)}
                    style={{
                      padding: '5px 12px', borderRadius: '8px', border: '1px solid',
                      borderColor: selectedRoleFilter === rf.id ? '#2563eb' : '#e2e8f0',
                      background: selectedRoleFilter === rf.id ? '#eff6ff' : '#ffffff',
                      color: selectedRoleFilter === rf.id ? '#2563eb' : '#64748b',
                      fontSize: '12px', fontWeight: selectedRoleFilter === rf.id ? '800' : '600',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff List */}
            {filteredStaffList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
                No team members found matching the selected filters.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredStaffList.map((s, i) => (
                  <StaffCard
                    key={s.id || s.user_id}
                    staff={s}
                    rank={i + 1}
                    onRoleChange={handleUpdateStaff}
                    onDelete={handleDeleteStaff}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
