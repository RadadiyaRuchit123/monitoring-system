import React, { useState } from 'react';
import { X } from 'lucide-react';

// ─── EXPORT RANGE MODAL ──────────────────────────────────────────────

export const ExportRangeModal = ({ mode = 'csv', branchesList = [], onExport, onClose }) => {
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [branchId, setBranchId] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please select both Start Date and End Date.');
      return;
    }
    setExporting(true);
    setError('');
    try {
      await onExport({
        mode,
        startDate,
        endDate,
        branchId: branchId === 'all' ? null : branchId,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const iStyle = { width: '100%', padding: '9px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '12px', outline: 'none', boxSizing: 'border-box' };
  const lStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '420px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '17px' }}>
            {mode === 'csv' ? '📥 Export CSV Data' : '📄 Export PDF Audit Report'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '12px', marginBottom: '14px', fontWeight: '600' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lStyle}>FROM DATE *</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} style={iStyle} />
            </div>
            <div>
              <label style={lStyle}>TO DATE *</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} style={iStyle} />
            </div>
          </div>

          <div>
            <label style={lStyle}>FILTER BRANCH</label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)} style={iStyle}>
              <option value="all">All Branches (16)</option>
              {branchesList.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Cancel</button>
            <button type="submit" disabled={exporting} style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: mode === 'csv' ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '800' }}>
              {exporting ? 'Processing...' : (mode === 'csv' ? '📥 Download CSV' : '📄 Generate PDF')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── ADD MEMBER MODAL ────────────────────────────────────────────────

export const AddMemberModal = ({ branchesList = [], onSave, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('karigar');
  const [branchId, setBranchId] = useState(branchesList[0]?.id || '');
  const [shift, setShift] = useState('day');
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
      await onSave({ name: name.trim(), email: email.trim(), password, role, branch_id: branchId || null, shift });
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
      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '460px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
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

          {['karigar', 'cashier'].includes(role) && (
            <>
              <div>
                <label style={lStyle}>SELECT BRANCH (16 BRANCHES) *</label>
                <select value={branchId} onChange={e => setBranchId(e.target.value)} style={iStyle}>
                  {branchesList.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lStyle}>SELECT SHIFT *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'day', label: '☀️ Day Shift', desc: 'Morning / Afternoon' },
                    { id: 'night', label: '🌙 Night Shift', desc: 'Evening / Night Closing' },
                  ].map(s => {
                    const active = shift === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setShift(s.id)}
                        style={{
                          padding: '10px 12px', borderRadius: '12px', textAlign: 'left',
                          border: `2px solid ${active ? '#2563eb' : '#e2e8f0'}`,
                          background: active ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: '800', color: active ? '#2563eb' : '#0f172a' }}>{s.label}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

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

export const AddTemplateModal = ({ onSave, onClose }) => {
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
