import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Shield, ShieldAlert, User, LogOut, Activity, RefreshCw } from 'lucide-react';
import { UserRole } from '../../lib/types';

export const TopBar: React.FC = () => {
  const { role, profile, switchRoleForDemo, signOut } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="project-badge">
          <span className="project-dot"></span>
          <span className="project-name">Project: Line 247 — EPC Package 3</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Demo Role Switcher */}
        <div className="demo-role-switcher" title="Demo Switcher: Toggle between Planner & Supervisor roles">
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

        {/* User indicator */}
        <div className="user-profile-badge">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <div className="user-info">
            <span className="user-name">{profile?.full_name || 'Shourya (Lead)'}</span>
            <span className={`user-role-tag ${role}`}>{role.toUpperCase()}</span>
          </div>
        </div>

        {/* Logout button */}
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
  );
};
