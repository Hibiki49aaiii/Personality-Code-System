import type { NextRequest } from 'next/server';
import { savePublicAssessmentAnswer } from '../../../../application/assessment/serverAssessmentService';
import { withPcsDatabase } from '../../../../server/assessmentRuntime';
import { applyRateLimit } from '../../../../server/rateLimit';
import { assessmentApiError, getAssessmentToken, noStoreJson } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  const token = getAssessmentToken(request);
  if (!token) {
    return noStoreJson({ error: 'NO_SESSION', message: '診断セッションがありません。' }, { status: 401 });
  }

  try {
    const body = await request.json() as { itemId?: unknown; value?: unknown };
    if (typeof body.itemId !== 'string' || !Number.isInteger(body.value)) {
      return noStoreJson({ error: 'INVALID_REQUEST', message: '回答データが不正です。' }, { status: 400 });
    }

    const itemId = body.itemId;
    const value = body.value as number;
    await withPcsDatabase(async (db) => {
      await applyRateLimit(db, request, 'assessment-answer', token);
      await savePublicAssessmentAnswer(db, { token, itemId, value });
    });
    return noStoreJson({ ok: true });
  } catch (error) {
    return assessmentApiError(error);
  }
}
