import { Outlet, NavLink, useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  ListTree,
  FileText,
  UploadCloud,
  Cpu,
  GitCompare,
  CheckCheck,
  AlertCircle,
  BarChart3,
  History,
  Users,
  Settings,
  ArrowLeft,
  Shield,
  ShieldAlert,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../context/ProjectContext';

export const ProjectWorkspaceLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';
  const navigate = useNavigate();
  const location = useLocation();
  const { role, profile, switchRoleForDemo, signOut } = useAuth();
  const { activeProject, projects, setActiveProjectId } = useProject();

  const currentProj = projects.find((p) => p.id === projectId) || activeProject;

  const handleProjectSwitch = (newId: string) => {
    setActiveProjectId(newId);
    const subPath = location.pathname.split(`/projects/${projectId}`)[1] || '/overview';
    navigate(`/projects/${newId}${subPath}`);
  };

  const navGroups = [
    {
      label: 'PROGRESS & SCHEDULE',
      items: [
        { to: `/projects/${projectId}/overview`, label: 'Project Overview', icon: LayoutDashboard },
        { to: `/projects/${projectId}/schedule`, label: 'Baseline Schedule WBS', icon: CalendarRange },
        { to: `/projects/${projectId}/activities`, label: 'Activities Explorer', icon: ListTree },
      ],
    },
    {
      label: 'INGESTION & PIPELINE',
      items: [
        { to: `/projects/${projectId}/reports`, label: 'Daily Reports', icon: FileText },
        { to: `/projects/${projectId}/reports/upload`, label: 'Upload Daily Log', icon: UploadCloud },
        { to: `/projects/${projectId}/processing`, label: 'Processing Pipeline', icon: Cpu },
      ],
    },
    {
      label: 'RECONCILIATION & REVIEW',
      items: [
        { to: `/projects/${projectId}/reconciliation`, label: 'Reconciliation Table', icon: GitCompare },
        { to: `/projects/${projectId}/review`, label: 'Human Review Queue', icon: CheckCheck },
        { to: `/projects/${projectId}/unmatched`, label: 'Unmatched Pool', icon: AlertCircle },
      ],
    },
    {
      label: 'GOVERNANCE & INSIGHTS',
      items: [
        { to: `/projects/${projectId}/analytics`, label: 'Project Analytics', icon: BarChart3 },
        { to: `/projects/${projectId}/audit`, label: 'Audit Trail', icon: History },
        { to: `/projects/${projectId}/team`, label: 'Project Team', icon: Users },
        { to: `/projects/${projectId}/settings`, label: 'Project Settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="app-shell">
      {/* Workspace Sidebar */}
      <aside className="sidebar" style={{ overflowY: 'auto' }}>
        {/* Project Switcher Dropdown in Brand Header */}
        <div className="sidebar-brand" style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                ACTIVE PROJECT
              </span>
              <span className="project-dot" />
            </div>
            <div style={{ position: 'relative' }}>
              <select
                className="form-select"
                value={currentProj?.id || projectId}
                onChange={(e) => handleProjectSwitch(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '6px 28px 6px 10px',
                  height: '34px',
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-medium)',
                  color: 'var(--text-primary)',
                  appearance: 'none',
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav" style={{ flex: 1, padding: '12px 0' }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: '16px' }}>
              <div className="nav-section-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}

          <div className="nav-section-label" style={{ marginTop: '16px' }}>PORTFOLIO</div>
          <Link to="/projects" className="nav-link">
            <ArrowLeft size={16} className="nav-icon" />
            <span className="nav-label">All Projects</span>
          </Link>
          <Link to="/dashboard" className="nav-link">
            <LayoutDashboard size={16} className="nav-icon" />
            <span className="nav-label">Executive Dashboard</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="realtime-status-pill">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--confidence-high)' }} />
            <span>Project Sync: Live</span>
          </div>
          <div className="system-version">
            {currentProj?.code || 'EPC-247'} • {currentProj?.status?.toUpperCase()}
          </div>
        </div>
      </aside>

      {/* Main Workspace Content */}
      <div className="main-content" style={{ marginLeft: 'var(--sidebar-width)', width: 'calc(100% - var(--sidebar-width))', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Workspace TopBar */}
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="project-badge">
              <span className="project-dot" />
              <span className="project-name">{currentProj?.name || 'Line 247 EPC Package'}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>• {currentProj?.client}</span>
          </div>

          <div className="topbar-right">
            {/* Demo Role Switcher */}
            <div className="demo-role-switcher" title="Toggle Planner vs Supervisor permissions">
              <span className="role-switcher-label">DEMO ROLE:</span>
              <div className="role-buttons">
                <button
                  type="button"
                  className={`role-btn ${role === 'planner' ? 'active planner' : ''}`}
                  onClick={() => switchRoleForDemo('planner')}
                >
                  <Shield size={14} />
                  <span>Planner</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'supervisor' ? 'active supervisor' : ''}`}
                  onClick={() => switchRoleForDemo('supervisor')}
                >
                  <ShieldAlert size={14} />
                  <span>Supervisor</span>
                </button>
              </div>
            </div>

            {/* User Profile */}
            <div className="user-profile-badge">
              <div className="user-avatar">
                <User size={16} />
              </div>
              <div className="user-info">
                <span className="user-name">{profile?.full_name || 'Shourya (Lead)'}</span>
                <span className={`user-role-tag ${role}`}>{role.toUpperCase()}</span>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              className="icon-action-btn"
              onClick={() => signOut()}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '32px', flex: 1, backgroundColor: 'var(--bg-primary)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
