// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { gasPost } from '@/lib/gas';
import { signSession, sessionCookieOptions } from '@/lib/session';
import type { UserProfile } from '@/types';

interface LoginResponse {
  success: boolean;
  token:   string;
  profile: UserProfile;
  error?:  string;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const gas = await gasPost<LoginResponse>({ action: 'login', email, password });

    const result = gas as unknown as LoginResponse;

    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.error ?? 'Invalid credentials' }, { status: 401 });
    }

    const jwt = await signSession({ gasToken: result.token, profile: result.profile });

    const res = NextResponse.json({ success: true, profile: result.profile });
    res.cookies.set({ ...sessionCookieOptions, value: jwt });
    return res;

  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
