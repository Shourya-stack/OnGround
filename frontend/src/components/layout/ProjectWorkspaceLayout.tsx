import React, { useState, useEffect } from 'react';
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
  User,
  LogOut,
  ChevronDown,
  Search,
  Bell,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../context/ProjectContext';
import { apiClient } from '../../lib/apiClient';
import { ProjectNotification } from '../../lib/types';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationsDrawer } from '../common/NotificationsDrawer';
import { ThemeToggle } from '../common/ThemeToggle';

export const ProjectWorkspaceLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, profile, signOut } = useAuth();
  const { activeProject, projects, setActiveProjectId } = useProject();
  const projectId = id || activeProject?.id || '';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showAiCard, setShowAiCard] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ProjectNotification[]>([]);

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notifs = await apiClient.getNotifications(projectId);
        setNotifications(notifs);
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    };
    loadNotifications();
  }, [projectId]);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const sidebarWidth = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)';

  return (
    <div className={`app-shell ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Workspace Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ width: sidebarWidth, transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {/* Project Switcher Dropdown in Brand Header */}
        <div className="sidebar-brand" style={{ padding: collapsed ? '12px' : '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!collapsed ? (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  ACTIVE PROJECT
                </span>
                <button
                  type="button"
                  className="sidebar-collapse-btn"
                  onClick={() => setCollapsed(true)}
                  title="Collapse Sidebar"
                  aria-label="Collapse Sidebar"
                >
                  <PanelLeftClose size={15} />
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-select"
                  value={projectId}
                  onChange={(e) => handleProjectSwitch(e.target.value)}
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '6px 28px 6px 10px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    cursor: 'pointer',
                    width: '100%',
                    borderRadius: 'var(--radius-md)',
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
          ) : (
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={() => setCollapsed(false)}
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav" style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: '16px' }}>
              {!collapsed && <div className="nav-section-label">{group.label}</div>}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Icon size={17} className="nav-icon" />
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            {!collapsed && <div className="nav-section-label">PORTFOLIO</div>}
            <Link to="/projects" className="nav-link" title={collapsed ? 'All Projects' : undefined}>
              <ArrowLeft size={17} className="nav-icon" />
              {!collapsed && <span className="nav-label">All Projects</span>}
            </Link>
            <Link to="/dashboard" className="nav-link" title={collapsed ? 'Executive Dashboard' : undefined}>
              <LayoutDashboard size={17} className="nav-icon" />
              {!collapsed && <span className="nav-label">Command Center</span>}
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer with Bionis-inspired AI Assistant Card */}
        <div className="sidebar-footer" style={{ padding: collapsed ? '10px 6px' : '14px 12px' }}>
          {!collapsed && showAiCard && (
            <div className="bionis-sidebar-ai-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="bionis-sidebar-ai-badge">
                  AI ASSIST
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiCard(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                  aria-label="Dismiss AI Card"
                >
                  <X size={13} />
                </button>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                  Schedule Intelligence
                </p>
                <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                  Sentence-transformer auto-links Daily Logs to Primavera P6/MSP items.
                </p>
              </div>
              <Link
                to={`/projects/${projectId}/reports/upload`}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.75rem', padding: '5px 8px', justifyContent: 'center', marginTop: '2px', textDecoration: 'none' }}
              >
                <span>Upload Report</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          )}

          <div className="realtime-status-pill">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--confidence-high)', flexShrink: 0 }} />
            {!collapsed && <span>Live DB: {currentProj?.code || 'EPC-247'}</span>}
          </div>
        </div>
      </aside>

      {/* Main Workspace Content */}
      <div
        className="main-content"
        style={{
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth})`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.2s cubic-bezier(0.16, 1, 0.3, 1), width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Workspace TopBar */}
        <header className="topbar" style={{ height: 'var(--topbar-height)', padding: '0 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              title="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="project-badge" style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)' }}>
              <span className="project-dot" />
              <span className="project-name" style={{ fontWeight: 600 }}>{currentProj?.name || 'Line 247 EPC Package'}</span>
            </div>
            <span className="project-client-sub" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              • {currentProj?.client || 'Infrastructure Authority'}
            </span>
          </div>

          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick Search Button (Ctrl+K) */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
              title="Global Search (Ctrl+K)"
              aria-label="Global Search (Ctrl+K)"
            >
              <Search size={14} color="var(--accent-blue)" />
              <span className="topbar-quick-search-label">Quick Search...</span>
              <kbd
                className="topbar-quick-search-kbd"
                style={{
                  fontSize: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              className="icon-action-btn"
              onClick={() => setNotificationsOpen(true)}
              title="Notifications & Alerts"
              aria-label="Notifications & Alerts"
              style={{ position: 'relative', width: '38px', height: '38px', borderRadius: 'var(--radius-md)' }}
            >
              <Bell size={16} />
              {notifications.some((n) => !n.read) && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '7px',
                    height: '7px',
                    backgroundColor: 'var(--confidence-low)',
                    borderRadius: '50%',
                  }}
                />
              )}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Badge */}
            <div className="user-profile-badge" style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)' }}>
              <div className="user-avatar" style={{ background: 'var(--metric-steps)', color: '#fff' }}>
                <User size={15} />
              </div>
              <div className="user-info">
                <span className="user-name" style={{ fontSize: '12px' }}>{profile?.full_name || 'User'}</span>
                <span className={`user-role-tag ${role || ''}`}>{(role || '').toUpperCase()}</span>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              className="icon-action-btn"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              title="Sign out"
              aria-label="Sign out"
              style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="workspace-main-content" style={{ flex: 1, backgroundColor: 'var(--bg-primary)', padding: '1.5rem 2rem' }}>
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={async () => {
          await apiClient.markAllNotificationsRead(projectId);
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onSelectNotification={async (item) => {
          await apiClient.markNotificationRead(item.id);
          setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
          if (item.link) {
            setNotificationsOpen(false);
            navigate(item.link);
          }
        }}
      />
    </div>
  );
};
