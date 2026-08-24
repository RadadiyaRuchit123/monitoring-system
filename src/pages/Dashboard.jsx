import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { sopService } from '../services/sopService';
import {
  FaCircleCheck, FaClock, FaTriangleExclamation, FaCircleXmark, FaCircleMinus,
  FaCalendarDays, FaCalendarWeek, FaCalendar, FaRotate, FaXmark, FaCheck, FaExclamation,
  FaHourglassHalf,
} from 'react-icons/fa6';

// Status styling configuration (5-Level System)
const STATUS_CONFIG = {
  completed:      { label: 'Completed',     color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: FaCircleCheck },
  pending:        { label: 'Pending',       color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: FaClock },
  partial:        { label: 'Partial',       color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: FaTriangleExclamation },
  not_completed:  { label: 'Not Done',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: FaCircleXmark },
  not_applicable: { label: 'N/A',           color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: FaCircleMinus },
};

// ─── HELPERS ──────────────────────────────────────────────────────────

const LoadingSpinner = ({ label = 'Loading...' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: '#64748b' }}>
    <div style={{
      width: '32px', height: '32px', border: '3px solid #e2e8f0',
      borderTopColor: '#2563eb', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite', marginBottom: '12px',
    }} />
    <span style={{ fontSize: '13px', fontWeight: '600' }}>{label}</span>
  </div>
);

// ─── REASON / EXPLANATION MODAL ───────────────────────────────────────

const ReasonModal = ({ task, status, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_completed;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason / note for this task status.');
      return;
    }
    onConfirm(status, reason.trim(), action.trim() || null);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
      backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '24px', padding: '28px',
        width: '100%', maxWidth: '480px', border: '1px solid #e2e8f0',
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
              background: config.bg, color: config.color, border: `1px solid ${config.border}`,
            }}>
              Marking as {config.label}
            </span>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <FaXmark size={18} />
          </button>
        </div>

        <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '6px' }}>
          {task.task_templates?.title || 'SOP Task'}
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
          Please record reason and planned action for supervisor verification.
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '10px', background: '#fef2f2',
            border: '1px solid #fecaca', color: '#b91c1c', fontSize: '12px',
            marginBottom: '16px', fontWeight: '600',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
              Reason / Explanation *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Stock unavailable from main vendor / equipment issue..."
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '12px',
                background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a',
                fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical',
              }}
            />
          </div>

          {['not_completed', 'partial'].includes(status) && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Action Taken / Next Step
              </label>
              <input
                type="text"
                value={action}
                onChange={e => setAction(e.target.value)}
                placeholder="e.g. Informed manager / re-ordered emergency stock..."
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '12px',
                  background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a',
                  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: config.color, color: '#ffffff', cursor: 'pointer',
                fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              Save Reason
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── TASK CARD COMPONENT ──────────────────────────────────────────────

const TaskCard = ({ task, onStatusChange, updating }) => {
  const tmpl = task.task_templates || {};
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;

  const verifications = task.task_verifications || [];
  const latestVer = verifications[0];
  const isEscalated = latestVer?.verification_status === 'escalated' || task.escalations?.length > 0;

  return (
    <div style={{
      background: '#ffffff', borderRadius: '18px',
      border: `1px solid ${isEscalated ? '#fecaca' : '#e2e8f0'}`,
      padding: '18px 20px', position: 'relative',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      transition: 'all 0.2s ease',
    }}>
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 12, bottom: 12, width: '4px',
        borderRadius: '0 4px 4px 0', background: statusCfg.color,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>

        <div style={{ flex: 1, minWidth: '220px', paddingLeft: '8px' }}>
          {/* Tags row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {tmpl.deadline_time && (
              <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <FaClock size={11} /> By {tmpl.deadline_time}
              </span>
            )}

            {isEscalated && (
              <span style={{
                padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
                background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
              }}>
                🚨 Escalated to Owner
              </span>
            )}
            {latestVer && (
              <span style={{
                padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
                background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
              }}>
                ✓ Verified by {latestVer.verifier?.name || 'Office Staff'}
              </span>
            )}
          </div>

          {/* Title & Description */}
          <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>
            {tmpl.title || 'Untitled SOP Task'}
          </div>
          {tmpl.description && (
            <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.4 }}>
              {tmpl.description}
            </div>
          )}

          {/* Reason / Note display if status is not completed */}
          {task.reason && (
            <div style={{
              marginTop: '10px', padding: '8px 12px', borderRadius: '8px',
              background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c',
              fontSize: '11px', fontWeight: '600',
            }}>
              <strong>Reason:</strong> {task.reason}
              {task.action_required && <div><strong>Action:</strong> {task.action_required}</div>}
            </div>
          )}
        </div>

        {/* Status Dropdown Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <select
            value={task.status}
            disabled={updating}
            onChange={e => onStatusChange(task, e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: '12px',
              fontSize: '12px', fontWeight: '800',
              background: statusCfg.bg, color: statusCfg.color,
              border: `1px solid ${statusCfg.border}`,
              cursor: updating ? 'default' : 'pointer', outline: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <option value="pending">⏳ Pending</option>
            <option value="completed">✓ Completed</option>
            <option value="partial">⚠️ Partial</option>
            <option value="not_completed">✕ Not Done</option>
            <option value="not_applicable">➖ N/A</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD COMPONENT ─────────────────────────────────────────

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const userId = user?.id;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [frequency, setFrequency] = useState('daily');
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ─── LOAD TODAY'S ASSIGNED TASKS (ONLY PUSHED FROM CONTROL CENTER) ───

  const loadTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      let data = await sopService.getMyTasks({
        userId,
        date: today,
        frequency,
      });

      // Self-healing auto-sync if 0 tasks found for today
      if ((!data || data.length === 0)) {
        await sopService.syncTasksForToday(frequency).catch(() => {});
        data = await sopService.getMyTasks({
          userId,
          date: today,
          frequency,
        });
      }

      let allTasks = data || [];

      // Filter tasks strictly based on logged-in user's role
      const userRole = profile?.role || 'karigar';
      if (['karigar', 'cashier'].includes(userRole)) {
        allTasks = allTasks.filter(t => {
          const ar = t.task_templates?.assigned_role;
          return ar === 'all' || ar === userRole || (ar === 'karigar' && ['karigar','ground_staff','user'].includes(userRole));
        });
      }

      setTasks(allTasks);
    } catch (err) {
      if (!err.message?.includes('JWT issued at future')) {
        setError(err.message || 'Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, today, frequency, profile?.role]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleStatusChange = (task, newStatus) => {
    const needsReason = ['not_completed', 'partial', 'not_applicable'].includes(newStatus);
    if (needsReason) {
      setPendingStatusChange({ task, status: newStatus });
    } else {
      applyStatusChange(task.id, newStatus, null, null);
    }
  };

  const applyStatusChange = async (taskId, status, reason, action) => {
    setUpdating(taskId);
    setPendingStatusChange(null);
    try {
      await sopService.updateTaskStatus({ taskId, status, reason, actionRequired: action });
      await loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to update task');
    } finally {
      setUpdating(null);
    }
  };

  // Stats calculation
  const stats = tasks.reduce((acc, t) => {
    acc.total++;
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, { total: 0, completed: 0, pending: 0, partial: 0, not_completed: 0, not_applicable: 0 });
  const eligible = stats.total - (stats.not_applicable || 0);
  const compliance = eligible === 0 ? 100 : Math.round((stats.completed / eligible) * 100);

  const roleName = profile?.role === 'cashier' ? '💰 Cashier' : profile?.role === 'office_staff' ? '📋 Office Staff' : profile?.role === 'owner' ? '👑 Owner' : '🍳 Karigar';

  const FREQ_TABS = [
    { id: 'daily', label: 'Daily Tasks', icon: FaCalendarDays },
    { id: 'weekly', label: 'Weekly Tasks', icon: FaCalendarWeek },
    { id: 'monthly', label: 'Monthly Tasks', icon: FaCalendar },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* Reason Modal */}
      {pendingStatusChange && (
        <ReasonModal
          task={pendingStatusChange.task}
          status={pendingStatusChange.status}
          onConfirm={(status, reason, action) =>
            applyStatusChange(pendingStatusChange.task.id, status, reason, action)
          }
          onCancel={() => setPendingStatusChange(null)}
        />
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
          border: '1px solid #bfdbfe', borderRadius: '24px',
          padding: '24px 28px', marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <div style={{ color: '#2563eb', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px' }}>
              DAILY RESTAURANT SOP CHECKLIST
            </div>
            <div style={{ color: '#0f172a', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>
              Welcome back, {profile?.name || user?.email?.split('@')[0]} 👋
            </div>
            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
              {todayLabel} · Role: <strong>{roleName}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Compliance Badge */}
            <div style={{
              textAlign: 'center', padding: '10px 18px', borderRadius: '14px',
              background: compliance >= 90 ? '#ecfdf5' : compliance >= 75 ? '#fffbeb' : '#fef2f2',
              border: `1px solid ${compliance >= 90 ? '#a7f3d0' : compliance >= 75 ? '#fde68a' : '#fecaca'}`,
            }}>
              <div style={{
                fontSize: '24px', fontWeight: '900',
                color: compliance >= 90 ? '#047857' : compliance >= 75 ? '#b45309' : '#b91c1c',
                lineHeight: 1,
              }}>{compliance}%</div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: compliance >= 90 ? '#047857' : compliance >= 75 ? '#b45309' : '#b91c1c', marginTop: '2px' }}>Compliance</div>
            </div>

            {/* Refresh Checklist Button */}
            <button
              onClick={loadTasks}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '11px 18px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff', cursor: 'pointer',
                fontSize: '13px', fontWeight: '800',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              }}
            >
              <FaRotate size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
        {success && <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '13px', fontWeight: '600' }}>{success}</div>}

        {/* Stats Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '10px', marginBottom: '20px',
        }}>
          {[
            { label: 'Total Tasks', value: stats.total, color: '#475569', bg: '#ffffff', border: '#e2e8f0' },
            { label: 'Completed', value: stats.completed, color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
            { label: 'Pending', value: stats.pending, color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Partial', value: stats.partial, color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
            { label: 'Not Done', value: stats.not_completed, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '14px', borderRadius: '14px', textAlign: 'center',
              background: s.bg, border: `1px solid ${s.border}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: s.color, fontWeight: '700', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Frequency Tabs */}
        <div style={{
          display: 'flex', gap: '6px', marginBottom: '20px',
          background: '#ffffff', borderRadius: '14px', padding: '4px', border: '1px solid #e2e8f0',
        }}>
          {FREQ_TABS.map(t => {
            const FIcon = t.icon;
            const active = frequency === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFrequency(t.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: active ? '#eff6ff' : 'transparent',
                  color: active ? '#2563eb' : '#64748b',
                  cursor: 'pointer', fontSize: '13px', fontWeight: active ? '800' : '600',
                  border: active ? '1px solid #bfdbfe' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <FIcon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Task List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <LoadingSpinner label="Loading your assigned SOP checklist..." />
          </div>
        ) : tasks.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '50px 20px', borderRadius: '20px',
            background: '#ffffff', border: '1px dashed #cbd5e1',
          }}>
            <FaHourglassHalf size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <div style={{ color: '#0f172a', fontSize: '16px', fontWeight: '900', marginBottom: '4px' }}>
              No {frequency} tasks assigned for today yet
            </div>
            <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px', maxWidth: '440px', margin: '0 auto 16px' }}>
              Tasks will appear here once assigned by the Manager / Owner from the <strong>Control Center</strong>.
            </div>
            <button
              onClick={loadTasks}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                background: '#ffffff', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
              }}
            >
              <FaRotate size={12} /> Refresh Checklist
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                updating={updating === task.id}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Dashboard;
