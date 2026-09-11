import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Layers, Shield, ShieldAlert, ArrowRight } from 'lucide-react';
import { UserRole } from '../lib/types';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('planner@onground.com');
  const [selectedRole, setSelectedRole] = useState<UserRole>('planner');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(email, selectedRole);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'var(--bg-primary)' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, margin: '0 auto 12px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <Layers size={28} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>OnGround</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Infrastructure Progress & Schedule Intelligence</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Demo Account Role
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                className={`role-btn ${selectedRole === 'planner' ? 'active planner' : ''}`}
                style={{ justifyContent: 'center', padding: 10 }}
                onClick={() => {
                  setSelectedRole('planner');
                  setEmail('planner@onground.com');
                }}
              >
                <Shield size={16} />
                <span>Project Planner</span>
              </button>
              <button
                type="button"
                className={`role-btn ${selectedRole === 'supervisor' ? 'active supervisor' : ''}`}
                style={{ justifyContent: 'center', padding: 10 }}
                onClick={() => {
                  setSelectedRole('supervisor');
                  setEmail('supervisor@onground.com');
                }}
              >
                <ShieldAlert size={16} />
                <span>Site Supervisor</span>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                color: '#ffffff',
                fontSize: 14,
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: 12,
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>Enter OnGround System</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
