import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layers, Shield, ShieldAlert, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../lib/types';

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
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please check your credentials.';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', margin: '0 auto 12px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', borderRadius: '12px', color: '#ffffff', textDecoration: 'none' }}>
            <Layers size={26} />
          </Link>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>Sign in to OnGround</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Infrastructure Progress & Schedule Intelligence</p>
        </div>

        {/* Session Expired Notice */}
        {isExpired && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#fca5a5',
              fontSize: '13px',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, color: '#ef4444', marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>Session Expired</div>
              <div>Your session has expired. Please sign in again.</div>
            </div>
          </div>
        )}

        {/* Auth Error Notice */}
        {authError && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#fca5a5',
              fontSize: '13px',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, color: '#ef4444', marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>Authentication Error</div>
              <div>{authError}</div>
            </div>
          </div>
        )}

        {/* Demo Account Role Picker */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Demo Account Persona
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className={`role-btn ${selectedRole === 'planner' ? 'active planner' : ''}`}
              style={{ justifyContent: 'center', padding: '10px', height: 'auto' }}
              onClick={() => {
                setSelectedRole('planner');
                setEmail('demo_planner@onground.dev');
              }}
            >
              <Shield size={16} />
              <span style={{ fontSize: '12px' }}>Project Planner</span>
            </button>
            <button
              type="button"
              className={`role-btn ${selectedRole === 'supervisor' ? 'active supervisor' : ''}`}
              style={{ justifyContent: 'center', padding: '10px', height: 'auto' }}
              onClick={() => {
                setSelectedRole('supervisor');
                setEmail('supervisor@onground.com');
              }}
            >
              <ShieldAlert size={16} />
              <span style={{ fontSize: '12px' }}>Site Supervisor</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in...' : `Sign In as ${selectedRole === 'planner' ? 'Planner' : 'Supervisor'}`} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
            Create an Account
          </Link>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
};
