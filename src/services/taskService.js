import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Service managing user tasks and task activity audit logs
 */
export const taskService = {
  /**
   * Retrieves tasks for a specific day ordered by position
   * @param {string} dayId
   * @param {string} userId
   */
  async getDayTasks(dayId, userId) {
    if (!isSupabaseConfigured() || !dayId || !userId) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('day_id', dayId)
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch tasks:', error.message);
      throw new Error('Unable to load tasks for this day.');
    }

    return data || [];
  },

  /**
   * Retrieves all tasks belonging to the user for global dashboard statistics
   * @param {string} userId
   */
  async getAllTasks(userId) {
    if (!isSupabaseConfigured() || !userId) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('id, day_id, completed, completed_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch global tasks:', error.message);
      return [];
    }

    return data || [];
  },

  /**
   * Toggles task completion state and records immutable activity log entry
   * @param {string} taskId
   * @param {boolean} newCompletedState
   * @param {string} userId
   */
  async toggleTask(taskId, newCompletedState, userId) {
    if (!isSupabaseConfigured() || !taskId || !userId) {
      throw new Error('Supabase configuration missing or invalid user session.');
    }

    // Try executing the atomic RPC function first
    try {
      const { data, error } = await supabase.rpc('toggle_task_status', {
        p_task_id: taskId,
        p_completed: newCompletedState,
      });

      if (!error && data) {
        return data;
      }
    } catch (rpcErr) {
      console.warn('RPC toggle_task_status unavailable, falling back to direct table update:', rpcErr);
    }

    // Fallback direct table updates if RPC function is not yet created in Supabase SQL editor
    const nowIso = new Date().toISOString();
    const completedAt = newCompletedState ? nowIso : null;

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        completed: newCompletedState,
        completed_at: completedAt,
        updated_at: nowIso,
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update task state. Please try again.');
    }

    // Insert activity log entry
    const action = newCompletedState ? 'completed' : 'uncompleted';
    await supabase.from('task_activity').insert({
      task_id: taskId,
      user_id: userId,
      action: action,
      created_at: nowIso,
    });

    return updatedTask;
  },

  /**
   * Creates a new task in a day container
   */
  async createTask({ userId, dayId, title, description = '', position = 0 }) {
    if (!isSupabaseConfigured() || !userId || !dayId) {
      throw new Error('Missing parameters for task creation');
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        day_id: dayId,
        title,
        description,
        position,
        completed: false,
        completed_at: null,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create task. Please try again.');
    }

    return data;
  },

  /**
   * Updates task details (title or description)
   */
  async updateTask(taskId, userId, { title, description }) {
    if (!isSupabaseConfigured() || !taskId || !userId) return null;

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update task details.');
    }

    return data;
  },

  /**
   * Deletes a task
   */
  async deleteTask(taskId, userId) {
    if (!isSupabaseConfigured() || !taskId || !userId) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to delete task.');
    }
  },

  /**
   * Retrieves task activity history ordered newest first
   * @param {string} taskId
   * @param {string} userId
   */
  async getTaskActivity(taskId, userId) {
    if (!isSupabaseConfigured() || !taskId || !userId) return [];

    const { data, error } = await supabase
      .from('task_activity')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load task activity:', error.message);
      return [];
    }

    return data || [];
  },
};
