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
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '48px 20px', gap: '14px',
  }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      border: '3px solid rgba(99,102,241,0.15)',
      borderTopColor: '#6366f1',
      animation: 'spin 0.7s linear infinite',
    }} />
    <span style={{
      fontSize: '13px', fontWeight: '600', color: '#94a3b8',
      animation: 'pulse-soft 1.5s ease-in-out infinite',
    }}>{label}</span>
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
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '24px', padding: '28px',
        width: '100%', maxWidth: '480px', border: '1px solid #e2e8f0',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{
            padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
            background: config.bg, color: config.color, border: `1px solid ${config.border}`,
          }}>
            Marking as {config.label}
          </span>
          <button onClick={onCancel} style={{
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
            padding: '4px', borderRadius: '8px', transition: 'color 0.15s',
          }}>
            <FaXmark size={18} />
          </button>
        </div>

        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '17px', marginBottom: '4px' }}>
          {task.task_templates?.title || 'SOP Task'}
        </div>
        <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
          Please record reason and planned action for supervisor verification.
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '12px', background: '#fef2f2',
            border: '1px solid #fecaca', color: '#b91c1c', fontSize: '12px',
            marginBottom: '16px', fontWeight: '600',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '800',
              color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
            }}>
              Reason / Explanation *
            </label>
            <textarea
              required rows={3} value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Stock unavailable from main vendor / equipment issue..."
              style={{
                width: '100%', padding: '11px 14px', borderRadius: '12px',
                background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
                fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {['not_completed', 'partial'].includes(status) && (
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '800',
                color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
              }}>
                Action Taken / Next Step
              </label>
              <input
                type="text" value={action} onChange={e => setAction(e.target.value)}
                placeholder="e.g. Informed manager / re-ordered emergency stock..."
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '12px',
                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
                  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onCancel}
              style={{
                padding: '10px 18px', borderRadius: '12px', border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                transition: 'all 0.15s',
              }}
            >
              Cancel
            </button>
            <button type="submit"
              style={{
                padding: '10px 22px', borderRadius: '12px', border: 'none',
                background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
                color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                boxShadow: `0 4px 14px ${config.color}30`, transition: 'all 0.15s',
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

const TaskCard = ({ task, onStatusChange, updating, index = 0 }) => {
  const tmpl = task.task_templates || {};
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const verifications = task.task_verifications || [];
  const latestVer = verifications[0];
  const isEscalated = latestVer?.verification_status === 'escalated' || task.escalations?.length > 0;

  return (
    <div style={{
      background: '#ffffff', borderRadius: '18px',
      border: `1px solid ${isEscalated ? '#fecaca' : '#e2e8f0'}`,
      padding: '18px 20px 18px 28px', position: 'relative',
      boxShadow: isEscalated ? '0 4px 16px rgba(220,38,38,0.06)' : '0 2px 8px rgba(0,0,0,0.03)',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: `fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 50}ms both`,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isEscalated ? '0 4px 16px rgba(220,38,38,0.06)' : '0 2px 8px rgba(0,0,0,0.03)'; }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: '14px', bottom: '14px', width: '4px',
        borderRadius: '0 4px 4px 0', background: `linear-gradient(180deg, ${statusCfg.color}, ${statusCfg.color}88)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>

        <div style={{ flex: 1, minWidth: '200px' }}>
          {/* Tags row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {tmpl.deadline_time && (
              <span style={{
                fontSize: '11px', color: '#b45309', fontWeight: '700',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '6px', background: '#fffbeb',
              }}>
                <FaClock size={10} /> By {tmpl.deadline_time}
              </span>
            )}

            {isEscalated && (
              <span style={{
                padding: '3px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800',
                background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
                animation: 'pulse-soft 2s ease-in-out infinite',
              }}>
                🚨 Escalated
              </span>
            )}
            {latestVer && (
              <span style={{
                padding: '3px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800',
                background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
              }}>
                ✓ Verified by {latestVer.verifier?.name || 'Office Staff'}
              </span>
            )}
          </div>

          {/* Title & Description */}
          <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '15px', marginBottom: '4px', letterSpacing: '-0.2px' }}>
            {tmpl.title || 'Untitled SOP Task'}
          </div>
          {tmpl.description && (
            <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
              {tmpl.description}
            </div>
          )}

          {/* Reason display */}
          {task.reason && (
            <div style={{
              marginTop: '10px', padding: '10px 14px', borderRadius: '10px',
              background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c',
              fontSize: '12px', fontWeight: '600', lineHeight: 1.4,
            }}>
              <strong>Reason:</strong> {task.reason}
              {task.action_required && <div style={{ marginTop: '4px' }}><strong>Action:</strong> {task.action_required}</div>}
            </div>
          )}
        </div>

        {/* Status Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '3px 8px', borderRadius: '8px',
            background: statusCfg.bg, color: statusCfg.color,
          }}>
            <StatusIcon size={12} />
          </div>
          <select
            value={task.status}
            disabled={updating}
            onChange={e => onStatusChange(task, e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: '12px',
              fontSize: '12px', fontWeight: '800',
              background: statusCfg.bg, color: statusCfg.color,
              border: `1px solid ${statusCfg.border}`,
              cursor: updating ? 'default' : 'pointer', outline: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.15s',
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

// ─── COMPLIANCE RING ──────────────────────────────────────────────────

const ComplianceRing = ({ pct = 0, size = 90 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (pct / 100) * circum;
  const color = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#dc2626';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: '9px', fontWeight: '700', color, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {pct >= 90 ? 'Excellent' : pct >= 75 ? 'Good' : 'Low'}
        </span>
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
  const [statusFilter, setStatusFilter] = useState('all');
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

  const filteredTasks = tasks.filter(t => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return t.status === 'pending';
    if (statusFilter === 'completed') return t.status === 'completed';
    if (statusFilter === 'issues') return ['partial', 'not_completed'].includes(t.status);
    return true;
  });

  const roleName = profile?.role === 'cashier' ? '💰 Cashier' : profile?.role === 'office_staff' ? '📋 Office Staff' : profile?.role === 'owner' ? '👑 Owner' : profile?.role === 'karigar' ? '🍳 Karigar' : (profile?.role || 'Staff');

  const FREQ_TABS = [
    { id: 'daily', label: 'Daily', icon: FaCalendarDays },
    { id: 'weekly', label: 'Weekly', icon: FaCalendarWeek },
    { id: 'monthly', label: 'Monthly', icon: FaCalendar },
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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* ═══ Welcome Banner ═══ */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #eef2ff 50%, #e0e7ff 100%)',
          border: '1px solid #c7d2fe', borderRadius: '24px',
          padding: '24px 28px', marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(99,102,241,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px',
          animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div>
            <div style={{
              color: '#4f46e5', fontSize: '11px', fontWeight: '800',
              letterSpacing: '1.2px', marginBottom: '6px', textTransform: 'uppercase',
            }}>
              Daily Restaurant SOP Checklist
            </div>
            <div style={{
              color: '#0f172a', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '900',
              letterSpacing: '-0.5px', lineHeight: 1.2,
            }}>
              Welcome back, {profile?.name || user?.email?.split('@')[0]} 👋
            </div>
            <div style={{
              color: '#64748b', fontSize: '13px', marginTop: '6px',
              display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
            }}>
              <span>{todayLabel}</span>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span>Role: <strong>{roleName}</strong></span>
              {profile?.role !== 'owner' && (
                <>
                  <span style={{ color: '#cbd5e1' }}>·</span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px',
                    background: profile?.shift === 'night' ? '#f5f3ff' : profile?.shift === 'day' ? '#fffbeb' : '#eef2ff',
                    color: profile?.shift === 'night' ? '#6d28d9' : profile?.shift === 'day' ? '#b45309' : '#4f46e5',
                    border: `1px solid ${profile?.shift === 'night' ? '#ddd6fe' : profile?.shift === 'day' ? '#fde68a' : '#c7d2fe'}`,
                    fontSize: '11px', fontWeight: '800',
                  }}>
                    {profile?.shift === 'night' ? '🌙 Night' : profile?.shift === 'day' ? '☀️ Day' : '🔄 All'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <ComplianceRing pct={compliance} />
            <button onClick={loadTasks}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '11px 18px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '800',
                boxShadow: '0 4px 16px rgba(79,70,229,0.25)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FaRotate size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '12px', marginBottom: '16px',
            background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
            fontSize: '13px', fontWeight: '600', animation: 'fadeInDown 0.3s ease-out',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            padding: '12px 16px', borderRadius: '12px', marginBottom: '16px',
            background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857',
            fontSize: '13px', fontWeight: '600', animation: 'fadeInDown 0.3s ease-out',
          }}>{success}</div>
        )}

        {/* ═══ Stats Row ═══ */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '10px', marginBottom: '20px',
        }}>
          {[
            { label: 'Total', value: stats.total, color: '#475569', bg: '#ffffff', border: '#e2e8f0' },
            { label: 'Completed', value: stats.completed, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
            { label: 'Pending', value: stats.pending, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Partial', value: stats.partial, color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
            { label: 'Not Done', value: stats.not_completed, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '16px', borderRadius: '16px', textAlign: 'center',
              background: s.bg, border: `1px solid ${s.border}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              animation: `fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 60}ms both`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)'; }}
            >
              <div style={{ fontSize: '26px', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: s.color, fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ═══ Frequency Tabs ═══ */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '20px',
          background: '#ffffff', borderRadius: '14px', padding: '4px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          {FREQ_TABS.map(t => {
            const FIcon = t.icon;
            const active = frequency === t.id;
            return (
              <button
                key={t.id} onClick={() => setFrequency(t.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: active ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)' : 'transparent',
                  color: active ? '#4f46e5' : '#64748b',
                  cursor: 'pointer', fontSize: '13px', fontWeight: active ? '800' : '600',
                  boxShadow: active ? '0 2px 8px rgba(99,102,241,0.08)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <FIcon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ═══ Status Filter Pills ═══ */}
        {!loading && tasks.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: `All (${stats.total})` },
              { id: 'pending', label: `⏳ Pending (${stats.pending || 0})` },
              { id: 'completed', label: `✅ Done (${stats.completed || 0})` },
              { id: 'issues', label: `⚠️ Issues (${(stats.partial || 0) + (stats.not_completed || 0)})` },
            ].map(f => (
              <button
                key={f.id} onClick={() => setStatusFilter(f.id)}
                style={{
                  padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  border: statusFilter === f.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid #e2e8f0',
                  background: statusFilter === f.id ? '#eef2ff' : '#ffffff',
                  color: statusFilter === f.id ? '#4f46e5' : '#475569',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  boxShadow: statusFilter === f.id ? '0 2px 8px rgba(99,102,241,0.12)' : 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* ═══ Task List ═══ */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <LoadingSpinner label="Loading your assigned SOP checklist..." />
          </div>
        ) : tasks.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '50px 20px', borderRadius: '24px',
            background: '#ffffff', border: '1px dashed #cbd5e1',
            animation: 'fadeInUp 0.4s ease-out',
          }}>
            <FaHourglassHalf size={40} color="#94a3b8" style={{ marginBottom: '14px' }} />
            <div style={{ color: '#0f172a', fontSize: '17px', fontWeight: '900', marginBottom: '6px' }}>
              No {frequency} tasks assigned for today yet
            </div>
            <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '18px', maxWidth: '440px', margin: '0 auto 18px', lineHeight: 1.5 }}>
              Tasks will appear here once assigned by the Manager / Owner from the <strong>Control Center</strong>.
            </div>
            <button onClick={loadTasks}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: '12px', border: '1px solid #e2e8f0',
                background: '#ffffff', color: '#475569', cursor: 'pointer',
                fontSize: '13px', fontWeight: '700', transition: 'all 0.15s',
              }}
            >
              <FaRotate size={12} /> Refresh Checklist
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '30px 20px', background: '#ffffff',
            borderRadius: '16px', color: '#64748b', fontSize: '13px', border: '1px solid #e2e8f0',
          }}>
            No tasks found under "{statusFilter}" filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                updating={updating === task.id}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};

export default Dashboard;
