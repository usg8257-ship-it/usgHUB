'use client';
// app/page.tsx — Login page (public)
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router  = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (!res.success) {
        setError(res.error ?? 'Invalid credentials');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', position: 'fixed', inset: 0, alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d2a5e 0%, #1e4799 55%, #0a4b7c 100%)'
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, boxShadow: '0 24px 80px rgba(0,0,0,.38)',
        width: '100%', maxWidth: 420, padding: '40px 40px 34px', margin: 20
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e4799', letterSpacing: '-.5px' }}>
            United Security Group
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7a99', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 4 }}>
            Centralized HUB
          </div>
          <div style={{ width: 48, height: 3, background: 'linear-gradient(90deg,#1e4799,#00c9b8)', borderRadius: 2, margin: '12px auto 0' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', color: '#1a2540', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', color: '#1a2540', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 8, padding: '9px 13px', fontSize: 12.5, color: '#b91c1c', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#93a3c8' : 'linear-gradient(135deg,#1e4799,#2563eb)',
              color: '#fff', border: 'none', borderRadius: 9, padding: '12px', fontSize: 14,
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.03em'
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
