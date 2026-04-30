'use client';
// app/(protected)/recruitment/page.tsx — Recruitment stub
import { useQuery } from '@tanstack/react-query';
import { recruitmentApi } from '@/lib/api';
export default function RecruitmentPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['jobs'], queryFn: recruitmentApi.getJobs });
  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Recruitment</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>{data.length} jobs</p>
      {isLoading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      <pre style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', padding: 16, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(data.slice(0, 3), null, 2)}
      </pre>
    </div>
  );
}
