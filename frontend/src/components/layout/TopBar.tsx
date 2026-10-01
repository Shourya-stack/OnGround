import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut } from 'lucide-react';


export const TopBar: React.FC = () => {
  const { role, profile, signOut } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="project-badge">
          <span className="project-dot"></span>
          <span className="project-name">Project: Line 247 — EPC Package 3</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* User indicator */}
        <div className="user-profile-badge">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <div className="user-info">
            <span className="user-name">{profile?.full_name || 'User'}</span>
            <span className={`user-role-tag ${role || ''}`}>{(role || '').toUpperCase()}</span>
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
