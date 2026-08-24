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

  /**
   * Generates a visually stunning, lightweight PDF Audit Report
   */
  exportPDFReport({ startDate = null, endDate = null, summary = {}, staffList = [], tasks = [], escalations = [], branchesList = [] }) {
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const dateRangeLabel = startDate && endDate
      ? `${startDate} to ${endDate}`
      : `${getTodayDateString()}`;

    const overall = summary?.overall || {};
    const compliancePct = overall.compliancePct || 0;

    const groundStaffStats = (summary?.staffStats || []).filter(s =>
      ['karigar', 'cashier', 'ground_staff', 'user'].includes(s.role)
    );

    const printWin = window.open('', '_blank');
    if (!printWin) {
      throw new Error('Please allow popups to generate PDF report.');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Restaurant SOP Audit Report - ${dateRangeLabel}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
          body { font-family: 'Inter', sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 24px; font-size: 12px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .kpi-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #f8fafc; }
          .kpi-title { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
          .kpi-value { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px; }
          .section-title { font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
          th { background: #f1f5f9; color: #334155; text-align: left; padding: 7px 9px; font-weight: 800; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
          td { padding: 7px 9px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 10px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 13px;">
            🖨️ Click Here to Print / Save PDF
          </button>
        </div>

        <div class="header">
          <div>
            <h1 class="title">RESTAURANT SOP AUDIT REPORT</h1>
            <div class="subtitle">Period: <strong>${dateRangeLabel}</strong> • Operational SOP Compliance • 16 Branches</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; font-size: 11px; color: #2563eb;">GENERATED: ${today}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">TIME: ${nowTime}</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">TOTAL SOPS LOGGED</div>
            <div class="kpi-value" style="color: #2563eb;">${tasks.length || overall.total || 0}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">COMPLETED SOPS</div>
            <div class="kpi-value" style="color: #059669;">${tasks.filter(t => t.status === 'completed').length || overall.completed || 0}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">PENDING / DELAYED</div>
            <div class="kpi-value" style="color: #d97706;">${tasks.filter(t => ['pending', 'partial'].includes(t.status)).length || ((overall.pending || 0) + (overall.partial || 0))}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">OPEN ESCALATIONS</div>
            <div class="kpi-value" style="color: #dc2626;">${escalations.length}</div>
          </div>
        </div>

        ${tasks.length > 0 ? `
          <div class="section-title">
            <span>📋 DETAILED SOP TASK AUDIT RECORDS (${tasks.length} Records)</span>
            <span style="font-size: 10px; color: #64748b;">Filtered Date Range</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Assigned Date</th>
                <th>Task Title</th>
                <th>Staff Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Submitted / Completed</th>
                <th>Verified By</th>
                <th>Reason / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.filter(t => t.staff?.role !== 'removed').map((t, i) => {
                const statusColor = t.status === 'completed' ? '#059669' : t.status === 'pending' ? '#d97706' : '#dc2626';
                const compTime = t.completed_at || t.submitted_at
                  ? new Date(t.completed_at || t.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : '-';
                const ver = t.task_verifications?.[0];
                const verifiedText = ver
                  ? `👤 ${ver.verifier?.name || 'Office Staff'} (${ver.verification_status?.toUpperCase() || 'VERIFIED'})`
                  : 'Pending Audit';
                return `
                  <tr>
                    <td>#${i + 1}</td>
                    <td>${t.assigned_date || '-'}</td>
                    <td><strong>${t.task_templates?.title || 'SOP Task'}</strong></td>
                    <td>${t.staff?.name || 'Staff Member'}</td>
                    <td style="text-transform: capitalize;">${t.staff?.role || 'karigar'}</td>
                    <td><strong style="color: ${statusColor}; text-transform: uppercase;">${t.status || 'PENDING'}</strong></td>
                    <td>${compTime}</td>
                    <td><span style="color: ${ver ? '#6d28d9' : '#94a3b8'}; font-weight: 700;">${verifiedText}</span></td>
                    <td style="color: #64748b;">${t.reason || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        ${groundStaffStats.length > 0 && tasks.length === 0 ? `
          <div class="section-title">
            <span>👥 GROUND STAFF PERFORMANCE SUMMARY</span>
            <span style="font-size: 10px; color: #64748b;">${groundStaffStats.length} Active Staff Members</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Staff Name</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Shift</th>
                <th>Completed / Total</th>
                <th>Compliance %</th>
              </tr>
            </thead>
            <tbody>
              ${groundStaffStats.map((s, i) => {
                const branchObj = branchesList.find(b => b.id === s.branch_id);
                const branchName = branchObj ? branchObj.name : (s.branch_name || s.branch || 'Default Branch');
                const shiftLabel = s.shift === 'night' ? '🌙 Night Shift' : s.shift === 'day' ? '☀️ Day Shift' : '🔄 Both Shifts';
                const cColor = s.compliance_pct >= 90 ? '#059669' : s.compliance_pct >= 75 ? '#d97706' : '#dc2626';
                return `
                  <tr>
                    <td>#${i + 1}</td>
                    <td><strong>${s.name || 'Staff Member'}</strong></td>
                    <td style="text-transform: capitalize;">${s.role || 'karigar'}</td>
                    <td>📍 ${branchName}</td>
                    <td>${shiftLabel}</td>
                    <td>${s.completed || 0} / ${s.total || 0}</td>
                    <td><strong style="color: ${cColor};">${s.compliance_pct || 0}%</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        ${escalations.length > 0 ? `
          <div class="section-title">
            <span>🚨 OPEN ESCALATIONS & OPERATIONAL ISSUES</span>
            <span style="font-size: 10px; color: #dc2626;">${escalations.length} Critical Issues</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Task Title</th>
                <th>Staff Member</th>
                <th>Reason / Issue</th>
                <th>Logged At</th>
              </tr>
            </thead>
            <tbody>
              ${escalations.map((esc, i) => `
                <tr>
                  <td>#${i + 1}</td>
                  <td><strong>${esc.assigned_task?.task_templates?.title || 'SOP Task'}</strong></td>
                  <td>${esc.assigned_task?.staff?.name || 'Ground Staff'}</td>
                  <td style="color: #b91c1c;">${esc.reason || 'Delayed / Issue logged'}</td>
                  <td>${new Date(esc.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          Generated automatically by Restaurant SOP & Compliance System • Confidential Audit Document
        </div>

        <script>
          setTimeout(() => {
            window.print();
          }, 400);
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  },
};
