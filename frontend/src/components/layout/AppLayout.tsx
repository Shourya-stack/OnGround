import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
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
  Radio,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { role, profile, switchRoleForDemo, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="app-shell">
      {/* App Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
            <div className="brand-logo">
              <Layers size={22} className="brand-icon" />
            </div>
            <div className="brand-text">
              <span className="brand-title">OnGround</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">PORTFOLIO</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} className="nav-icon" />
            <span className="nav-label">Command Center</span>
          </NavLink>
          <NavLink
            to="/projects"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <FolderGit2 size={18} className="nav-icon" />
            <span className="nav-label">All Projects</span>
          </NavLink>
          <NavLink
            to="/projects/new"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <FolderPlus size={18} className="nav-icon" />
            <span className="nav-label">New Project</span>
          </NavLink>

          <div className="nav-section-label" style={{ marginTop: '24px' }}>NAVIGATION</div>
          <Link to="/" className="nav-link">
            <ArrowLeft size={18} className="nav-icon" />
            <span className="nav-label">Public Website</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="realtime-status-pill">
            <Radio size={12} className="realtime-pulse" />
            <span>Dual Local / Cloud</span>
          </div>
          <div className="system-version">OnGround IPIS • v1.0.0</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content" style={{ marginLeft: 'var(--sidebar-width)', width: 'calc(100% - var(--sidebar-width))', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* TopBar */}
        <header className="topbar" style={{ position: 'relative' }}>
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <form onSubmit={handleSearch} style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search projects, reports, WBS..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="topbar-right">
            {/* Demo Role Switcher */}
            <div className="demo-role-switcher" title="Toggle Planner vs Supervisor role">
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

            {/* Notification Bell */}
            <button
              type="button"
              className="icon-action-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
              style={{ position: 'relative' }}
            >
              <Bell size={16} />
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-blue)',
                }}
              />
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div
                className="glass-card"
                style={{
                  position: 'absolute',
                  top: '60px',
                  right: '160px',
                  width: '320px',
                  padding: '16px',
                  zIndex: 1000,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>System Notifications</span>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', borderLeft: '3px solid var(--confidence-review)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>3 Ambiguous Tasks Pending</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>Awaiting planner candidate disambiguation.</div>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', borderLeft: '3px solid var(--confidence-high)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Report Ingested</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>DPR_Piping_AreaB.pdf extracted 4 activities.</div>
                  </div>
                </div>
              </div>
            )}

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
