'use client';
// app/(protected)/onboarding/page.tsx — Pipeline stub (full CRUD in Step 7)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApi } from '@/lib/api';
export default function OnboardingPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['onboarding'], queryFn: onboardingApi.getAll });
  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Onboarding Pipeline</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>{data.length} records</p>
      {isLoading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      <pre style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', padding: 16, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(data.slice(0, 3), null, 2)}
      </pre>
    </div>
  );
}
