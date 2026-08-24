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
      await sopService.syncTasksForToday(data.frequency || 'daily').catch(() => { });
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
    await sopService.syncTasksForToday('daily').catch(() => { });

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

  async getAllStaffTasks({ date = null, startDate = null, endDate = null, frequency = 'daily', branchId = null } = {}) {
    let query = supabase
      .from('assigned_tasks')
      .select(`
        *,
        staff:assigned_to (id, name, email, role, branch_id, shift, branches(id, name, location)),
        task_templates (
          id, title, description, frequency,
          assigned_role, verifier_role, requires_evidence, deadline_time, position
        ),
        task_verifications (
          id, verification_status, follow_up_note, verified_at, verified_by
        ),
        escalations (
          id, reason, is_resolved, created_at
        )
      `);

    if (startDate && endDate) {
      query = query.gte('assigned_date', startDate).lte('assigned_date', endDate);
    } else if (date) {
      query = query.eq('assigned_date', date);
    } else {
      const targetDate = new Date().toISOString().split('T')[0];
      query = query.eq('assigned_date', targetDate);
    }

    if (branchId) query = query.eq('branch_id', branchId);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    let results = (data || []).filter(at => at.staff?.role !== 'removed');
    if (frequency) {
      results = results.filter(at => at.task_templates?.frequency === frequency);
    }

    // Always fetch task_verifications directly to ensure 100% reliable verification status & verifier profile names
    const taskIds = results.map(t => t.id);
    if (taskIds.length > 0) {
      const { data: verifications } = await supabase
        .from('task_verifications')
        .select('id, assigned_task_id, verification_status, follow_up_note, verified_at, verified_by')
        .in('assigned_task_id', taskIds);

      if (verifications && verifications.length > 0) {
        const verifierIds = [...new Set(verifications.map(v => v.verified_by).filter(Boolean))];
        let verifierMap = {};
        if (verifierIds.length > 0) {
          const { data: verProfiles } = await supabase
            .from('profiles')
            .select('user_id, name, role')
            .in('user_id', verifierIds);
          verifierMap = (verProfiles || []).reduce((acc, p) => {
            acc[p.user_id] = p;
            return acc;
          }, {});
        }

        const verByTaskId = verifications.reduce((acc, v) => {
          acc[v.assigned_task_id] = {
            ...v,
            verifier: v.verified_by ? verifierMap[v.verified_by] : { name: 'Office Staff', role: 'office_staff' },
          };
          return acc;
        }, {});

        results = results.map(t => ({
          ...t,
          task_verifications: verByTaskId[t.id] ? [verByTaskId[t.id]] : (t.task_verifications || []),
        }));
      }
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

    // 1. Perform clean JS-based Task Sync (avoids 400 Bad Request console errors)
    const { data: templates } = await supabase
      .from('task_templates')
      .select('*')
      .eq('is_active', true)
      .eq('frequency', frequency);

    if (!templates || templates.length === 0) return 0;

    const { data: staff } = await supabase
      .from('profiles')
      .select('user_id, role, branch_id, shift')
      .neq('role', 'removed');

    if (!staff || staff.length === 0) return 0;

    const newTasks = [];
    for (const member of staff) {
      const uRole = member.role || 'karigar';
      const userTasks = templates.filter(t => {
        const ar = t.assigned_role;
        return ar === 'all' || ar === uRole || (ar === 'karigar' && ['karigar', 'ground_staff', 'user'].includes(uRole)) || (ar === 'cashier' && uRole === 'cashier');
      });

      for (const tmpl of userTasks) {
        newTasks.push({
          template_id: tmpl.id,
          assigned_to: member.user_id,
          branch_id: member.branch_id || tmpl.branch_id || null,
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

  async createTeamMember({ name, email, password, role = 'karigar', branch_id = null, shift = 'day' }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, branch_id, shift } },
    });

    if (error) throw error;
    const newUserId = data.user?.id;
    if (!newUserId) throw new Error('User creation failed');

    const profileRecord = {
      user_id: newUserId,
      name,
      email,
      role,
      shift: shift || 'day',
    };
    if (branch_id) profileRecord.branch_id = branch_id;

    const { data: profData, error: profErr } = await supabase
      .from('profiles')
      .upsert(profileRecord, { onConflict: 'user_id' })
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

  async exportTasksToCSV({ startDate = null, endDate = null, branchId = null } = {}) {
    const tasks = await sopService.getAllStaffTasks({ startDate, endDate, branchId, frequency: null });
    if (!tasks || tasks.length === 0) throw new Error('No task records found for selected date range.');

    const headers = [
      'Branch Name',
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
      const branchName = ['owner', 'office_staff'].includes(t.staff?.role)
        ? 'Central Office'
        : (t.staff?.branches?.name || 'Main Branch');
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
        `"${branchName.replace(/"/g, '""')}"`,
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
      // Kitchen SOPs (Karigar)
      { title: 'Kitchen Opening & Gas Check', description: 'Inspect gas pipeline, water valves, exhaust switches, and surface hygiene.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '08:30 AM', position: 1, shift: 'day' },
      { title: 'Preheat Tandoor & Fryer Oil Quality', description: 'Preheat tandoor, check fryer oil TPM level and filter clarity.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '09:00 AM', position: 2, shift: 'day' },
      { title: 'Chutney & Sauce Preparation', description: 'Prepare fresh mint-coriander chutney, tamarind chutney, and garlic paste.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '09:30 AM', position: 3, shift: 'day' },
      { title: 'Dough Kneading & Marination Prep', description: 'Knead fresh naan dough and marinate paneer/tikka batches.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '10:00 AM', position: 4, shift: 'day' },
      { title: 'Refrigeration & Deep Freezer Temp Log', description: 'Log temperatures: Chiller (2°C-5°C) and Deep Freezer (-18°C).', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '11:00 AM', position: 5, shift: 'all' },
      { title: 'Kitchen Exhaust & Hood Cleaning', description: 'Degrease exhaust hood filters and wipe stainless steel walls.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '04:00 PM', position: 6, shift: 'night' },
      { title: 'Night Kitchen Deep Clean & Gas Shutoff', description: 'Sanitize all cooking stations, turn off main gas valves and log waste.', frequency: 'daily', assigned_role: 'karigar', verifier_role: 'office_staff', deadline_time: '10:30 PM', position: 7, shift: 'night' },

      // Cashier & Counter SOPs
      { title: 'Cash Counter Opening Float Count', description: 'Count physical opening float currency notes & sign opening register.', frequency: 'daily', assigned_role: 'cashier', verifier_role: 'office_staff', deadline_time: '09:00 AM', position: 1, shift: 'day' },
      { title: 'POS Printer & EDC Machine Test', description: 'Check thermal paper roll status, run test print & verify EDC network.', frequency: 'daily', assigned_role: 'cashier', verifier_role: 'office_staff', deadline_time: '09:15 AM', position: 2, shift: 'day' },
      { title: 'Mid-Day Sales & KOT Reconciliation', description: 'Verify digital QR payments, Zomato/Swiggy order logs & cash in drawer.', frequency: 'daily', assigned_role: 'cashier', verifier_role: 'office_staff', deadline_time: '03:00 PM', position: 3, shift: 'day' },
      { title: 'Bill Counter Sanitization & Menu Check', description: 'Disinfect bill counter, wipe touchscreens & verify physical menu cards.', frequency: 'daily', assigned_role: 'cashier', verifier_role: 'office_staff', deadline_time: '05:00 PM', position: 4, shift: 'night' },
      { title: 'Night Cash Closing & Office Handover', description: 'Generate Z-Report from POS, count final cash & deposit in safe box.', frequency: 'daily', assigned_role: 'cashier', verifier_role: 'office_staff', deadline_time: '10:15 PM', position: 5, shift: 'night' },
    ];
    return await sopService.bulkCreateTemplates(samples);
  },
};
