import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { verificationService } from '../services/verificationService';
import { sopService } from '../services/sopService';

import {
  FaUserCheck, FaCircleCheck, FaTriangleExclamation, FaCircleXmark, FaClock,
  FaChevronDown, FaRotate, FaUsers, FaXmark, FaSpinner, FaShieldHalved, FaFileCsv,
} from 'react-icons/fa6';

// ─── CONSTANTS ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:        { label: 'Pending',        color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  completed:      { label: 'Completed',      color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  partial:        { label: 'Partial',        color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  not_completed:  { label: 'Not Completed',  color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  not_applicable: { label: 'N/A',            color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
};

const VERIFY_STATUS = {
  verified:   { label: 'Verified ✓',    color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  follow_up:  { label: 'Follow-Up ⚡',  color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  escalated:  { label: 'Escalated 🚨',  color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
};

// ─── VERIFY ACTION PANEL ───────────────────────────────────────────────────

const VerifyActions = ({ task, onAction }) => {
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'verified' | 'follow_up' | 'escalated'

  const handleSubmit = () => {
    if ((mode === 'follow_up' || mode === 'escalated') && !note.trim()) return;
    onAction({ taskId: task.id, verificationStatus: mode, note: note.trim() });
    setOpen(false);
    setNote('');
    setMode(null);
  };

  const existingVerification = task.task_verifications?.[0];
  const currSt = existingVerification ? VERIFY_STATUS[existingVerification.verification_status] : null;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '10px',
          border: `1px solid ${currSt ? currSt.border : '#cbd5e1'}`,
          background: currSt ? currSt.bg : '#ffffff',
          color: currSt ? currSt.color : '#0f172a',
          fontSize: '12px', fontWeight: '800', cursor: 'pointer',
        }}
      >
        {currSt ? currSt.label : 'Verify Task'} <FaChevronDown size={10} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: '16px', marginTop: '8px', zIndex: 100,
          background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px',
          padding: '16px', width: '280px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        }}>
          {!mode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => { setMode('verified'); }}
                style={{
                  padding: '10px', borderRadius: '10px', border: 'none',
                  background: '#ecfdf5', color: '#047857', fontWeight: '800',
                  cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                }}
              >
                ✓ Mark as Verified
              </button>
              <button
                onClick={() => setMode('follow_up')}
                style={{
                  padding: '10px', borderRadius: '10px', border: 'none',
                  background: '#fffbeb', color: '#b45309', fontWeight: '800',
                  cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                }}
              >
                ⚡ Request Follow-Up
              </button>
              <button
                onClick={() => setMode('escalated')}
                style={{
                  padding: '10px', borderRadius: '10px', border: 'none',
                  background: '#fef2f2', color: '#b91c1c', fontWeight: '800',
                  cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                }}
              >
                🚨 Escalate to Owner
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Note / Instructions ({VERIFY_STATUS[mode].label})
              </div>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={mode === 'verified' ? 'Optional verification note...' : 'Note for staff / owner...'}
                style={{
                  width: '100%', padding: '8px', borderRadius: '8px',
                  border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none',
                  boxSizing: 'border-box', marginBottom: '10px',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setMode(null)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '11px', fontWeight: '600' }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', border: 'none',
                    background: VERIFY_STATUS[mode].color, color: '#fff', fontSize: '11px', fontWeight: '800',
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── VERIFICATION TASK ROW ─────────────────────────────────────────────────

const TaskVerificationCard = ({ task, onVerify }) => {
  const tmpl = task.task_templates || {};
  const staff = task.staff || {};
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const verification = task.task_verifications?.[0];
  const isEscalated = task.escalations?.length > 0;

  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: '16px', padding: '16px 20px',
      borderLeft: `4px solid ${statusCfg.color}`,
      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
      display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap',
    }}>
      {/* Left: Task info */}
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
            background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
          }}>{statusCfg.label}</div>
          {isEscalated && (
            <div style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              🚨 Escalated
            </div>
          )}
        </div>

        <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>
          {tmpl.title}
        </div>

        {/* Reason */}
        {task.reason && (
          <div style={{
            padding: '8px 12px', borderRadius: '10px', marginTop: '6px',
            background: '#fff7ed', border: '1px solid #fed7aa',
          }}>
            <div style={{ color: '#c2410c', fontSize: '12px', fontWeight: '700' }}>
              Reason: {task.reason}
            </div>
            {task.action_required && (
              <div style={{ color: '#ea580c', fontSize: '12px', marginTop: '2px' }}>
                Action Planned: {task.action_required}
              </div>
            )}
          </div>
        )}

        {/* Verification note & Verifier Name */}
        {verification && (
          <div style={{
            padding: '8px 12px', borderRadius: '10px', marginTop: '6px',
            background: verification.verification_status === 'verified' ? '#ecfdf5' : '#fffbeb',
            border: `1px solid ${verification.verification_status === 'verified' ? '#a7f3d0' : '#fde68a'}`,
          }}>
            <div style={{ color: verification.verification_status === 'verified' ? '#047857' : '#b45309', fontSize: '12px', fontWeight: '800' }}>
              ✓ Verified by {verification.verifier?.name || 'Office Staff'} ({verification.verification_status.toUpperCase()})
            </div>
            {verification.follow_up_note && (
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px', fontWeight: '600' }}>
                Note: {verification.follow_up_note}
              </div>
            )}
          </div>
        )}

        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '6px', fontWeight: '500' }}>
          {tmpl.deadline_time && `📅 Due by ${tmpl.deadline_time} · `}
          {task.submitted_at && `Submitted: ${new Date(task.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
        </div>
      </div>

      {/* Middle: Staff info */}
      <div style={{
        minWidth: '140px', padding: '10px 14px', borderRadius: '12px',
        background: '#f8fafc', border: '1px solid #e2e8f0',
      }}>
        <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '800', marginBottom: '2px' }}>TASK OWNER</div>
        <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '13px' }}>{staff.name || 'Staff Member'}</div>
        <div style={{ color: '#2563eb', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
          {staff.role?.replace('_', ' ')}
        </div>
      </div>

      {/* Right: Verify action */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <VerifyActions task={task} onAction={onVerify} />
      </div>
    </div>
  );
};

// ─── MAIN VERIFICATION PANEL PAGE ──────────────────────────────────────────

export const VerificationPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'escalations' | 'all'
  const [tasks, setTasks] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingTasks, allEscs] = await Promise.all([
        verificationService.getPendingVerifications(),
        verificationService.getUnresolvedEscalations(),
      ]);
      setTasks(pendingTasks);
      setEscalations(allEscs);
    } catch (err) {
      if (!err.message?.includes('JWT issued at future')) {
        setError(err.message || 'Failed to load verification data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleVerify = async ({ taskId, verificationStatus, note }) => {
    try {
      await verificationService.verifyTask({
        assignedTaskId: taskId,
        verificationStatus,
        followUpNote: note,
        verifiedBy: user.id,
      });
      setSuccess(`Task marked as ${verificationStatus}`);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
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

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      <Header />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
          border: '1px solid #ddd6fe', borderRadius: '24px',
          padding: '24px 28px', marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <div style={{ color: '#7c3aed', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px' }}>
              OFFICE STAFF VERIFICATION PANEL
            </div>
            <div style={{ color: '#0f172a', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>
              Task Audit & Verification Checklist
            </div>
            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
              {todayLabel} · Accountability Tier 2 Verification
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', borderRadius: '12px', border: '1px solid #a7f3d0',
                background: '#ecfdf5', color: '#047857', cursor: exporting ? 'default' : 'pointer',
                fontSize: '12px', fontWeight: '800',
              }}
            >
              <FaFileCsv size={13} /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={loadData}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', borderRadius: '12px', border: 'none',
                background: '#7c3aed', color: '#ffffff', cursor: 'pointer',
                fontSize: '12px', fontWeight: '800', boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
              }}
            >
              <FaRotate size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
        {success && <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '13px', fontWeight: '600' }}>{success}</div>}

        {/* Tab selection */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {[
            { id: 'pending', label: `Pending Audit (${tasks.length})` },
            { id: 'escalations', label: `Escalations (${escalations.length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 18px', borderRadius: '12px', border: 'none',
                background: activeTab === t.id ? '#7c3aed' : '#ffffff',
                color: activeTab === t.id ? '#ffffff' : '#475569',
                border: activeTab === t.id ? 'none' : '1px solid #e2e8f0',
                cursor: 'pointer', fontSize: '13px', fontWeight: '800',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <LoadingSpinner label="Loading tasks for verification..." />
          </div>
        ) : activeTab === 'pending' ? (
          tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
              <FaCircleCheck size={40} color="#059669" style={{ marginBottom: '12px' }} />
              <div style={{ color: '#0f172a', fontSize: '16px', fontWeight: '900' }}>All Tasks Verified!</div>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>No pending tasks requiring audit right now.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.map(t => <TaskVerificationCard key={t.id} task={t} onVerify={handleVerify} />)}
            </div>
          )
        ) : (
          escalations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
              <FaShieldHalved size={40} color="#059669" style={{ marginBottom: '12px' }} />
              <div style={{ color: '#0f172a', fontSize: '16px', fontWeight: '900' }}>No Open Escalations</div>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>All task issues are resolved.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {escalations.map(esc => (
                <div key={esc.id} style={{ padding: '16px', borderRadius: '16px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#991b1b', marginBottom: '4px' }}>
                    🚨 {esc.assigned_task?.task_templates?.title || 'Escalated Task'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
                    <strong>Reason:</strong> {esc.reason}
                  </div>
                  <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '6px' }}>
                    Staff: {esc.assigned_task?.staff?.name || 'Staff Member'} · Escalated at {new Date(esc.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
};

export default VerificationPanel;
