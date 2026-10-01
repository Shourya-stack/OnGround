import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { EmailOtpType } from '@supabase/supabase-js';
import { AlertCircle, ArrowRight, Layers, Loader2 } from 'lucide-react';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { supabase } from '../../lib/supabaseClient';

const emailOtpTypes: EmailOtpType[] = ['signup', 'email', 'email_change', 'email_change_current', 'email_change_new', 'magiclink', 'recovery', 'invite'];

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialEmail = (location.state as { email?: string } | null)?.email || searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const tokenHash = searchParams.get('token_hash');
  const rawType = searchParams.get('type');

  useEffect(() => {
    if (!tokenHash || !rawType || !emailOtpTypes.includes(rawType as EmailOtpType)) return;

    let active = true;
    const verifyLink = async () => {
      setBusy(true);
      setError(null);
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: rawType as EmailOtpType,
      });
      if (!active) return;
      if (verifyError) setError(verifyError.message);
      else setVerified(true);
      setBusy(false);
    };

    void verifyLink();
    return () => {
      active = false;
    };
  }, [rawType, tokenHash]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'signup',
      });
      if (verifyError) throw verifyError;
      setVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email verification failed. Check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/verify-email` },
      });
      if (resendError) throw resendError;
      setNotice('A new verification email has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the verification email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <ThemeToggle size="sm" />
      </div>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', margin: '0 auto 12px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', borderRadius: '12px', color: '#ffffff', textDecoration: 'none' }}>
            <Layers size={26} />
          </Link>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {verified ? 'Email verified' : 'Verify your email'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {verified
              ? 'Your account is confirmed. Continue to your projects.'
              : 'Enter the six-digit code sent to your email, or open the confirmation link.'}
          </p>
        </div>

        {error && (
          <div role="alert" className="alert alert-error" style={{ marginBottom: '16px', fontSize: '13px', display: 'flex', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {notice && <p role="status" style={{ color: 'var(--confidence-high)', fontSize: '13px', marginBottom: '16px' }}>{notice}</p>}

        {verified ? (
          <Link to="/projects" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Continue to projects <ArrowRight size={16} />
          </Link>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label" htmlFor="verification-email">Email address</label>
              <input
                id="verification-email"
                type="email"
                required
                autoComplete="email"
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="verification-code">Six-digit code</label>
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                minLength={6}
                maxLength={6}
                pattern="[0-9]{6}"
                required
                className="form-input"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={busy}>
              {busy ? <Loader2 size={16} className="spin" /> : <>Verify email <ArrowRight size={16} /></>}
            </button>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', padding: '12px', marginTop: '10px' }} onClick={resendCode} disabled={busy || !email.trim()}>
              Resend verification email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
