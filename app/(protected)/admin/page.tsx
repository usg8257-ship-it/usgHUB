'use client';
// app/(protected)/admin/page.tsx — Admin (Users + Config) stub
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
export default function AdminPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });
  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Admin</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>Users &amp; Configuration · {data.length} users</p>
      {isLoading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      <pre style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', padding: 16, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
