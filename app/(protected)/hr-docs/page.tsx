// app/(protected)/hr-docs/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import HRDocsClient from './client';

export const metadata = { title: 'Docs Generator — USG' };

export default async function HRDocsPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const { role } = session.profile;
  if (!['SUPER_ADMIN', 'HR_OFFICER'].includes(role)) redirect('/dashboard');

  return <HRDocsClient />;
}
