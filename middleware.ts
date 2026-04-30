// ============================================================
// middleware.ts — Runs on every request BEFORE the page renders
// Redirects unauthenticated users to /  (login page)
// ============================================================
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET      = new TextEncoder().encode(process.env.JWT_SECRET ?? 'change-me-in-production');
const PUBLIC_PATHS = ['/', '/api/auth/login', '/api/public'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through without auth check
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Check session cookie
  const token = req.cookies.get('usg_session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    // Token expired or invalid — clear cookie and redirect to login
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.delete('usg_session');
    return res;
  }
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
