import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = (location.state as any)?.email || 'planner@onground.com';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verified, setVerified] = useState(false);

  const handleCodeChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const updated = [...code];
    updated[index] = val;
    setCode(updated);

    // Auto-focus next
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setVerified(true);
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', margin: '0 auto 12px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', borderRadius: '12px', color: '#ffffff', textDecoration: 'none' }}>
            <Layers size={26} />
          </Link>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>Verify Your Email</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Enter the 6-digit confirmation code sent to <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>
          </p>
        </div>

        {verified ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--confidence-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Email Verified</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Your account has been activated. Launching your executive dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '24px 0' }}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  className="form-input"
                  style={{
                    width: '44px',
                    height: '48px',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    padding: 0,
                  }}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Confirm & Continue <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          Didn&apos;t receive a code?{' '}
          <button
            type="button"
            onClick={() => setCode(['2', '6', '1', '2', '2', '0'])}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600 }}
          >
            Auto-fill demo code
          </button>
        </div>
      </div>
    </div>
  );
};
