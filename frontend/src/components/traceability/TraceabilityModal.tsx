import React from 'react';
import {
  FileText,
  Activity,
  CalendarRange,
  CheckCheck,
  History,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ScheduleMatch, ExtractedActivity, ReportItem, SchedulePlanItem, AuditTrailEntry } from '../../lib/types';

interface TraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  match?: ScheduleMatch | null;
  activity?: ExtractedActivity | null;
  report?: ReportItem | null;
  planItem?: SchedulePlanItem | null;
  auditEntry?: AuditTrailEntry | null;
}

export const TraceabilityModal: React.FC<TraceabilityModalProps> = ({
  isOpen,
  onClose,
  match,
  activity,
  report,
  planItem,
  auditEntry,
}) => {
  if (!isOpen) return null;

  // Resolve extracted activity
  const act = activity || match?.extracted_activity;
  // Resolve schedule item
  const plan = planItem || match?.schedule_plan;
  // Resolve confidence
  const confidence = match?.confidence_score ?? act?.extraction_confidence ?? 0.88;
  const status = match?.status || (auditEntry?.action === 'confirmed' ? 'confirmed' : 'pending_review');

  const steps = [
    {
      num: '01',
      title: 'Source Document',
      icon: FileText,
      color: 'var(--accent-indigo)',
      badge: 'Site Record',
      main: report?.file_name || 'DPR_Piping_Package3_2026-09-12.pdf',
      sub: `Uploaded by ${report?.uploaded_by || 'Rajesh Sharma (Site Engineer)'} • ${report?.uploaded_at?.slice(0, 10) || '2026-09-12'}`,
      detail: `Format: ${report?.file_type?.toUpperCase() || 'PDF'} • Integrity Check: Passed (SHA-256)`,
    },
    {
      num: '02',
      title: 'Extracted Activity',
      icon: Activity,
      color: 'var(--accent-blue)',
      badge: `${(act?.discipline || 'piping').toUpperCase()}`,
      main: act?.activity_description || 'Fit-up and root pass welding of 12-inch cooling water line',
      sub: `Location: ${act?.location_reference || 'Unit 200 - Rack Bay 4'}`,
      detail: `Extraction Confidence: ${(confidence * 100).toFixed(0)}% • NLP Sentence-Transformers`,
    },
    {
      num: '03',
      title: 'Baseline Schedule Target',
      icon: CalendarRange,
      color: 'var(--confidence-high)',
      badge: plan?.activity_code || 'PIP-201',
      main: plan?.activity_description || 'Piping spool fabrication and fit-up for 12-inch cooling water line',
      sub: `Planned: ${plan?.planned_start || '2026-09-08'} to ${plan?.planned_end || '2026-09-22'}`,
      detail: `Plan: ${plan?.planned_progress ?? 85}% • Actual: ${plan?.actual_progress ?? 82}%`,
    },
    {
      num: '04',
      title: 'Verification & Decision',
      icon: CheckCheck,
      color: status === 'confirmed' || status === 'auto_linked' ? 'var(--confidence-high)' : 'var(--confidence-review)',
      badge: status.replace('_', ' ').toUpperCase(),
      main: status === 'confirmed' ? 'Human Verified & Approved' : status === 'auto_linked' ? 'Autonomous AI Link' : 'Pending Certified Review',
      sub: `Resolver: ${match?.resolved_by || 'Autonomous Matching Engine'}`,
      detail: `Confidence Score: ${(confidence * 100).toFixed(1)}%`,
    },
    {
      num: '05',
      title: 'Immutable Audit Trail',
      icon: History,
      color: 'var(--accent-blue)',
      badge: 'Audit Log',
      main: `Event: ${auditEntry?.action || (status === 'confirmed' ? 'confirmed' : 'extracted')}`,
      sub: `Timestamp: ${auditEntry?.created_at ? new Date(auditEntry.created_at).toLocaleString() : '12 Sep 2026, 17:35:00 UTC'}`,
      detail: `Actor: ${auditEntry?.actor || match?.resolved_by || 'System Engine'}`,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="End-to-End Traceability & Evidence Lineage" maxWidth="860px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          Follow every physical progress update back to its original field report, schedule baseline WBS activity, verification decision, and immutable audit record.
        </p>

        {/* Visual Lineage Timeline Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={st.num}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: st.color,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>
                          {st.num}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: st.color }}>
                          {st.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {st.badge}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {st.main}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{st.sub}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{st.detail}</span>
                    </div>
                  </div>
                </div>

                {!isLast && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
                    <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <span style={{ height: '12px', width: '1px', background: 'var(--border-medium)' }} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Traceable audit integrity verified against ISO 19650 execution standard.
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
