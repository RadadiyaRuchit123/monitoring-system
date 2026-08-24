import { supabase } from '../lib/supabase';

// =====================================================================
// SOP Service — Task Templates + Assigned Tasks management
// Accountability chain: Do → Record → Verify → Follow Up → Escalate
// =====================================================================

export const sopService = {

  // ─── BRANCHES ─────────────────────────────────────────────────────

  async getBranches() {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createBranch(branchData) {
    const { data, error } = await supabase
      .from('branches')
      .insert([branchData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ─── TASK TEMPLATES (SOP DEFINITIONS) ─────────────────────────────

  async getTemplates({ frequency = 'daily', branchId = null, isActive = true } = {}) {
    let query = supabase
      .from('task_templates')
      .select('*')
      .order('position', { ascending: true });

    if (frequency) query = query.eq('frequency', frequency);
    if (branchId) query = query.eq('branch_id', branchId);
    if (isActive !== null) query = query.eq('is_active', isActive);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createTemplate(templateData) {
    const { data: { user } } = await supabase.auth.getUser();
    const { department, ...cleanData } = templateData;
    const { data, error } = await supabase
      .from('task_templates')
      .insert([{ ...cleanData, created_by: user?.id }])
      .select()
      .single();
    if (error) throw error;

    // Immediately assign this new template to staff for today
    if (data?.id) {
      await sopService.syncTasksForToday(data.frequency || 'daily').catch(() => {});
    }

    return data;
  },

  async updateTemplate(id, updates) {
    const { department, ...cleanUpdates } = updates;
    const { data, error } = await supabase
      .from('task_templates')
      .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTemplate(id) {
    // Delete assigned tasks for this template first
    await supabase.from('assigned_tasks').delete().eq('template_id', id);
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async bulkCreateTemplates(templates) {
    const { data: { user } } = await supabase.auth.getUser();
    const withCreator = templates.map(t => {
      const { department, ...clean } = t;
      return { ...clean, created_by: user?.id };
    });
    const { data, error } = await supabase
      .from('task_templates')
      .insert(withCreator)
      .select();
    if (error) throw error;

    // Auto-sync after bulk create
    await sopService.syncTasksForToday('daily').catch(() => {});

    return data;
  },

  // ─── ASSIGNED TASKS (DAILY/WEEKLY/MONTHLY INSTANCES) ─────────────

  async getMyTasks({ userId, date = null, frequency = 'daily' } = {}) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Query assigned_tasks with template join
    const { data: tasks, error } = await supabase
      .from('assigned_tasks')
      .select(`
        *,
        task_templates (
          id, title, description, frequency,
          assigned_role, verifier_role, requires_evidence, deadline_time, position
        ),
        task_verifications (
          id, verification_status, follow_up_note, verified_at,
          verifier:verified_by (name, role)
        )
      `)
      .eq('assigned_to', userId)
      .eq('assigned_date', targetDate);

    if (error) throw error;

    let results = tasks || [];
    if (frequency) {
      results = results.filter(t => t.task_templates?.frequency === frequency);
    }
    return results;
  },

  async getAllStaffTasks({ date = null, frequency = 'daily', branchId = null } = {}) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    let query = supabase
      .from('assigned_tasks')
      .select(`
        *,
        staff:assigned_to (name, email, role),
        task_templates (
          id, title, description, frequency,
          assigned_role, verifier_role, requires_evidence, deadline_time, position
        ),
        task_verifications (
          id, verification_status, follow_up_note, verified_at,
          verifier:verified_by (name, role)
        ),
        escalations (
          id, reason, is_resolved, created_at
        )
      `)
      .eq('assigned_date', targetDate);

    if (branchId) query = query.eq('branch_id', branchId);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    let results = data || [];
    if (frequency) {
      results = results.filter(at => at.task_templates?.frequency === frequency);
    }
    return results;
  },

  async updateTaskStatus({ taskId, status, reason = null, actionRequired = null, evidenceUrl = null }) {
    const now = new Date().toISOString();
    const updates = {
      status,
      reason: ['not_completed', 'partial', 'not_applicable'].includes(status) ? reason : null,
      action_required: ['not_completed', 'partial'].includes(status) ? actionRequired : null,
      evidence_url: evidenceUrl,
      submitted_at: now,
      completed_at: status === 'completed' ? now : null,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('assigned_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ─── TASK SYNC (PUSH TASKS FROM CONTROL CENTER) ─────────────────────

  async syncTasksForToday(frequency = 'daily') {
    const today = new Date().toISOString().split('T')[0];

    // 1. Try SQL RPC first
    try {
      const { data, error } = await supabase
        .rpc('sync_sop_tasks_for_today', { p_frequency: frequency });
      if (!error && typeof data === 'number' && data > 0) {
        return data;
      }
    } catch (err) {
      console.warn('RPC sync failed, falling back to JS sync:', err);
    }

    // 2. Fallback JS Sync: Fetch active templates & staff profiles
    const { data: templates } = await supabase
      .from('task_templates')
      .select('*')
      .eq('is_active', true)
      .eq('frequency', frequency);

    if (!templates || templates.length === 0) return 0;

    const { data: staff } = await supabase
      .from('profiles')
      .select('user_id, role');

    if (!staff || staff.length === 0) return 0;

    const newTasks = [];
    for (const member of staff) {
      const uRole = member.role || 'karigar';
      const userTasks = templates.filter(t => {
        const ar = t.assigned_role;
        return ar === 'all' || ar === uRole || (ar === 'karigar' && ['karigar','ground_staff','user'].includes(uRole)) || (ar === 'cashier' && uRole === 'cashier');
      });

      for (const tmpl of userTasks) {
        newTasks.push({
          template_id: tmpl.id,
          assigned_to: member.user_id,
          assigned_date: today,
          status: 'pending',
        });
      }
    }

    if (newTasks.length === 0) return 0;

    // Fetch existing assigned tasks for today to avoid duplicates
    const { data: existingAssigned } = await supabase
      .from('assigned_tasks')
      .select('template_id, assigned_to')
      .eq('assigned_date', today);

    const existingSet = new Set((existingAssigned || []).map(e => `${e.template_id}_${e.assigned_to}`));

    const filteredNewTasks = newTasks.filter(t => !existingSet.has(`${t.template_id}_${t.assigned_to}`));

    if (filteredNewTasks.length === 0) return 0;

    const { data: inserted, error: insertErr } = await supabase
      .from('assigned_tasks')
      .insert(filteredNewTasks)
      .select();

    if (insertErr) {
      console.error('JS Task Sync insert error:', insertErr);
      throw insertErr;
    }

    return inserted?.length || filteredNewTasks.length;
  },

  // ─── COMPLIANCE STATS ─────────────────────────────────────────────

  async getStaffComplianceSummary({ date = null, branchId = null } = {}) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    let query = supabase
      .from('assigned_tasks')
      .select(`
        assigned_to,
        status,
        staff:assigned_to (name, email, role)
      `)
      .eq('assigned_date', targetDate);

    if (branchId) query = query.eq('branch_id', branchId);

    const { data, error } = await query;
    if (error) throw error;

    const byStaff = {};
    for (const row of (data || [])) {
      const uid = row.assigned_to;
      if (!byStaff[uid]) {
        byStaff[uid] = {
          user_id: uid,
          name: row.staff?.name || 'Unknown',
          email: row.staff?.email || '',
          role: row.staff?.role || '',
          total: 0, completed: 0, pending: 0,
          partial: 0, not_completed: 0, not_applicable: 0,
        };
      }
      byStaff[uid].total++;
      if (row.status === 'completed') byStaff[uid].completed++;
      else if (row.status === 'pending') byStaff[uid].pending++;
      else if (row.status === 'partial') byStaff[uid].partial++;
      else if (row.status === 'not_completed') byStaff[uid].not_completed++;
      else if (row.status === 'not_applicable') byStaff[uid].not_applicable++;
    }

    return Object.values(byStaff).map(s => ({
      ...s,
      compliance_pct: s.total === 0 ? 100
        : Math.round((s.completed / Math.max(s.total - s.not_applicable, 1)) * 100),
    }));
  },

  // ─── TEAM MANAGEMENT ─────────────────────────────────────────────

  async updateStaffProfile(userId, updates) {
    const { department, ...cleanUpdates } = updates;
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createTeamMember({ name, email, password, role = 'karigar' }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (error) throw error;
    const newUserId = data.user?.id;
    if (!newUserId) throw new Error('User creation failed');

    const { data: profData, error: profErr } = await supabase
      .from('profiles')
      .upsert({
        user_id: newUserId,
        name,
        email,
        role,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (profErr) throw profErr;
    return profData;
  },

  async deleteStaffProfile(profileId, userId) {
    // 1. Delete all assigned tasks for this user
    if (userId) {
      await supabase.from('assigned_tasks').delete().eq('assigned_to', userId);
    }

    // 2. Mark profile role as 'removed' to permanently block login and remove from team hierarchy
    if (userId) {
      await supabase
        .from('profiles')
        .update({ role: 'removed', updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }
    if (profileId) {
      await supabase
        .from('profiles')
        .update({ role: 'removed', updated_at: new Date().toISOString() })
        .eq('id', profileId);
    }

    return true;
  },

  async clearTodayTasks() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('assigned_tasks')
      .delete()
      .eq('assigned_date', today)
      .select();

    if (error) throw error;
    return { count: data?.length || 0 };
  },

  async exportTasksToCSV() {
    const tasks = await sopService.getAllStaffTasks();
    if (!tasks || tasks.length === 0) throw new Error('No task records to export.');

    const headers = [
      'Task Title',
      'Assigned To',
      'Role',
      'Status',
      'Completion Time',
      'Submitted At',
      'Deadline',
      'Verified By',
      'Reason',
      'Action Taken'
    ];

    const rows = tasks.map(t => {
      const completionTime = t.completed_at
        ? new Date(t.completed_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })
        : (t.status === 'completed' && t.submitted_at
            ? new Date(t.submitted_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })
            : 'Not Completed Yet');

      const submittedAt = t.submitted_at
        ? new Date(t.submitted_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })
        : 'N/A';

      const ver = t.task_verifications?.[0];
      const verifiedBy = ver
        ? `${ver.verifier?.name || 'Office Staff'} (${ver.verification_status.toUpperCase()})`
        : 'Pending Verification';

      return [
        `"${(t.task_templates?.title || 'SOP Task').replace(/"/g, '""')}"`,
        `"${(t.staff?.name || 'Staff Member').replace(/"/g, '""')}"`,
        `"${(t.staff?.role || 'karigar').replace(/"/g, '""')}"`,
        `"${t.status.toUpperCase()}"`,
        `"${completionTime}"`,
        `"${submittedAt}"`,
        `"${t.task_templates?.deadline_time || 'N/A'}"`,
        `"${verifiedBy.replace(/"/g, '""')}"`,
        `"${(t.reason || '').replace(/"/g, '""')}"`,
        `"${(t.action_required || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Restaurant_SOP_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { count: tasks.length };
  },

  // ─── SAMPLE RESTAURANT SOPs ──────────────────────────────────────

  async loadSampleSOPTemplates() {
    const samples = [
      { title: 'Kitchen Opening Check', description: 'Inspect equipment, gas, water, power. Clean surfaces.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '08:30 AM', position: 1 },
      { title: 'Preheat Tandoor & Fryers', description: 'Preheat tandoor, check fryer oil quality.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '09:00 AM', position: 2 },
      { title: 'Chutney & Sauce Preparation', description: 'Prepare green chutney, tamarind chutney, raita.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '09:30 AM', position: 3 },
      { title: 'Papaya & Dough Prep', description: 'Prepare papaya marination and knead dough.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '09:30 AM', position: 4 },
      { title: 'Cash Counter Float Count', description: 'Count opening cash float. Sign float register.', frequency: 'daily', assigned_role: 'cashier', verifier_role: 'office_staff', deadline_time: '09:00 AM', position: 1 },
      { title: 'Test POS & Card Machine', description: 'Test POS printer & card swipe machine.', frequency: 'daily', assigned_role: 'cashier', verifier_role: 'office_staff', deadline_time: '09:15 AM', position: 2 },
      { title: 'Daily Sales Entry', description: 'Match KOT bills with POS totals.', frequency: 'daily', assigned_role: 'cashier', verifier_role: 'office_staff', deadline_time: '03:00 PM', position: 3 },
      { title: 'Cash Closing & Handover', description: 'Count closing cash. Handover to Office Staff.', frequency: 'daily', assigned_role: 'cashier', verifier_role: 'office_staff', deadline_time: '10:00 PM', position: 4 },
    ];
    return await sopService.bulkCreateTemplates(samples);
  },
};
