import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderGit2,
  FolderPlus,
  Search,
  Users,
  ChevronRight,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { useProject } from '../../context/ProjectContext';
import { Project, ProjectStatus } from '../../lib/types';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActiveProjectId } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await apiService.getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Infrastructure Project Portfolios
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Select an active project to open its dedicated progress reconciliation workspace.
          </p>
        </div>

        <Link to="/projects/new" className="btn btn-primary">
          <FolderPlus size={16} /> New Project Wizard
        </Link>
      </div>

      {/* Filter & Search Bar */}
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
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, code, client, location..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px', height: '38px', fontSize: '13px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS:</span>
          {(['all', 'active', 'completed', 'archived'] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={`tab-pill ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
              style={{ textTransform: 'capitalize' }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <LoadingSkeleton rows={4} height="90px" />
      ) : filteredProjects.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FolderGit2 size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>No Projects Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
            No projects matched your search criteria.
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="glass-card"
              style={{
                padding: '24px 28px',
                display: 'grid',
                gridTemplateColumns: '1.8fr 1fr 1fr 1fr auto',
                gap: '24px',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => {
                setActiveProjectId(proj.id);
                navigate(`/projects/${proj.id}/overview`);
              }}
            >
              {/* Project Title & Client */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {proj.name}
                  </h2>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                    {proj.code}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: proj.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                      color: proj.status === 'active' ? 'var(--confidence-high)' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {proj.status}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Client: {proj.client} • {proj.location} • Contract: {proj.contract_type}
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Physical Progress</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{proj.progress}%</span>
                </div>
                <ProgressBar progress={proj.progress} />
              </div>

              {/* Reports & Reconciliation */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {proj.matched_count} / {proj.activities_count} Matched
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {proj.reports_count} Reports Processed
                </div>
              </div>

              {/* Team & Budget */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Budget: {proj.budget}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Users size={13} /> {proj.team_size} Team Members
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveProjectId(proj.id);
                    navigate(`/projects/${proj.id}/overview`);
                  }}
                >
                  Workspace <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
