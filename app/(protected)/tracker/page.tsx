'use client';
// app/(protected)/tracker/page.tsx — 20DS Tracker stub
import { useQuery } from '@tanstack/react-query';
import { trackerApi } from '@/lib/api';
export default function TrackerPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['tracker'], queryFn: trackerApi.getAll });
  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>ONBOARDING HUB</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>{data.length} active records</p>
      {isLoading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      <pre style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', padding: 16, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(data.slice(0, 2), null, 2)}
      </pre>
    </div>
  );
}
