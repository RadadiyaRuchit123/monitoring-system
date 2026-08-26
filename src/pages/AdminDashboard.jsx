import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Crown, Send, FileSpreadsheet, FileText, RefreshCw, Trash,
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { ownerService } from '../services/ownerService';
import { sopService } from '../services/sopService';
import { exportService } from '../services/exportService';

import { ComplianceRing } from '../components/admin/AdminStatCards';
import { ExportRangeModal, AddMemberModal, AddTemplateModal } from '../components/admin/AdminModals';
import { ControlDashboardTab } from '../components/admin/ControlDashboardTab';
import { SOPBuilderTab } from '../components/admin/SOPBuilderTab';
import { TeamHierarchyTab } from '../components/admin/TeamHierarchyTab';

export const AdminDashboard = () => {
  const { isOwner, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data state
  const [summary, setSummary] = useState({ overall: {}, staffStats: [], exceptions: [] });
  const [escalations, setEscalations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [frequency, setFrequency] = useState('daily');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [exportModalMode, setExportModalMode] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ─── LOAD DATA ───────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await sopService.syncTasksForToday('daily').catch(() => {});
      const sum = await ownerService.getPerformanceSummary().catch(() => null);
      const escs = await ownerService.getOpenEscalations().catch(() => []);
      const staff = await ownerService.getAllStaff().catch(() => []);
      const bList = await sopService.getBranches().catch(() => []);

      setSummary(sum || { overall: {}, staffStats: [], exceptions: [] });
      setEscalations(Array.isArray(escs) ? escs : []);
      setStaffList(Array.isArray(staff) ? staff : []);
      setBranchesList(Array.isArray(bList) ? bList : []);
    } catch (err) {
      console.warn('loadDashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = await sopService.getTemplates({ frequency }).catch(() => []);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, [frequency]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (activeTab === 'sop') loadTemplates(); }, [activeTab, loadTemplates]);

  // ─── ACTIONS ─────────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      const count = await sopService.syncTasksForToday(frequency);
      setSuccess(`✅ ${count} SOP tasks pushed & assigned to staff checklist for today!`);
      await loadDashboard();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError(err.message || 'Failed to push tasks'); }
    finally { setSyncing(false); }
  };

  const handleAddTemplate = async (form) => {
    await sopService.createTemplate(form);
    setSuccess('SOP Template created!');
    await loadTemplates();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return;
    await sopService.deleteTemplate(id);
    setSuccess('Deleted!');
    await loadTemplates();
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleLoadSamples = async () => {
    if (!confirm('Load standard restaurant SOP templates?')) return;
    setLoadingSample(true);
    try {
      const loaded = await sopService.loadSampleSOPTemplates();
      setSuccess(`✅ ${loaded.length} SOP templates loaded! Click "Push Tasks" to assign them to staff.`);
      await loadTemplates();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError(err.message); }
    finally { setLoadingSample(false); }
  };

  const handleExportCSV = () => { setExportModalMode('csv'); };
  const handleExportPDF = () => { setExportModalMode('pdf'); };

  const handleRangeExport = async ({ mode, startDate, endDate, branchId }) => {
    setError('');
    try {
      if (mode === 'csv') {
        const res = await sopService.exportTasksToCSV({ startDate, endDate, branchId });
        setSuccess(`📥 Exported ${res.count} tasks (${startDate} to ${endDate}) to CSV file! Check your downloads.`);
      } else {
        const tasks = await sopService.getAllStaffTasks({ startDate, endDate, branchId, frequency: null });
        exportService.exportPDFReport({
          startDate, endDate, summary, staffList, tasks, escalations, branchesList,
        });
        setSuccess(`📄 Visual PDF Audit Report generated for ${startDate} to ${endDate}!`);
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Export failed');
    }
  };

  const handleClearTodayTasks = async () => {
    if (!confirm('⚠️ Are you sure you want to clear today\'s assigned tasks?')) return;
    setClearing(true);
    setError('');
    try {
      const res = await sopService.clearTodayTasks();
      setSuccess(`🗑️ Cleared ${res.count} tasks from today's checklist.`);
      await loadDashboard();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Clear failed');
    } finally {
      setClearing(false);
    }
  };

  const handleUpdateStaff = async (userId, updates) => {
    try {
      if (updates?.role === 'removed') {
        const staff = staffList.find(s => s.user_id === userId || s.id === userId);
        await handleDeleteStaff(staff?.id, userId, staff?.name || 'Staff Member');
        return;
      }
      await sopService.updateStaffProfile(userId, updates);
      const fresh = await ownerService.getAllStaff().catch(() => []);
      setStaffList(Array.isArray(fresh) ? fresh.filter(s => s.role !== 'removed') : []);
      setSuccess('Staff role updated!');
      await loadDashboard();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message || 'Failed to update staff role');
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      const newProfile = await sopService.createTeamMember(memberData);
      const fresh = await ownerService.getAllStaff().catch(() => []);
      setStaffList(Array.isArray(fresh) ? fresh.filter(s => s.role !== 'removed') : []);
      setSuccess(`✅ Created team member: ${newProfile.name}`);
      await loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create member');
    }
  };

  const handleDeleteStaff = async (profileId, userId, name) => {
    if (!confirm(`⚠️ Are you sure you want to remove ${name} from team?`)) return;
    try {
      setStaffList(prev => prev.filter(s => s.id !== profileId && s.user_id !== userId));
      setSummary(prev => ({
        ...prev,
        staffStats: (prev.staffStats || []).filter(s => s.id !== profileId && s.user_id !== userId),
      }));

      await sopService.deleteStaffProfile(profileId, userId);
      const fresh = await ownerService.getAllStaff().catch(() => []);
      setStaffList(Array.isArray(fresh) ? fresh.filter(s => s.role !== 'removed') : []);
      setSuccess(`🗑️ Removed ${name} from team.`);
      await loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete staff member');
    }
  };

  const handlePromoteToOwner = async () => {
    try {
      await ownerService.promoteToOwner();
      setSuccess('👑 Account promoted to Owner!');
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to promote account');
    }
  };

  // ─── COMPUTED DATA ───────────────────────────────────────────────

  const overall = summary?.overall || {};
  const compliancePct = overall.compliance_pct !== undefined ? overall.compliance_pct : 0;
  const safeStaffList = useMemo(() => (Array.isArray(staffList) ? staffList : []), [staffList]);
  const safeTemplates = useMemo(() => (Array.isArray(templates) ? templates : []), [templates]);
  const safeEscalations = useMemo(() => (Array.isArray(escalations) ? escalations : []), [escalations]);

  const groundStaffStats = useMemo(() => (summary?.staffStats || []).filter(s =>
    ['karigar', 'cashier', 'ground_staff', 'user'].includes(s.role)
  ), [summary]);

  const criticalStaff = useMemo(() => groundStaffStats.filter(s => s.compliance_pct < 75), [groundStaffStats]);

  const filteredStaffList = useMemo(() => safeStaffList.filter(s => {
    const matchesBranch = selectedBranchFilter === 'all' || s.branch_name === selectedBranchFilter || (branchesList.find(b => b.id === s.branch_id)?.name === selectedBranchFilter);
    const matchesRole = selectedRoleFilter === 'all' || s.role === selectedRoleFilter || (selectedRoleFilter === 'karigar' && ['karigar', 'ground_staff', 'user'].includes(s.role));
    return matchesBranch && matchesRole;
  }), [safeStaffList, selectedBranchFilter, selectedRoleFilter, branchesList]);

  const TABS = [
    { id: 'dashboard', label: '📊 Control Dashboard', desc: 'Real-time performance' },
    { id: 'sop', label: '📋 SOP Builder', desc: 'Templates & tasks' },
    { id: 'team', label: '👥 Team Hierarchy', desc: 'Roles & team members' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {showAddModal && <AddTemplateModal onSave={handleAddTemplate} onClose={() => setShowAddModal(false)} />}
      {showAddMemberModal && <AddMemberModal branchesList={branchesList} onSave={handleAddMember} onClose={() => setShowAddMemberModal(false)} />}
      {exportModalMode && (
        <ExportRangeModal
          mode={exportModalMode}
          branchesList={branchesList}
          onExport={handleRangeExport}
          onClose={() => setExportModalMode(null)}
        />
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>

        {/* PROMOTIONAL OWNER ALERT */}
        {profile?.role !== 'owner' && (
          <div style={{
            padding: '14px 20px', borderRadius: '16px', marginBottom: '20px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '16px', boxShadow: '0 4px 12px rgba(217,119,6,0.1)', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Crown size={20} color="#d97706" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#92400e' }}>
                  Your account is currently set to "{profile?.role || 'karigar'}".
                </div>
                <div style={{ fontSize: '11px', color: '#b45309' }}>
                  Click promote to set your account as Owner & access full Control Center rights.
                </div>
              </div>
            </div>
            <button
              onClick={handlePromoteToOwner}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                color: '#ffffff', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(217,119,6,0.25)', whiteSpace: 'nowrap',
              }}
            >
              👑 Promote Me to Owner
            </button>
          </div>
        )}

        {/* ══════════════════ HEADER BANNER ══════════════════ */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          borderRadius: '24px', padding: '18px 20px', marginBottom: '20px',
          border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ minWidth: '220px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: '20px', background: isOwner ? '#fef3c7' : '#f5f3ff', border: `1px solid ${isOwner ? '#fde68a' : '#ddd6fe'}`, color: isOwner ? '#b45309' : '#6d28d9', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Crown size={12} color={isOwner ? "#d97706" : "#7c3aed"} /> {isOwner ? 'OWNER CONTROL CENTER' : 'OFFICE CONTROL CENTER'}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>• {today}</span>
              </div>
              <div style={{ color: '#0f172a', fontSize: 'clamp(20px, 4.5vw, 26px)', fontWeight: '900', letterSpacing: '-0.5px' }}>
                Restaurant SOP Control Center
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                Manage SOP checklists, staff roles & push daily tasks to team
              </div>
            </div>

            {/* Right: Ring + Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
              {summary && <ComplianceRing pct={compliancePct} size={84} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button onClick={handleSync} disabled={syncing} style={{
                    flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '9px 12px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff', cursor: syncing ? 'default' : 'pointer', fontSize: '12px', fontWeight: '800',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)', whiteSpace: 'nowrap',
                  }}>
                    <Send size={12} />
                    {syncing ? 'Pushing...' : 'Push Tasks'}
                  </button>
                  <button onClick={handleExportCSV} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '9px 12px', borderRadius: '10px', border: '1px solid #a7f3d0',
                    background: '#ecfdf5', color: '#047857', cursor: 'pointer', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap',
                  }}>
                    <FileSpreadsheet size={12} /> Export CSV
                  </button>
                  <button onClick={handleExportPDF} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '9px 12px', borderRadius: '10px', border: '1px solid #ddd6fe',
                    background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap',
                  }}>
                    <FileText size={12} /> Export PDF
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button onClick={loadDashboard} style={{
                    flex: 1, minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1',
                    background: '#ffffff', color: '#475569', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
                  }}>
                    <RefreshCw size={11} /> Refresh
                  </button>
                  <button onClick={handleClearTodayTasks} disabled={clearing} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '8px 12px', borderRadius: '10px', border: '1px solid #fecaca',
                    background: '#fef2f2', color: '#b91c1c', cursor: clearing ? 'default' : 'pointer', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap',
                  }}>
                    <Trash size={11} /> {clearing ? 'Clearing...' : 'Clear Tasks'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
        {success && <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '13px', fontWeight: '600' }}>{success}</div>}

        {/* ══════════════════ NAVIGATION TABS ══════════════════ */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px',
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 14px', borderRadius: '16px', border: `2px solid ${active ? '#2563eb' : '#e2e8f0'}`,
                  background: active ? '#eff6ff' : '#ffffff', color: active ? '#2563eb' : '#475569',
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: active ? '0 4px 14px rgba(37,99,235,0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: '900', color: active ? '#2563eb' : '#0f172a' }}>{tab.label}</div>
                <div style={{ fontSize: '11px', color: active ? '#3b82f6' : '#64748b', marginTop: '2px', fontWeight: '500' }}>{tab.desc}</div>
              </button>
            );
          })}
        </div>

        {/* ══════════════════ TAB CONTENT ══════════════════ */}
        {activeTab === 'dashboard' && (
          <ControlDashboardTab
            loading={loading}
            overall={overall}
            compliancePct={compliancePct}
            safeEscalations={safeEscalations}
            groundStaffStats={groundStaffStats}
            safeStaffList={safeStaffList}
            criticalStaff={criticalStaff}
            summary={summary}
            branchesList={branchesList}
            handleUpdateStaff={handleUpdateStaff}
            handleDeleteStaff={handleDeleteStaff}
          />
        )}

        {activeTab === 'sop' && (
          <SOPBuilderTab
            frequency={frequency}
            setFrequency={setFrequency}
            loadingSample={loadingSample}
            handleLoadSamples={handleLoadSamples}
            setShowAddModal={setShowAddModal}
            loadingTemplates={loadingTemplates}
            safeTemplates={safeTemplates}
            handleDeleteTemplate={handleDeleteTemplate}
          />
        )}

        {activeTab === 'team' && (
          <TeamHierarchyTab
            safeStaffList={safeStaffList}
            setShowAddMemberModal={setShowAddMemberModal}
            selectedBranchFilter={selectedBranchFilter}
            setSelectedBranchFilter={setSelectedBranchFilter}
            branchesList={branchesList}
            selectedRoleFilter={selectedRoleFilter}
            setSelectedRoleFilter={setSelectedRoleFilter}
            filteredStaffList={filteredStaffList}
            handleUpdateStaff={handleUpdateStaff}
            handleDeleteStaff={handleDeleteStaff}
          />
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
