import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  GitCompare, 
  HelpCircle, 
  History, 
  CalendarRange, 
  Layers,
  Radio
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Upload Daily Log', icon: UploadCloud },
    { to: '/reconciliation', label: 'Reconciliation Table', icon: GitCompare },
    { to: '/unmatched', label: 'Unmatched Activities', icon: HelpCircle },
    { to: '/audit', label: 'Immutable Audit Trail', icon: History },
    { to: '/schedule', label: 'Baseline Schedule WBS', icon: CalendarRange },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Layers size={22} className="brand-icon" />
        </div>
        <div className="brand-text">
          <span className="brand-title">OnGround</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">OPERATIONS</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="realtime-status-pill">
          <Radio size={12} className="realtime-pulse" />
          <span>Realtime Sync: Active</span>
        </div>
        <div className="system-version">v1.0.0 • Dual Local/Cloud</div>
      </div>
    </aside>
  );
};
