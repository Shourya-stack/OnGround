import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layers, Shield, ShieldAlert, ArrowRight, AlertCircle } from 'lucide-react';
import { UserRole } from '../lib/types';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const [email, setEmail] = useState('demo_planner@onground.dev');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('planner');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      await signIn(email, password, selectedRole);
      navigate('/projects/proj-01/overview');
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please check your credentials.';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
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

        {isExpired && (
          <div style={{ padding: '10px 14px', marginBottom: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontSize: 13 }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>Your session has expired. Please sign in again to continue.</span>
          </div>
        )}

        {authError && (
          <div style={{ padding: '10px 14px', marginBottom: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontSize: 13 }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

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
                  setEmail('demo_planner@onground.dev');
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

          <div style={{ marginBottom: 14 }}>
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

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
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
          </div>

          <button
            type="submit"
            disabled={loading}
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
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span>{loading ? 'Authenticating...' : 'Enter OnGround System'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
