// app/(protected)/tracker/page.tsx
// Server component — auth check + metadata only
// All UI lives in client.tsx

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import OnboardingHubClient from './client';

export const metadata = {
  title: 'Onboarding Hub — USG',
};

export default async function OnboardingHubPage() {
  const session = await getSession();
  if (!session) redirect('/');

  // Role guard — only HR and above
  const { role } = session.profile;
  if (!['SUPER_ADMIN', 'HR_OFFICER'].includes(role)) {
    redirect('/dashboard');
  }

  return <OnboardingHubClient />;
}
