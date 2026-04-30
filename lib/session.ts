// ============================================================
// lib/session.ts — Server-side session helpers (HTTP-only JWT cookie)
// ============================================================
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserProfile } from '@/types';

const COOKIE_NAME = 'usg_session';
const SECRET      = new TextEncoder().encode(process.env.JWT_SECRET ?? 'change-me-in-production');
const EIGHT_HOURS = 60 * 60 * 8;

export interface SessionPayload {
  gasToken: string;
  profile:  UserProfile;
}

/** Sign a JWT containing the GAS token + user profile */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET);
}

/** Read + verify the session cookie. Returns null if missing/expired. */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    const { payload } = await jwtVerify(raw, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Just the GAS token (most API routes only need this) */
export async function getGasToken(): Promise<string | null> {
  const session = await getSession();
  return session?.gasToken ?? null;
}

/** Cookie options — reused by login + logout routes */
export const sessionCookieOptions = {
  name:     COOKIE_NAME,
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path:     '/',
  maxAge:   EIGHT_HOURS,
};
