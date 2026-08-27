import type { NextRequest } from 'next/server';
import {
  FirstPartyAnalyticsError,
  recordFirstPartyProductEvent
} from '../../../infrastructure/persistence/analyticsRepository';
import {
  ProductEventValidationError
} from '../../../domain/analytics/productEvent';
import { withPcsDatabase } from '../../../server/assessmentRuntime';
import { applyRateLimit, RateLimitExceededError } from '../../../server/rateLimit';
import { logPrivacySafeServerFault } from '../../../server/privacySafeLog';
import {
  getAssessmentToken,
  noStoreJson,
  rateLimitApiResponse
} from '../assessment/_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: { name?: unknown; properties?: unknown };
  try {
    body = await request.json() as { name?: unknown; properties?: unknown };
  } catch {
    return noStoreJson(
      { error: 'INVALID_REQUEST', message: 'Analytics payload must be JSON.' },
      { status: 400 }
    );
  }

  if (typeof body.name !== 'string' || body.name.length > 64) {
    return noStoreJson(
      { error: 'INVALID_REQUEST', message: 'A valid analytics event name is required.' },
      { status: 400 }
    );
  }

  try {
    const privateToken = getAssessmentToken(request);
    await withPcsDatabase(async (db) => {
      await applyRateLimit(db, request, 'analytics', privateToken);
      await recordFirstPartyProductEvent(db, {
        name: body.name as string,
        source: 'client',
        properties: body.properties,
        privateToken
      });
    });
    return noStoreJson({ ok: true }, { status: 202 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitApiResponse(error);
    }
    if (error instanceof ProductEventValidationError) {
      return noStoreJson(
        { error: error.code, message: 'Analytics event was rejected by the privacy contract.' },
        { status: 400 }
      );
    }
    if (error instanceof FirstPartyAnalyticsError) {
      const status =
        error.code === 'SESSION_REQUIRED' || error.code === 'SESSION_INVALID'
          ? 401
          : 400;
      return noStoreJson(
        { error: error.code, message: 'Analytics event could not be associated with this session.' },
        { status }
      );
    }

    logPrivacySafeServerFault({ surface: 'analytics', category: 'unexpected' });
    return noStoreJson(
      { error: 'INTERNAL_ERROR', message: 'Analytics event could not be recorded.' },
      { status: 500 }
    );
  }
}
