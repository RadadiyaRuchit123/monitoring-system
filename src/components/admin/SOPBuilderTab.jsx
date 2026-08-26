import React from 'react';
import { Zap, Plus, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../LoadingState';

export const SOPBuilderTab = ({
  frequency,
  setFrequency,
  loadingSample,
  handleLoadSamples,
  setShowAddModal,
  loadingTemplates,
  safeTemplates = [],
  handleDeleteTemplate,
}) => {
  return (
    <>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#ffffff', borderRadius: '10px', padding: '3px', border: '1px solid #cbd5e1', gap: '3px' }}>
          {['daily', 'weekly', 'monthly'].map(f => (
            <button key={f} onClick={() => setFrequency(f)} style={{
              padding: '6px 14px', borderRadius: '7px', border: 'none',
              background: frequency === f ? '#eff6ff' : 'transparent',
              color: frequency === f ? '#2563eb' : '#64748b',
              cursor: 'pointer', fontSize: '12px', fontWeight: frequency === f ? '800' : '600', textTransform: 'capitalize',
            }}>{f}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={handleLoadSamples} disabled={loadingSample} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 14px', borderRadius: '10px', border: '1px solid #fde68a',
            background: '#fffbeb', color: '#b45309',
            cursor: loadingSample ? 'default' : 'pointer', fontSize: '12px', fontWeight: '800',
          }}>
            <Zap size={13} /> {loadingSample ? 'Loading...' : '⚡ Load Master SOPs'}
          </button>
          <button onClick={() => setShowAddModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 16px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '800',
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
          }}>
            <Plus size={14} /> New Template
          </button>
        </div>
      </div>

      {loadingTemplates ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <LoadingSpinner label="Loading templates..." />
        </div>
      ) : safeTemplates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>No SOP templates created yet</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Click "Load Master SOPs" to generate standard restaurant checklists</div>
          <button onClick={handleLoadSamples} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>
            ⚡ Load Master Restaurant SOPs
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {safeTemplates.map(t => (
            <div key={t.id} style={{
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>{t.title}</div>
                {t.description && <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>{t.description}</div>}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: '#64748b' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: '800', color: '#2563eb' }}>
                    Assigned: {t.assigned_role?.replace('_', ' ')}
                  </span>
                  {t.deadline_time && <><span>·</span><span>📅 Due: {t.deadline_time}</span></>}
                </div>
              </div>
              <button onClick={() => handleDeleteTemplate(t.id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
