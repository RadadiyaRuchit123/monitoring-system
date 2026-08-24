import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateCSVString, downloadCSVFile } from '../utils/csv';
import { formatCSVDateTime, getTodayDateString } from '../utils/date';

/**
 * Service for generating secure, RLS-backed CSV & Excel Exports with Multi-Branch & Role Support
 */
export const exportService = {
  /**
   * Helper to format human-readable Role display name
   */
  formatRoleLabel(role) {
    if (!role) return 'Staff';
    const r = role.toLowerCase();
    if (r === 'owner') return 'Owner';
    if (r === 'office_staff') return 'Office Staff';
    if (r === 'cashier') return 'Cashier';
    if (r === 'karigar') return 'Karigar (Chef)';
    return role;
  },

  /**
   * Exports full checklist & task status data for a user to CSV (includes Branch & Role)
   * @param {{ id: string, user_id?: string, name: string, email: string, role?: string, branches?: { name: string } }} userProfile
   */
  async exportChecklistCSV(userProfile) {
    if (!isSupabaseConfigured()) {
      throw new Error('User authentication required for CSV export.');
    }

    const userId = userProfile.user_id || userProfile.id;
    if (!userId) throw new Error('Invalid user ID');

    const branchName = userProfile?.branches?.name || userProfile?.branch_name || userProfile?.branch || 'Main Branch';
    const roleLabel = this.formatRoleLabel(userProfile?.role);

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
      'Branch Name',
      'Role',
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
          branchName,
          roleLabel,
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
            branchName,
            roleLabel,
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
    const filename = `checklist-export-${branchName.toLowerCase().replace(/\s+/g, '-')}-${getTodayDateString()}.csv`;
    downloadCSVFile(csvContent, filename);
  },

  /**
   * Exports complete audit history activity log to CSV (includes Branch & Role)
   * @param {{ id: string, user_id?: string, name: string, email: string, role?: string, branches?: { name: string } }} userProfile
   */
  async exportActivityCSV(userProfile) {
    if (!isSupabaseConfigured()) {
      throw new Error('User authentication required for activity CSV export.');
    }

    const userId = userProfile.user_id || userProfile.id;
    if (!userId) throw new Error('Invalid user ID');

    const branchName = userProfile?.branches?.name || userProfile?.branch_name || userProfile?.branch || 'Main Branch';
    const roleLabel = this.formatRoleLabel(userProfile?.role);

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
      'Branch Name',
      'Role',
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
        branchName,
        roleLabel,
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
    const filename = `activity-export-${branchName.toLowerCase().replace(/\s+/g, '-')}-${getTodayDateString()}.csv`;
    downloadCSVFile(csvContent, filename);
  },

  /**
   * Consolidated Owner/Admin CSV Export across all 17 Branches and Cashiers/Karigars
   */
  async exportAllBranchesSOPReport(sopTasks) {
    const headers = [
      'Branch Name',
      'Staff Name',
      'Staff Role',
      'Task Title',
      'Status',
      'Assigned Date',
      'Completed At',
      'Reason / Note',
      'Action Required',
    ];

    const rows = (sopTasks || []).map((item) => [
      item.branch_name || item.staff?.branch || 'Main Branch',
      item.staff?.name || 'Staff Member',
      this.formatRoleLabel(item.staff?.role),
      item.task_templates?.title || item.title || 'SOP Task',
      item.status?.toUpperCase() || 'PENDING',
      item.assigned_date || getTodayDateString(),
      formatCSVDateTime(item.completed_at || item.submitted_at),
      item.reason || '',
      item.action_required || '',
    ]);

    const csvContent = generateCSVString(headers, rows);
    const filename = `all-branches-sop-report-${getTodayDateString()}.csv`;
    downloadCSVFile(csvContent, filename);
  },
};
