import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withPcsDatabase } from '../../../server/assessmentRuntime';
import { logPrivacySafeServerFault } from '../../../server/privacySafeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function healthJson(
  body: { status: 'ok' | 'degraded' },
  status: number
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}

export async function GET() {
  try {
    await withPcsDatabase(async (db) => {
      await db.execute(sql`select 1 as ready`);
    });
    return healthJson({ status: 'ok' }, 200);
  } catch {
    logPrivacySafeServerFault({ surface: 'health', category: 'readiness' });
    return healthJson({ status: 'degraded' }, 503);
  }
}
