// app/api/run/route.ts — Universal GAS proxy for all authenticated calls
// Frontend: POST { fn: string, args: unknown[] }
// This route: validates JWT → extracts GAS token → forwards to GAS runProtected
import { NextResponse } from 'next/server';
import { getGasToken } from '@/lib/session';
import { gasRun } from '@/lib/gas';

// Increase timeout — Google Sheets can be slow
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. Verify session (middleware already checked the cookie, but double-check)
    const gasToken = await getGasToken();
    if (!gasToken) {
      return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
    }

    // 2. Parse request
    const { fn, args = [] } = await req.json();
    if (!fn || typeof fn !== 'string') {
      return NextResponse.json({ error: 'fn is required' }, { status: 400 });
    }

    // 3. Forward to GAS
    const result = await gasRun(gasToken, fn, args);

    // 4. Map GAS errors to HTTP status codes
    if (!result.success) {
      const status =
        result.error?.includes('ACCESS_DENIED')   ? 403 :
        result.error?.includes('SESSION_EXPIRED')  ? 401 :
        result.error?.includes('not found')        ? 404 :
        400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);

  } catch (err) {
    console.error('[/api/run]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
