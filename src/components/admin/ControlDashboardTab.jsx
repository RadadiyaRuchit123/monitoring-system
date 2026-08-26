import React from 'react';
import { BookOpen, CheckCircle2, Clock, AlertTriangle, XCircle, ShieldAlert, Users } from 'lucide-react';
import { StatCard } from './AdminStatCards';
import { StaffCard } from './StaffCard';
import { LoadingSpinner } from '../LoadingState';

export const ControlDashboardTab = ({
  loading,
  overall = {},
  compliancePct = 0,
  safeEscalations = [],
  groundStaffStats = [],
  safeStaffList = [],
  criticalStaff = [],
  summary = {},
  branchesList = [],
  handleUpdateStaff,
  handleDeleteStaff,
}) => {
  if (loading) {
    return (
      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
        <LoadingSpinner label="Analyzing compliance data..." />
      </div>
    );
  }

  return (
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>

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
              const withStats = safeStaffList.map(s => {
                const stats = (summary?.staffStats || []).find(gs => gs.user_id === s.user_id || gs.user_id === s.id);
                return {
                  ...s,
                  total: stats?.total || 0,
                  completed: stats?.completed || 0,
                  eligible: stats?.eligible || 0,
                  compliance_pct: stats ? stats.compliance_pct : 0,
                };
              });
              return withStats.map((s, i) => (
                <StaffCard
                  key={s.user_id || s.id}
                  staff={s}
                  rank={i + 1}
                  branchesList={branchesList}
                  onUpdateStaff={handleUpdateStaff}
                  onDelete={handleDeleteStaff}
                />
              ));
            })()}
          </div>
        )}
      </div>
    </>
  );
};
