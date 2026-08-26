import React from 'react';
import { Trash } from 'lucide-react';
import { ROLE_STYLES, ComplianceBar } from './AdminStatCards';

export const StaffCard = ({ staff = {}, rank, branchesList = [], onUpdateStaff, onDelete }) => {
  const pct = staff.compliance_pct || 0;
  const color = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#dc2626';
  const roleSt = ROLE_STYLES[staff.role] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: '16px', padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    }}>
      {/* Rank & Avatar Group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '900', color: '#64748b', flexShrink: 0,
        }}>
          #{rank}
        </div>

        <div style={{
          width: '38px', height: '38px', borderRadius: '12px',
          background: roleSt.bg, border: `1px solid ${roleSt.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: '900', color: roleSt.text, flexShrink: 0,
          textTransform: 'uppercase',
        }}>
          {(staff.name || 'S').charAt(0)}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '14px', wordBreak: 'break-word' }}>{staff.name || 'Staff Member'}</div>
        <div style={{ color: '#64748b', fontSize: '11px', wordBreak: 'break-all' }}>{staff.email}</div>
      </div>

      {/* Interactive Controls Wrapper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 280px' }}>
        {/* Interactive Role Selector */}
        <div style={{ flex: '1 1 120px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '2px', textTransform: 'uppercase' }}>ASSIGNED ROLE</div>
          <select
            value={staff.role || 'karigar'}
            onChange={e => {
              const newRole = e.target.value;
              const updates = { role: newRole };
              if (['office_staff', 'owner'].includes(newRole)) {
                updates.branch_id = null;
                updates.shift = 'all';
              }
              onUpdateStaff(staff.user_id || staff.id, updates);
            }}
            style={{
              width: '100%', padding: '6px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
              background: roleSt.bg, color: roleSt.text, border: `1px solid ${roleSt.border}`,
              cursor: 'pointer', outline: 'none', boxSizing: 'border-box',
            }}
          >
            <option value="karigar">🍳 KARIGAR (CHEF)</option>
            <option value="cashier">💰 CASHIER</option>
            <option value="office_staff">📋 OFFICE STAFF</option>
            <option value="owner">👑 OWNER</option>
          </select>
        </div>

        {/* Interactive Branch Transfer & Shift Selector (Only for Karigar & Cashier) */}
        {['karigar', 'cashier', 'ground_staff', 'user'].includes(staff.role) ? (
          <>
            <div style={{ flex: '1 1 130px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '2px', textTransform: 'uppercase' }}>📍 ASSIGNED BRANCH</div>
              <select
                value={staff.branch_id || ''}
                onChange={e => onUpdateStaff(staff.user_id || staff.id, { branch_id: e.target.value || null })}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700',
                  background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1',
                  cursor: 'pointer', outline: 'none', boxSizing: 'border-box',
                }}
              >
                <option value="">-- Select Branch --</option>
                {branchesList.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Interactive Shift Change Selector */}
            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '2px', textTransform: 'uppercase' }}>⏰ SHIFT</div>
              <select
                value={staff.shift || 'all'}
                onChange={e => onUpdateStaff(staff.user_id || staff.id, { shift: e.target.value })}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
                  background: staff.shift === 'day' ? '#fffbeb' : staff.shift === 'night' ? '#f5f3ff' : '#eff6ff',
                  color: staff.shift === 'day' ? '#b45309' : staff.shift === 'night' ? '#6d28d9' : '#1d4ed8',
                  border: `1px solid ${staff.shift === 'day' ? '#fde68a' : staff.shift === 'night' ? '#ddd6fe' : '#bfdbfe'}`,
                  cursor: 'pointer', outline: 'none', boxSizing: 'border-box',
                }}
              >
                <option value="all">🔄 ALL SHIFTS</option>
                <option value="day">☀️ DAY SHIFT</option>
                <option value="night">🌙 NIGHT SHIFT</option>
              </select>
            </div>
          </>
        ) : (
          <div style={{
            padding: '6px 12px', borderRadius: '10px',
            background: staff.role === 'owner' ? '#fef3c7' : '#f5f3ff',
            border: `1px solid ${staff.role === 'owner' ? '#fde68a' : '#ddd6fe'}`,
            color: staff.role === 'owner' ? '#b45309' : '#6d28d9',
            fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap',
          }}>
            {staff.role === 'owner' ? '👑 ALL BRANCHES & SHIFTS OVERSEER' : '📋 CENTRAL OFFICE OVERSEER'}
          </div>
        )}
      </div>

      {/* Stats & Delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', flexShrink: 0 }}>
        {['karigar', 'cashier', 'ground_staff', 'user'].includes(staff.role) ? (
          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '75px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color }}>{pct}%</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>{staff.completed || 0}/{staff.eligible || 0} done</div>
            <div style={{ width: '75px', marginTop: '3px' }}>
              <ComplianceBar pct={pct} showLabel={false} />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '8px' }}>
              FULL ACCESS
            </span>
          </div>
        )}

        {/* Delete Staff Member Button (Not allowed for Owner) */}
        {onDelete && staff.role !== 'owner' && (
          <button
            onClick={() => onDelete(staff.id, staff.user_id, staff.name)}
            style={{
              padding: '8px 10px', borderRadius: '10px', border: '1px solid #fecaca',
              background: '#fef2f2', color: '#b91c1c', cursor: 'pointer',
              fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            <Trash size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
