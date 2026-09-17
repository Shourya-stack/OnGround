import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, X, CalendarRange, FileText, Activity, AlertCircle } from 'lucide-react';
import { apiService } from '../../api/apiService';
import { SchedulePlanItem, ExtractedActivity, ReportItem, ScheduleMatch } from '../../lib/types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  category: 'activity' | 'record' | 'report' | 'review';
  title: string;
  subtitle: string;
  link: string;
  badge?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [schedule, setSchedule] = useState<SchedulePlanItem[]>([]);
  const [activities, setActivities] = useState<ExtractedActivity[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const loadAll = async () => {
        try {
          const [s, a, r, m] = await Promise.all([
            apiService.getSchedule(projectId),
            apiService.getActivities(projectId),
            apiService.getReports(projectId),
            apiService.getMatches(projectId),
          ]);
          setSchedule(s);
          setActivities(a);
          setReports(r);
          setMatches(m);
        } catch (e) {
          console.error('Failed to load search index', e);
        }
      };
      loadAll();
    } else {
      setQuery('');
    }
  }, [isOpen, projectId]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const results: SearchResultItem[] = [];

  if (!q) {
    // Default recommended shortcuts
    results.push(
      {
        id: 'rec-1',
        category: 'review',
        title: 'Pending Human Verification Queue',
        subtitle: `${matches.filter((m) => m.status === 'pending_review').length} ambiguous matches awaiting certified planner sign-off`,
        link: `/projects/${projectId}/review`,
        badge: 'Priority',
      },
      {
        id: 'rec-2',
        category: 'activity',
        title: 'PIP-201 • Piping Spool Fabrication',
        subtitle: '12-inch cooling water line in Unit 200 Bay 4',
        link: `/projects/${projectId}/schedule`,
        badge: 'Piping',
      },
      {
        id: 'rec-3',
        category: 'report',
        title: 'DPR_Piping_Package3_2026-09-12.pdf',
        subtitle: 'Ingested daily construction progress log',
        link: `/projects/${projectId}/reports`,
        badge: 'Report',
      }
    );
  } else {
    // Search schedule items
    schedule.forEach((s) => {
      if (s.activity_code.toLowerCase().includes(q) || s.activity_description.toLowerCase().includes(q) || s.discipline.toLowerCase().includes(q)) {
        results.push({
          id: s.id,
          category: 'activity',
          title: `${s.activity_code} — ${s.activity_description}`,
          subtitle: `Discipline: ${s.discipline} • Plan: ${s.planned_progress ?? 70}% • Status: ${s.status?.replace('_', ' ') || 'ON TRACK'}`,
          link: `/projects/${projectId}/schedule`,
          badge: 'Baseline Task',
        });
      }
    });

    // Search extracted activities
    activities.forEach((act) => {
      if (act.activity_description.toLowerCase().includes(q) || (act.location_reference && act.location_reference.toLowerCase().includes(q))) {
        results.push({
          id: act.id,
          category: 'record',
          title: act.activity_description,
          subtitle: `Discipline: ${act.discipline} • ${act.location_reference || 'Unit 200'} • Conf: ${(act.extraction_confidence * 100).toFixed(0)}%`,
          link: `/projects/${projectId}/activities`,
          badge: 'Field Record',
        });
      }
    });

    // Search reports
    reports.forEach((rep) => {
      if (rep.file_name.toLowerCase().includes(q) || rep.uploaded_by.toLowerCase().includes(q)) {
        results.push({
          id: rep.id,
          category: 'report',
          title: rep.file_name,
          subtitle: `Uploaded by ${rep.uploaded_by} • Size: ${rep.file_size} • Status: ${rep.status}`,
          link: `/projects/${projectId}/reports`,
          badge: 'Report File',
        });
      }
    });
  }

  const handleSelect = (link: string) => {
    onClose();
    navigate(link);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'activity':
        return <CalendarRange size={16} style={{ color: 'var(--accent-blue)' }} />;
      case 'record':
        return <Activity size={16} style={{ color: 'var(--confidence-high)' }} />;
      case 'report':
        return <FileText size={16} style={{ color: 'var(--accent-indigo)' }} />;
      case 'review':
        return <AlertCircle size={16} style={{ color: 'var(--confidence-review)' }} />;
      default:
        return <Search size={16} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '650px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search baseline codes, field observations, reports, or disciplines... (ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '14.5px',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: '4px', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '8px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
              No matching records found for "{query}".
            </div>
          ) : (
            results.slice(0, 10).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.link)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {getCategoryIcon(item.category)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    {item.badge && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Quick shortcut: <strong style={{ color: 'var(--text-primary)' }}>Ctrl + K</strong></span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
