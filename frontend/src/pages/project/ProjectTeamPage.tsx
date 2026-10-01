import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  UserPlus,
  Trash2,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { TeamMember, ExtendedRole } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { Toast, ToastMessage } from '../../components/common/Toast';

export const ProjectTeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || '';

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<{ name: string; email: string; role: ExtendedRole }>({
    name: '',
    email: '',
    role: 'engineer',
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getTeam(projectId);
      setTeam(data);
    } catch (err) {
      console.error('Failed to load team', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [projectId]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = inviteForm.name.trim();
    const trimmedEmail = inviteForm.email.trim();
    const newErrors: { name?: string; email?: string } = {};

    if (!trimmedName) {
      newErrors.name = 'Full Name is required and cannot be empty.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid work email address.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      await apiClient.inviteTeamMember(projectId, {
        ...inviteForm,
        name: trimmedName,
        email: trimmedEmail,
      });
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Invitation Dispatched',
        message: `Invited ${trimmedName} as a project ${inviteForm.role}.`,
      });
      setInviteModalOpen(false);
      setInviteForm({ name: '', email: '', role: 'engineer' });
      loadTeam();
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    try {
      await apiClient.removeTeamMember(projectId, memberId);
      setToast({
        id: Date.now().toString(),
        type: 'info',
        title: 'Member Removed',
        message: `${name} has been removed from this project workspace.`,
      });
      loadTeam();
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Project Governance & Team Roster
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Manage team access levels, approval rights, and report submission privileges.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setInviteModalOpen(true);
            setErrors({});
          }}
        >
          <UserPlus size={16} /> Invite Team Member
        </button>
      </div>

      {/* Team Table */}
      {loading ? (
        <LoadingSkeleton rows={5} height="50px" />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th style={{ width: '220px' }}>Email Address</th>
                <th style={{ width: '160px' }}>Project Role</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '160px' }}>Last Active</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--accent-blue)',
                          fontSize: '13px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {member.name[0]}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {member.email}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: member.role === 'planner' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: member.role === 'planner' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: member.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: member.status === 'active' ? 'var(--confidence-high)' : 'var(--confidence-review)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {member.last_active}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#ef4444' }}
                      title="Remove member"
                      onClick={() => handleRemove(member.id, member.name)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <Modal
          isOpen={inviteModalOpen}
          onClose={() => {
            setInviteModalOpen(false);
            setErrors({});
          }}
          title="Invite Project Collaborator"
        >
          <form onSubmit={handleInviteSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Meera Joshi"
                className="form-input"
                style={errors.name ? { borderColor: 'var(--confidence-low)' } : undefined}
                value={inviteForm.name}
                onChange={(e) => {
                  setInviteForm({ ...inviteForm, name: e.target.value });
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
              />
              {errors.name && (
                <div style={{ color: 'var(--confidence-low)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.name}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Work Email *</label>
              <input
                type="email"
                placeholder="m.joshi@contractor.in"
                className="form-input"
                style={errors.email ? { borderColor: 'var(--confidence-low)' } : undefined}
                value={inviteForm.email}
                onChange={(e) => {
                  setInviteForm({ ...inviteForm, email: e.target.value });
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
              />
              {errors.email && (
                <div style={{ color: 'var(--confidence-low)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.email}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Assign Role *</label>
              <select
                className="form-select"
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as ExtendedRole })}
              >
                <option value="planner">Project Planner (Full Confirmation Authority)</option>
                <option value="supervisor">Site Supervisor (Report Upload & Ingestion)</option>
                <option value="engineer">Site Field Engineer (Read & Inspect)</option>
                <option value="manager">Project Manager (Executive Oversight)</option>
              </select>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setInviteModalOpen(false);
                  setErrors({});
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Send Invitation
              </button>
            </div>
          </form>
        </Modal>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
