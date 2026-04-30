'use client';
// app/(protected)/hr-docs/page.tsx — HR Docs stub
import { useQuery } from '@tanstack/react-query';
import { hrDocsApi } from '@/lib/api';
export default function HRDocsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['hrDocs'], queryFn: hrDocsApi.getAll });
  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>HR Docs &amp; Letters</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>{data.length} issued</p>
      {isLoading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      <pre style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', padding: 16, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(data.slice(0, 3), null, 2)}
      </pre>
    </div>
  );
}
