import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Service handling Restaurant Admin/Manager operations, Department SOP Templates, and Staff Management
 */
export const adminService = {
  /**
   * Retrieves Master Days filtered optional by department
   */
  async getMasterDays(department = null) {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from('master_days').select('*').order('day_number', { ascending: true });
    if (department && department !== 'all') {
      query = query.or(`department.eq.${department},department.eq.all,department.eq.kitchen`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch master days:', error.message);
      return [];
    }

    return data || [];
  },

  /**
   * Creates a new Master Day template
   */
  async createMasterDay({ day_number, title, description = '', department = 'kitchen' }) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('master_days')
      .insert({ day_number, title, description, department })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create master day');
    }

    return data;
  },

  /**
   * Deletes a Master Day template
   */
  async deleteMasterDay(masterDayId) {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('master_days')
      .delete()
      .eq('id', masterDayId);

    if (error) {
      throw new Error('Failed to delete master day');
    }
  },

  /**
   * Retrieves Master Tasks for a specific Master Day
   */
  async getMasterTasks(masterDayId) {
    if (!isSupabaseConfigured() || !masterDayId) return [];

    const { data, error } = await supabase
      .from('master_tasks')
      .select('*')
      .eq('master_day_id', masterDayId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Failed to fetch master tasks:', error.message);
      return [];
    }

    return data || [];
  },

  /**
   * Creates a Master Task in a Master Day
   */
  async createMasterTask({ masterDayId, title, description = '', department = 'kitchen', position = 0 }) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('master_tasks')
      .insert({
        master_day_id: masterDayId,
        title,
        description,
        department,
        position,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create master task');
    }

    return data;
  },

  /**
   * Deletes a Master Task
   */
  async deleteMasterTask(masterTaskId) {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('master_tasks')
      .delete()
      .eq('id', masterTaskId);

    if (error) {
      throw new Error('Failed to delete master task');
    }
  },

  /**
   * Invokes RPC to push/sync Master SOP Days & Tasks to all ground staff
   */
  async syncMasterTasksToAllUsers() {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    const { data, error } = await supabase.rpc('sync_master_tasks_to_all_users');

    if (error) {
      throw new Error('Failed to sync master tasks to staff members. Make sure schema functions are updated.');
    }

    return data;
  },

  /**
   * Retrieves list of all registered staff profiles along with their tasks statistics
   */
  async getAllUsersProfiles() {
    if (!isSupabaseConfigured()) return [];

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch staff list:', error.message);
      return [];
    }

    // Fetch task completion counts per user for admin audit tracker
    const { data: tasks } = await supabase
      .from('tasks')
      .select('user_id, completed, completed_at');

    const userStats = {};
    (tasks || []).forEach((t) => {
      if (!userStats[t.user_id]) {
        userStats[t.user_id] = { total: 0, completed: 0, lastCompletedAt: null };
      }
      userStats[t.user_id].total += 1;
      if (t.completed) {
        userStats[t.user_id].completed += 1;
        if (t.completed_at) {
          if (!userStats[t.user_id].lastCompletedAt || new Date(t.completed_at) > new Date(userStats[t.user_id].lastCompletedAt)) {
            userStats[t.user_id].lastCompletedAt = t.completed_at;
          }
        }
      }
    });

    return (profiles || []).map((p) => ({
      ...p,
      stats: userStats[p.user_id] || { total: 0, completed: 0, lastCompletedAt: null },
    }));
  },

  /**
   * Retrieves full detailed task list and timestamp activity log for a specific staff member
   */
  async getStaffTaskLogs(staffUserId) {
    if (!isSupabaseConfigured() || !staffUserId) return { days: [], activities: [] };

    const { data: days } = await supabase
      .from('days')
      .select(`
        id,
        day_number,
        title,
        tasks (
          id,
          title,
          description,
          completed,
          completed_at,
          created_at
        )
      `)
      .eq('user_id', staffUserId)
      .order('day_number', { ascending: true });

    const { data: activities } = await supabase
      .from('task_activity')
      .select(`
        id,
        action,
        created_at,
        tasks (
          title,
          days (
            day_number,
            title
          )
        )
      `)
      .eq('user_id', staffUserId)
      .order('created_at', { ascending: false });

    return {
      days: days || [],
      activities: activities || [],
    };
  },

  /**
   * Updates user role ('owner', 'office_staff', 'ground_staff') and department ('kitchen', 'cashier', 'inventory', 'hygiene')
   */
  async setUserDepartmentAndRole(userId, role, department) {
    if (!isSupabaseConfigured()) return;

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, department, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update user role/department');
    }

    return data;
  },
};
