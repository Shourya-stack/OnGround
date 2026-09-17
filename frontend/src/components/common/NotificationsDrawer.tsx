import React from 'react';
import { ProjectNotification } from '../../lib/types';
import { Drawer } from '../ui/Drawer';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, FileText, CheckCircle2, ArrowRight, Check } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ProjectNotification[];
  onMarkAllRead: () => void;
  onSelectNotification: (item: ProjectNotification) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectNotification,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'review':
        return <AlertCircle size={16} style={{ color: 'var(--confidence-review)' }} />;
      case 'variance':
        return <AlertTriangle size={16} style={{ color: '#ef4444' }} />;
      case 'evidence':
        return <FileText size={16} style={{ color: 'var(--accent-indigo)' }} />;
      default:
        return <CheckCircle2 size={16} style={{ color: 'var(--confidence-high)' }} />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Project Notifications & Alerts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {unreadCount > 0 ? (
              <span><strong style={{ color: 'var(--accent-blue)' }}>{unreadCount}</strong> unread alert{unreadCount > 1 ? 's' : ''}</span>
            ) : (
              <span>All notifications up to date</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onMarkAllRead}
              style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Check size={13} /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No new notifications.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onSelectNotification(n)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: n.read ? 'var(--bg-surface)' : 'rgba(56, 189, 248, 0.06)',
                  border: `1px solid ${n.read ? 'var(--border-subtle)' : 'var(--accent-blue)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  {getIcon(n.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {n.title}
                    </h4>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {n.timestamp}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {n.message}
                  </p>

                  {n.link && (
                    <div style={{ marginTop: '8px' }}>
                      <Link
                        to={n.link}
                        onClick={onClose}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: 'var(--accent-blue)',
                          textDecoration: 'none',
                        }}
                      >
                        <span>Inspect alert details</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};
