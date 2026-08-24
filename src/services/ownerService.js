import { supabase } from '../lib/supabase';

// =====================================================================
// Owner Service — Performance monitoring & analytics
// Resilient queries with automatic fallback to prevent schema cache errors
// =====================================================================

export const ownerService = {

  // ─── STAFF & PROFILES ─────────────────────────────────────────────

  async getAllStaff() {
    const ROLE_RANK = { owner: 1, admin: 1, office_staff: 2, karigar: 3, ground_staff: 3, cashier: 4, user: 5 };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, branches(id, name, location)')
        .neq('role', 'removed')
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data.sort((a, b) => (ROLE_RANK[a.role] || 99) - (ROLE_RANK[b.role] || 99));
      }
    } catch (err) {
      console.warn('getAllStaff error:', err);
    }

    const { data: simple } = await supabase.from('profiles').select('*, branches(id, name, location)').neq('role', 'removed');
    return (simple || []).sort((a, b) => (ROLE_RANK[a.role] || 99) - (ROLE_RANK[b.role] || 99));
  },

  // ─── TODAY'S PERFORMANCE ──────────────────────────────────────────

  async getTodaySOPStats(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const { data: sopData, error: sopErr } = await supabase
        .from('assigned_tasks')
        .select(`
          id, status, submitted_at, completed_at, reason, action_required,
          assigned_to,
          task_templates (title, frequency, assigned_role)
        `)
        .eq('assigned_date', targetDate);

      if (!sopErr && sopData?.length > 0) {
        const userIds = [...new Set(sopData.map(t => t.assigned_to))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, name, email, role, branch_id, shift, branches(id, name, location)')
          .neq('role', 'removed')
          .in('user_id', userIds);

        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {});

        const merged = sopData
          .filter(t => profileMap[t.assigned_to])
          .map(t => ({
            ...t,
            staff: profileMap[t.assigned_to],
          }));

        return { hasSopData: true, tasks: merged };
      }
    } catch (err) {
      console.warn('getTodaySOPStats error:', err);
    }

    return { hasSopData: false, tasks: [] };
  },

  // ─── LEGACY TASK PERFORMANCE ──────────────────────────────────────

  async getLegacyTaskStats() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, completed, completed_at, title,
          user_id
        `);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  // ─── COMBINED PERFORMANCE SUMMARY ─────────────────────────────────

  async getPerformanceSummary(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const staff = await ownerService.getAllStaff();

    const { hasSopData, tasks: sopTasks } = await ownerService.getTodaySOPStats(targetDate);

    if (hasSopData && sopTasks.length > 0) {
      return ownerService._buildSopSummary(staff, sopTasks, targetDate);
    }

    const legacyTasks = await ownerService.getLegacyTaskStats();
    return ownerService._buildLegacySummary(staff, legacyTasks, targetDate);
  },

  _buildSopSummary(staff, tasks, date) {
    const groundStaff = staff.filter(s => ['karigar', 'cashier', 'ground_staff', 'user'].includes(s.role));

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const partial = tasks.filter(t => t.status === 'partial').length;
    const notCompleted = tasks.filter(t => t.status === 'not_completed').length;
    const notApplicable = tasks.filter(t => t.status === 'not_applicable').length;
    const eligible = total - notApplicable;
    const compliancePct = eligible === 0 ? 100 : Math.round((completed / eligible) * 100);

    const staffMap = {};
    for (const task of tasks) {
      const uid = task.assigned_to;
      if (!staffMap[uid]) {
        const s = task.staff || {};
        staffMap[uid] = {
          user_id: uid,
          name: s.name || 'Unknown',
          email: s.email || '',
          role: s.role || '',
          total: 0, completed: 0, pending: 0,
          partial: 0, not_completed: 0, not_applicable: 0,
          tasks: [],
        };
      }
      staffMap[uid].total++;
      staffMap[uid][task.status] = (staffMap[uid][task.status] || 0) + 1;
      staffMap[uid].tasks.push(task);
    }

    const staffStats = Object.values(staffMap).map(s => ({
      ...s,
      eligible: s.total - (s.not_applicable || 0),
      compliance_pct: s.total === 0 ? 100
        : Math.round((s.completed / Math.max(s.total - (s.not_applicable || 0), 1)) * 100),
    }));

    const exceptions = tasks.filter(t => ['not_completed', 'partial', 'pending'].includes(t.status));

    return {
      dataSource: 'sop',
      date,
      overall: { total, completed, pending, partial, notCompleted, notApplicable, compliancePct },
      staffStats: staffStats.sort((a, b) => a.compliance_pct - b.compliance_pct),
      exceptions,
      totalStaff: groundStaff.length,
      activeStaff: staffStats.length,
    };
  },

  _buildLegacySummary(staff, tasks, date) {
    const groundStaff = staff.filter(s => ['karigar', 'cashier', 'ground_staff', 'user'].includes(s.role));

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const compliancePct = total === 0 ? 100 : Math.round((completed / total) * 100);

    const staffMap = {};
    for (const task of tasks) {
      const uid = task.user_id;
      const s = staff.find(st => st.user_id === uid) || {};
      if (!staffMap[uid]) {
        staffMap[uid] = {
          user_id: uid,
          name: s.name || 'Unknown',
          email: s.email || '',
          role: s.role || '',
          total: 0, completed: 0, pending: 0,
          partial: 0, not_completed: 0, not_applicable: 0,
          tasks: [],
        };
      }
      staffMap[uid].total++;
      if (task.completed) staffMap[uid].completed++;
      else staffMap[uid].not_completed++;
      staffMap[uid].tasks.push(task);
    }

    const staffStats = Object.values(staffMap).map(s => ({
      ...s,
      eligible: s.total,
      compliance_pct: s.total === 0 ? 100 : Math.round((s.completed / s.total) * 100),
    }));

    return {
      dataSource: 'legacy',
      date,
      overall: { total, completed, pending, partial: 0, notCompleted: pending, notApplicable: 0, compliancePct },
      staffStats: staffStats.sort((a, b) => a.compliance_pct - b.compliance_pct),
      exceptions: [],
      totalStaff: groundStaff.length,
      activeStaff: staffStats.length,
    };
  },

  // ─── ESCALATIONS ──────────────────────────────────────────────────

  async getOpenEscalations() {
    try {
      const { data: escs, error } = await supabase
        .from('escalations')
        .select(`
          *,
          assigned_task:assigned_task_id (
            id, status, reason, assigned_date, assigned_to,
            task_templates (title, deadline_time)
          )
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error || !escs) return [];

      const userIds = [...new Set([
        ...escs.map(e => e.escalated_by),
        ...escs.map(e => e.assigned_task?.assigned_to).filter(Boolean),
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, name, email, role')
        .in('user_id', userIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {});

      return escs.map(e => ({
        ...e,
        escalated_by_user: profileMap[e.escalated_by] || { name: 'Staff' },
        assigned_task: e.assigned_task ? {
          ...e.assigned_task,
          staff: profileMap[e.assigned_task.assigned_to] || { name: 'Staff' },
        } : null,
      }));
    } catch {
      return [];
    }
  },

  // ─── WEEKLY TREND ─────────────────────────────────────────────────

  async getWeeklyTrend() {
    const results = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });

      try {
        const { data } = await supabase
          .rpc('get_branch_compliance', { p_branch_id: null, p_date: dateStr });
        const row = data?.[0] || {};
        results.push({
          date: dateStr,
          label: dayLabel,
          total: Number(row.total_tasks || 0),
          completed: Number(row.completed_tasks || 0),
          compliance_pct: Number(row.compliance_pct || 0),
        });
      } catch {
        results.push({ date: dateStr, label: dayLabel, total: 0, completed: 0, compliance_pct: 0 });
      }
    }
    return results;
  },

  // ─── RECENT ACTIVITY ──────────────────────────────────────────────

  async getRecentActivity(limit = 20) {
    try {
      const { data: sopActivity, error: sopErr } = await supabase
        .from('assigned_tasks')
        .select(`
          id, status, submitted_at, reason, assigned_to,
          task_templates (title)
        `)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (!sopErr && sopActivity?.length) {
        const userIds = [...new Set(sopActivity.map(t => t.assigned_to))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, role')
          .in('user_id', userIds);

        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {});

        return sopActivity.map(t => ({
          id: t.id,
          type: 'sop',
          staff_name: profileMap[t.assigned_to]?.name || 'Unknown',
          staff_role: profileMap[t.assigned_to]?.role || '',
          task_title: t.task_templates?.title || 'Task',
          status: t.status,
          reason: t.reason,
          time: t.submitted_at,
        }));
      }
    } catch (err) {
      console.warn('getRecentActivity error:', err);
    }

    return [];
  },
};
