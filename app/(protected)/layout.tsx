// app/(protected)/layout.tsx — Wraps all protected pages with sidebar + auth check
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Sidebar from '@/components/Sidebar';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar profile={session.profile} />
      <main style={{ flex: 1, overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
