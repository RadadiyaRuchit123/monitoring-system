import React from 'react';
import { UserPlus } from 'lucide-react';
import { StaffCard } from './StaffCard';

export const TeamHierarchyTab = ({
  safeStaffList = [],
  setShowAddMemberModal,
  selectedBranchFilter,
  setSelectedBranchFilter,
  branchesList = [],
  selectedRoleFilter,
  setSelectedRoleFilter,
  filteredStaffList = [],
  handleUpdateStaff,
  handleDeleteStaff,
}) => {
  return (
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
              branchesList={branchesList}
              onUpdateStaff={handleUpdateStaff}
              onDelete={handleDeleteStaff}
            />
          ))}
        </div>
      )}
    </>
  );
};
