import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateCSVString, downloadCSVFile } from '../utils/csv';
import { formatCSVDateTime, getTodayDateString } from '../utils/date';

/**
 * Service for generating secure, RLS-backed CSV Exports
 */
export const exportService = {
  /**
   * Exports full checklist & task status data for the authenticated user to CSV
   * @param {{ id: string, user_id?: string, name: string, email: string }} userProfile
   */
  async exportChecklistCSV(userProfile) {
    if (!isSupabaseConfigured()) {
      throw new Error('User authentication required for CSV export.');
    }

    const userId = userProfile.user_id || userProfile.id;
    if (!userId) throw new Error('Invalid user ID');

    // 1. Fetch User's Days and Tasks with RLS security
    const { data: days, error: daysError } = await supabase
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
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('day_number', { ascending: true });

    if (daysError) {
      throw new Error('Failed to retrieve checklist data for export.');
    }

    const headers = [
      'User Name',
      'User Email',
      'Day Number',
      'Day Title',
      'Task ID',
      'Task Title',
      'Task Description',
      'Status',
      'Completed At',
      'Created At',
      'Updated At',
    ];

    const rows = [];

    (days || []).forEach((day) => {
      const tasks = day.tasks || [];
      if (tasks.length === 0) {
        rows.push([
          userProfile.name || '',
          userProfile.email || '',
          `Day ${day.day_number}`,
          day.title || '',
          '',
          '',
          '',
          'No Tasks',
          '',
          '',
          '',
        ]);
      } else {
        tasks.forEach((task) => {
          rows.push([
            userProfile.name || '',
            userProfile.email || '',
            `Day ${day.day_number}`,
            day.title || '',
            task.id,
            task.title || '',
            task.description || '',
            task.completed ? 'Completed' : 'Pending',
            formatCSVDateTime(task.completed_at),
            formatCSVDateTime(task.created_at),
            formatCSVDateTime(task.updated_at),
          ]);
        });
      }
    });

    const csvContent = generateCSVString(headers, rows);
    const filename = `checklist-export-${getTodayDateString()}.csv`;
    downloadCSVFile(csvContent, filename);
  },

  /**
   * Exports complete audit history activity log for the authenticated user to CSV
   * @param {{ id: string, user_id?: string, name: string, email: string }} userProfile
   */
  async exportActivityCSV(userProfile) {
    if (!isSupabaseConfigured()) {
      throw new Error('User authentication required for activity CSV export.');
    }

    const userId = userProfile.user_id || userProfile.id;
    if (!userId) throw new Error('Invalid user ID');

    // 1. Fetch user's task activities joined with tasks and days
    const { data: activities, error: actError } = await supabase
      .from('task_activity')
      .select(`
        id,
        action,
        created_at,
        tasks (
          id,
          title,
          days (
            day_number,
            title
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (actError) {
      throw new Error('Failed to retrieve activity log data for export.');
    }

    const headers = [
      'User Name',
      'User Email',
      'Day Number',
      'Day Title',
      'Task ID',
      'Task Title',
      'Action',
      'Timestamp',
    ];

    const rows = (activities || []).map((act) => {
      const task = act.tasks || {};
      const day = task.days || {};
      const actionDisplay = act.action === 'completed' ? 'Completed' : 'Uncompleted';

      return [
        userProfile.name || '',
        userProfile.email || '',
        day.day_number ? `Day ${day.day_number}` : '',
        day.title || '',
        task.id || '',
        task.title || '',
        actionDisplay,
        formatCSVDateTime(act.created_at),
      ];
    });

    const csvContent = generateCSVString(headers, rows);
    const filename = `activity-export-${getTodayDateString()}.csv`;
    downloadCSVFile(csvContent, filename);
  },
};
