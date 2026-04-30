// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { getGasToken } from '@/lib/session';
import { gasPost } from '@/lib/gas';

export async function POST() {
  try {
    const gasToken = await getGasToken();
    // Tell GAS to invalidate the server-side session too
    if (gasToken) {
      await gasPost({ action: 'logout', token: gasToken }).catch(() => {});
    }
  } catch { /* ignore */ }

  const res = NextResponse.json({ success: true });
  res.cookies.delete('usg_session');
  return res;
}
