import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  FolderPlus,
  Layers,
  ArrowLeft,
  Bell,
  Search,
  Shield,
  ShieldAlert,
  User,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../common/ThemeToggle';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, profile, switchRoleForDemo, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showAiCard, setShowAiCard] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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

      {/* App Sidebar */}
      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''}`}
        style={{
          width: sidebarWidth,
          transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="sidebar-brand"
          style={{
            padding: collapsed ? '12px' : '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              className="brand-logo"
              style={{
                width: '34px',
                height: '34px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={20} color="#fff" />
            </div>
            {!collapsed && (
              <div className="brand-text">
                <span className="brand-title" style={{ fontSize: '15px', fontWeight: 700 }}>
                  OnGround
                </span>
                <span className="brand-sub" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Enterprise IPIS
                </span>
              </div>
            )}
          </Link>

          {!collapsed ? (
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={() => setCollapsed(true)}
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
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

        <nav className="sidebar-nav" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1, padding: '14px 10px' }}>
          {!collapsed && <div className="nav-section-label">PORTFOLIO</div>}
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={collapsed ? 'Command Center' : undefined}
            style={{ borderRadius: 'var(--radius-md)', marginBottom: '3px' }}
          >
            <LayoutDashboard size={17} className="nav-icon" />
            {!collapsed && <span className="nav-label">Command Center</span>}
          </NavLink>
          <NavLink
            to="/projects"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={collapsed ? 'All Projects' : undefined}
            style={{ borderRadius: 'var(--radius-md)', marginBottom: '3px' }}
          >
            <FolderGit2 size={17} className="nav-icon" />
            {!collapsed && <span className="nav-label">All Projects</span>}
          </NavLink>
          <NavLink
            to="/projects/new"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={collapsed ? 'New Project' : undefined}
            style={{ borderRadius: 'var(--radius-md)', marginBottom: '3px' }}
          >
            <FolderPlus size={17} className="nav-icon" />
            {!collapsed && <span className="nav-label">New Project</span>}
          </NavLink>

          <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            {!collapsed && <div className="nav-section-label">NAVIGATION</div>}
            <Link to="/" className="nav-link" title={collapsed ? 'Public Website' : undefined} style={{ borderRadius: 'var(--radius-md)' }}>
              <ArrowLeft size={17} className="nav-icon" />
              {!collapsed && <span className="nav-label">Public Website</span>}
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
                  Portfolio Health
                </p>
                <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                  Real-time variance tracking across active infrastructure projects.
                </p>
              </div>
              <Link
                to="/projects"
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.75rem', padding: '5px 8px', justifyContent: 'center', marginTop: '2px', textDecoration: 'none' }}
              >
                <span>View Projects</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          )}

          <div className="realtime-status-pill">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--confidence-high)', flexShrink: 0 }} />
            {!collapsed && <span>System Status: Operational</span>}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
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
        {/* TopBar */}
        <header className="topbar" style={{ height: 'var(--topbar-height)', padding: '0 1.5rem', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
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
            <form onSubmit={handleSearch} style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--accent-blue)',
                }}
              />
              <input
                type="text"
                placeholder="Search projects, contracts, WBS..."
                className="form-input"
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  height: '38px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Demo Role Switcher */}
            <div className="demo-role-switcher" title="Toggle Planner vs Supervisor role">
              <span className="role-switcher-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ROLE:</span>
              <div className="role-buttons">
                <button
                  type="button"
                  className={`role-btn ${role === 'planner' ? 'active planner' : ''}`}
                  onClick={() => switchRoleForDemo('planner')}
                >
                  <Shield size={13} />
                  <span>Planner</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'supervisor' ? 'active supervisor' : ''}`}
                  onClick={() => switchRoleForDemo('supervisor')}
                >
                  <ShieldAlert size={13} />
                  <span>Supervisor</span>
                </button>
              </div>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="icon-action-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
              style={{ position: 'relative', width: '38px', height: '38px', borderRadius: 'var(--radius-md)' }}
            >
              <Bell size={16} />
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-blue)',
                }}
              />
            </button>

            {/* Light / Dark Mode Theme Toggle */}
            <ThemeToggle />

            {/* Notification Popover */}
            {showNotifications && (
              <div
                className="bionis-chart-tooltip"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: '80px',
                  width: '320px',
                  zIndex: 100,
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>Portfolio Notifications</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => setShowNotifications(false)}>Close</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '12px', padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-surface-elevated)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--confidence-high)' }}>AI Reconciled 9 Activities</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Daily report processed for Line 247</div>
                  </div>
                  <div style={{ fontSize: '12px', padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-surface-elevated)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--confidence-review)' }}>Review Required</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>1 activity below 0.85 threshold</div>
                  </div>
                </div>
              </div>
            )}

            {/* User Profile Badge */}
            <div className="user-profile-badge" style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)' }}>
              <div className="user-avatar" style={{ background: 'var(--metric-steps)', color: '#fff' }}>
                <User size={15} />
              </div>
              <div className="user-info">
                <span className="user-name" style={{ fontSize: '12px' }}>{profile?.full_name || 'Admin'}</span>
                <span className={`user-role-tag ${role}`}>{role.toUpperCase()}</span>
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

        {/* Page Content */}
        <main className="app-main-content" style={{ flex: 1, backgroundColor: 'var(--bg-primary)', padding: '1.5rem 2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
