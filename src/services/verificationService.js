import { supabase } from '../lib/supabase';

// =====================================================================
// Verification Service — Office Staff Audit, Verification & Escalations
// Safe queries with automatic fallback to prevent schema cache errors
// =====================================================================

export const verificationService = {

  // ─── PENDING VERIFICATIONS ─────────────────────────────────────────

  async getPendingVerifications({ date = null, branchId = null } = {}) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const { data: sopTasks, error: sopErr } = await supabase
        .from('assigned_tasks')
        .select(`
          id, status, submitted_at, completed_at, reason, action_required,
          assigned_to,
          staff:profiles!assigned_to (id, user_id, name, email, role),
          task_templates (
            id, title, description, frequency,
            assigned_role, verifier_role, requires_evidence, deadline_time
          ),
          task_verifications (
            id, verification_status, follow_up_note, verified_at,
            verifier:verified_by (name, role)
          ),
          escalations (
            id, reason, is_resolved
          )
        `)
        .eq('assigned_date', targetDate)
        .in('status', ['completed', 'partial', 'not_completed']);

      if (!sopErr && sopTasks) {
        return sopTasks.filter(t => {
          if (t.staff?.role === 'removed') return false;
          const ver = t.task_verifications?.[0];
          return !ver || ver.verification_status === 'follow_up';
        });
      }
    } catch (err) {
      console.warn('PostgREST join failed in getPendingVerifications, using fallback:', err);
    }

    // Fallback: manual query & profile merge
    const { data: tasks, error: taskErr } = await supabase
      .from('assigned_tasks')
      .select(`
        id, status, submitted_at, completed_at, reason, action_required,
        assigned_to,
        task_templates (
          id, title, description, frequency,
          assigned_role, verifier_role, requires_evidence, deadline_time
        ),
        task_verifications (
          id, verification_status, follow_up_note, verified_at
        ),
        escalations (
          id, reason, is_resolved
        )
      `)
      .eq('assigned_date', targetDate)
      .in('status', ['completed', 'partial', 'not_completed']);

    if (taskErr || !tasks) return [];

    const userIds = [...new Set(tasks.map(t => t.assigned_to))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, name, email, role')
      .in('user_id', userIds);

    const profileMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {});

    const merged = tasks
      .filter(t => profileMap[t.assigned_to] && profileMap[t.assigned_to].role !== 'removed')
      .map(t => ({
        ...t,
        staff: profileMap[t.assigned_to],
      }));

    return merged.filter(t => {
      if (t.staff?.role === 'removed') return false;
      const ver = t.task_verifications?.[0];
      return !ver || ver.verification_status === 'follow_up';
    });
  },

  // ─── VERIFIED TASKS HISTORY ────────────────────────────────────────

  async getVerifiedTasks({ date = null } = {}) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data: tasks, error } = await supabase
      .from('assigned_tasks')
      .select(`
        id, status, submitted_at, completed_at, reason, action_required,
        assigned_to,
        staff:profiles!assigned_to (id, user_id, name, email, role),
        task_templates (
          id, title, description, frequency
        ),
        task_verifications!inner (
          id, verification_status, follow_up_note, verified_at, verified_by
        )
      `)
      .eq('assigned_date', targetDate);

    if (error || !tasks) return [];
    const validTasks = tasks.filter(t => t.staff?.role !== 'removed');

    // Collect all verifier user_ids to resolve their profile names accurately
    const verifierIds = [...new Set(validTasks.map(t => t.task_verifications?.[0]?.verified_by).filter(Boolean))];
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

    return validTasks.map(t => {
      const ver = t.task_verifications?.[0];
      const verifierProfile = ver?.verified_by ? verifierMap[ver.verified_by] : null;
      return {
        ...t,
        task_verifications: ver ? [{
          ...ver,
          verifier: verifierProfile || { name: 'Office Staff', role: 'office_staff' },
        }] : [],
      };
    });
  },

  // ─── VERIFY A TASK ─────────────────────────────────────────────────

  async verifyTask({ assignedTaskId, verificationStatus, followUpNote = null, verifiedBy }) {
    const now = new Date().toISOString();

    // 1. Check if verification record already exists
    const { data: existingVer } = await supabase
      .from('task_verifications')
      .select('id')
      .eq('assigned_task_id', assignedTaskId)
      .maybeSingle();

    let verRecord;
    if (existingVer?.id) {
      const { data, error } = await supabase
        .from('task_verifications')
        .update({
          verified_by: verifiedBy,
          verification_status: verificationStatus,
          follow_up_note: followUpNote,
          verified_at: now,
        })
        .eq('id', existingVer.id)
        .select()
        .single();
      if (error) throw error;
      verRecord = data;
    } else {
      const { data, error } = await supabase
        .from('task_verifications')
        .insert([{
          assigned_task_id: assignedTaskId,
          verified_by: verifiedBy,
          verification_status: verificationStatus,
          follow_up_note: followUpNote,
          verified_at: now,
        }])
        .select()
        .single();
      if (error) throw error;
      verRecord = data;
    }

    // 2. Handle Escalation if status is escalated
    if (verificationStatus === 'escalated') {
      const { data: existingEsc } = await supabase
        .from('escalations')
        .select('id')
        .eq('assigned_task_id', assignedTaskId)
        .maybeSingle();

      if (existingEsc?.id) {
        await supabase
          .from('escalations')
          .update({
            escalated_by: verifiedBy,
            reason: followUpNote || 'Task verification escalated to owner',
            is_resolved: false,
            created_at: now,
          })
          .eq('id', existingEsc.id);
      } else {
        await supabase
          .from('escalations')
          .insert([{
            assigned_task_id: assignedTaskId,
            escalated_by: verifiedBy,
            reason: followUpNote || 'Task verification escalated to owner',
            is_resolved: false,
            created_at: now,
          }]);
      }
    }

    return verRecord;
  },

  // ─── UNRESOLVED ESCALATIONS ───────────────────────────────────────

  async getUnresolvedEscalations({ branchId = null } = {}) {
    try {
      const { data, error } = await supabase
        .from('escalations')
        .select(`
          id, reason, created_at, is_resolved,
          assigned_task:assigned_task_id (
            id, status, reason, action_required, assigned_date, assigned_to,
            staff:profiles!assigned_to (name, email, role),
            task_templates (title, deadline_time)
          )
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('PostgREST escalation join note:', err);
    }

    // Fallback manual query
    const { data: escs, error: escErr } = await supabase
      .from('escalations')
      .select(`
        id, reason, created_at, is_resolved, assigned_task_id
      `)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (escErr || !escs?.length) return [];

    const taskIds = escs.map(e => e.assigned_task_id);
    const { data: tasks } = await supabase
      .from('assigned_tasks')
      .select(`
        id, status, reason, action_required, assigned_date, assigned_to,
        task_templates (title, deadline_time)
      `)
      .in('id', taskIds);

    const taskMap = (tasks || []).reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {});

    const userIds = [...new Set((tasks || []).map(t => t.assigned_to))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, name, email, role')
      .in('user_id', userIds);

    const profileMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {});

    return escs
      .filter(e => {
        const task = taskMap[e.assigned_task_id];
        return task && profileMap[task.assigned_to] && profileMap[task.assigned_to].role !== 'removed';
      })
      .map(e => {
        const task = taskMap[e.assigned_task_id] || {};
        return {
          ...e,
          assigned_task: {
            ...task,
            staff: profileMap[task.assigned_to],
          },
        };
      });
  },

  async resolveEscalation(escalationId) {
    const { data, error } = await supabase
      .from('escalations')
      .update({ is_resolved: true })
      .eq('id', escalationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
