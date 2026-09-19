import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../lib/types';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const SignupPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<UserRole>('planner');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(email, role);
    navigate('/verify-email', { state: { email, role } });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <ThemeToggle size="sm" />
      </div>
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '36px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', margin: '0 auto 12px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', borderRadius: '12px', color: '#ffffff', textDecoration: 'none' }}>
            <Layers size={26} />
          </Link>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Create OnGround Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Start managing progress reconciliation across your projects</p>
        </div>

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Vikramaditya Singh"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Email *</label>
            <input
              type="email"
              required
              placeholder="v.singh@epc-infrastructure.com"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Organization *</label>
              <input
                type="text"
                required
                placeholder="Contractor / Authority"
                className="form-input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Primary Role *</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="planner">Project Planner</option>
                <option value="supervisor">Site Supervisor</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Create Password *</label>
            <input
              type="password"
              required
              placeholder="Minimum 8 characters"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '16px 0 20px' }}>
            <input
              type="checkbox"
              id="terms-check"
              required
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: '3px' }}
            />
            <label htmlFor="terms-check" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              I agree to the <Link to="/terms" style={{ color: 'var(--accent-blue)' }}>Terms of Service</Link> and{' '}
              <Link to="/privacy" style={{ color: 'var(--accent-blue)' }}>Privacy Policy</Link>.
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            Create Account <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
