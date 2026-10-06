import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { authService } from '../services/authService';
import { readAuthTokens } from '../services/api';

interface AuthPageProps {
  mode: 'login' | 'register';
}

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (readAuthTokens()) {
      setIsLoggedIn(true);
    }
  }, []);

  const title = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Create your account'), [mode]);
  const subtitle = useMemo(
    () =>
      mode === 'login'
        ? 'Sign in to continue to the SoloBuild hiring dashboard.'
        : 'Create an account to manage recruiting campaigns and AI screening.',
    [mode],
  );

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          throw new Error('Please fill in all required fields.');
        }

        await authService.register({
          name: name.trim(),
          email: email.trim(),
          password,
          timezone,
        });
        showToast('Account created successfully.', 'success');
      } else {
        await authService.login(email.trim(), password);
        showToast('Signed in successfully.', 'success');
      }

      navigate('/', { replace: true });
    } catch (error: any) {
      showToast(error.message || 'Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f8fafc 100%)' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)', padding: '32px 28px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary-border)', padding: '6px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            SoloBuildAI
          </div>
          <h1 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '32px', lineHeight: 1.2, color: 'var(--text-primary)' }}>{title}</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'register' && (
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          )}
          <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {mode === 'register' && (
            <Input label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="UTC" />
          )}

          <Button type="submit" loading={loading} fullWidth>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? (
            <>
              Don’t have an account?{' '}
              <button type="button" onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
