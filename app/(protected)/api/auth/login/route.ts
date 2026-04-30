// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { gasPost } from '@/lib/gas';
import { signSession, sessionCookieOptions } from '@/lib/session';
import type { UserProfile } from '@/types';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Call GAS login — returns { success, token, profile }
    const gas = await gasPost<{ token: string; profile: UserProfile }>({
      action: 'login',
      email,
      password,
    });

    if (!gas.success || !gas.token) {
      return NextResponse.json({ error: gas.error ?? 'Invalid credentials' }, { status: 401 });
    }

    // Issue our own JWT containing the GAS token + profile
    const jwt = await signSession({ gasToken: gas.token, profile: gas.profile! });

    const res = NextResponse.json({ success: true, profile: gas.profile });
    res.cookies.set({ ...sessionCookieOptions, value: jwt });
    return res;

  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
