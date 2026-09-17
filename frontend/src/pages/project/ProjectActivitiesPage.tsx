import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, MapPin, FileText, History } from 'lucide-react';

import { apiService } from '../../api/apiService';
import { ExtractedActivity, ScheduleMatch, ReportItem } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Drawer } from '../../components/ui/Drawer';

export const ProjectActivitiesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ExtractedActivity[]>([]);
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);

  const [search, setSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [activeActivity, setActiveActivity] = useState<ExtractedActivity | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [actData, matchData, repData] = await Promise.all([
          apiService.getActivities(projectId),
          apiService.getMatches(projectId),
          apiService.getReports(projectId),
        ]);
        setActivities(actData);
        setMatches(matchData);
        setReports(repData);
      } catch (err) {
        console.error('Failed to load activities', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [projectId]);

  const filtered = activities.filter((act) => {
    const term = search.toLowerCase();
    const matchesSearch =
      act.activity_description.toLowerCase().includes(term) ||
      (act.location_reference && act.location_reference.toLowerCase().includes(term));
    const matchesDiscipline = selectedDiscipline === 'all' || act.discipline === selectedDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  // Helper to find lineage of an active activity
  const matchedItem = activeActivity ? matches.find((m) => m.extracted_activity_id === activeActivity.id) : null;
  const sourceReport = activeActivity ? reports.find((r) => r.id === activeActivity.extraction_id) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Physical Activities Explorer
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Inspect all physical site work extracted from daily reports and trace their lineage to schedule links and audit logs.
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search activity description, location..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>DISCIPLINE:</span>
          {['all', 'piping', 'electrical', 'civil', 'hse'].map((d) => (
            <button
              key={d}
              type="button"
              className={`tab-pill ${selectedDiscipline === d ? 'active' : ''}`}
              onClick={() => setSelectedDiscipline(d)}
              style={{ textTransform: 'capitalize' }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Table */}
      {loading ? (
        <LoadingSkeleton rows={5} height="55px" />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Extracted Physical Activity</th>
                <th style={{ width: '140px' }}>Discipline</th>
                <th style={{ width: '180px' }}>Location / Work Area</th>
                <th style={{ width: '140px' }}>Extraction Conf</th>
                <th style={{ width: '150px' }}>Reconciliation Link</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Lineage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((act) => {
                const match = matches.find((m) => m.extracted_activity_id === act.id);
                return (
                  <tr key={act.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                        {act.activity_description}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ID: {act.id} • Date: {act.start_time?.split('T')[0] || '2026-09-12'}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          textTransform: 'capitalize',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {act.discipline}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {act.location_reference ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} style={{ color: 'var(--accent-blue)' }} /> {act.location_reference}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <span className="confidence-badge high">{(act.extraction_confidence * 100).toFixed(0)}%</span>
                    </td>
                    <td>
                      {match ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '12px' }}>
                            {match.schedule_plan?.activity_code || 'MATCH'}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: match.status === 'confirmed' || match.status === 'auto_linked' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: match.status === 'confirmed' || match.status === 'auto_linked' ? 'var(--confidence-high)' : 'var(--confidence-review)',
                            }}
                          >
                            {match.status.replace('_', ' ')}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--confidence-low)' }}>Unlinked</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setActiveActivity(act)}
                      >
                        Trace
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* End-to-End Activity Detail & Lineage Drawer */}
      <Drawer
        isOpen={!!activeActivity}
        onClose={() => setActiveActivity(null)}
        title="Activity End-to-End Traceability"
      >
        {activeActivity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Extracted Activity */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '4px' }}>
                01 • Extracted Site Activity
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {activeActivity.activity_description}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span>Discipline: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{activeActivity.discipline}</strong></span>
                <span>Confidence: <strong style={{ color: 'var(--confidence-high)' }}>{(activeActivity.extraction_confidence * 100).toFixed(0)}%</strong></span>
                {activeActivity.location_reference && <span>Location: {activeActivity.location_reference}</span>}
              </div>
            </div>

            {/* Lineage Arrow */}
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓ Derived from</div>

            {/* 2. Source Daily Report */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', marginBottom: '4px' }}>
                02 • Source Daily Report Document
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <FileText size={18} style={{ color: 'var(--accent-indigo)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {sourceReport?.file_name || 'DPR_Piping_Package3_2026-09-12.pdf'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Uploaded by: {sourceReport?.uploaded_by || 'Rajesh Sharma (Site Eng)'}
              </div>
            </div>

            {/* Lineage Arrow */}
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓ Semantically Matched with</div>

            {/* 3. Schedule WBS Match */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--confidence-high)', textTransform: 'uppercase', marginBottom: '4px' }}>
                03 • Primavera P6 Baseline Link
              </div>
              {matchedItem ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '13px' }}>
                      {matchedItem.schedule_plan?.activity_code}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {matchedItem.schedule_plan?.activity_description}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                    <span className="confidence-badge high">Similarity: {(matchedItem.confidence_score * 100).toFixed(1)}%</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status: {matchedItem.status}</span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--confidence-low)' }}>
                  No confirmed baseline schedule match yet.
                </div>
              )}
            </div>

            {/* Lineage Arrow */}
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓ Audited in</div>

            {/* 4. Audit History */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--confidence-review)', textTransform: 'uppercase', marginBottom: '4px' }}>
                04 • Immutable Audit Record
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                <History size={16} style={{ color: 'var(--accent-blue)' }} />
                <span>Logged by System AI & verified by certified planner</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
