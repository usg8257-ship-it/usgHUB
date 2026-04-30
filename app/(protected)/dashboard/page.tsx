'use client';
// app/(protected)/dashboard/page.tsx
// Full implementation: Step 7
import { useQuery } from '@tanstack/react-query';
import { configApi } from '@/lib/api';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['activityLog'],
    queryFn:  () => configApi.getActivityLog(),
  });

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Dashboard</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        Summary &amp; activity — full implementation in Step 7
      </p>
      {isLoading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      {data && (
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 16, border: '1px solid var(--border)', fontSize: 13 }}>
          <strong>Activity Log rows loaded:</strong> {Array.isArray(data) ? data.length : 0}
        </div>
      )}
    </div>
  );
}
