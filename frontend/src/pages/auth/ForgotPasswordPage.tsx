import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', margin: '0 auto 12px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', borderRadius: '12px', color: '#ffffff', textDecoration: 'none' }}>
            <Layers size={26} />
          </Link>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>Reset Your Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Enter your work email address to receive password reset instructions
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--confidence-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Reset Link Sent</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '24px' }}>
              If an account exists for <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>, a password reset link has been dispatched.
            </p>
            <Link to="/reset-password" className="btn btn-primary" style={{ width: '100%', marginBottom: '12px' }}>
              Simulate Password Reset Page <ArrowRight size={16} />
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSent(false)}>
              Send to another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Work Email Address</label>
              <input
                type="email"
                required
                placeholder="planner@onground.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
              Send Reset Link <Mail size={16} />
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
