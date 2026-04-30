// ============================================================
// lib/gas.ts — Server-side only. Called from /app/api/* routes.
// Never import this in client components.
// ============================================================
import type { GasResponse } from '@/types';

const GAS_URL = process.env.GAS_URL;

if (!GAS_URL) {
  // Warn at startup — won't throw during build, only at runtime
  console.warn('[gas.ts] GAS_URL environment variable is not set');
}

/** Raw POST to GAS — used by all API routes */
export async function gasPost<T = unknown>(body: object): Promise<GasResponse<T>> {
  if (!GAS_URL) throw new Error('GAS_URL is not configured');

  const res = await fetch(GAS_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    // Disable Next.js fetch cache — GAS data is always live
    cache:   'no-store',
  });

  if (!res.ok) {
    throw new Error(`GAS returned HTTP ${res.status}`);
  }

  return res.json() as Promise<GasResponse<T>>;
}

/** Call any function inside GAS runProtected dispatcher */
export async function gasRun<T = unknown>(
  gasToken: string,
  fn:       string,
  args:     unknown[] = []
): Promise<GasResponse<T>> {
  return gasPost<T>({ action: 'run', token: gasToken, fn, args });
}
