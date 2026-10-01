import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setSubmitting(true);
    try {
      const hasSession = await signUp({
        email,
        password,
        fullName: name,
        company,
      });
      navigate(hasSession ? '/projects' : '/verify-email', { state: { email } });
    } catch (err: any) {
      setError(err?.message || 'Could not create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

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
            <p className="form-label">Default account role</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              New accounts start as Site Supervisor. Project roles are granted by a project planner.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Create Password *</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Re-enter password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="spin" style={{ marginRight: 8, display: 'inline-block' }} />
                Creating account…
              </>
            ) : (
              <>
                Create Account <ArrowRight size={16} />
              </>
            )}
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
