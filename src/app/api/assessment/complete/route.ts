import type { NextRequest } from 'next/server';
import { completePublicAssessment } from '../../../../application/assessment/serverAssessmentService';
import { withPcsDatabase } from '../../../../server/assessmentRuntime';
import { assessmentApiError, getAssessmentToken, noStoreJson } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = getAssessmentToken(request);
  if (!token) {
    return noStoreJson({ error: 'NO_SESSION', message: '診断セッションがありません。' }, { status: 401 });
  }

  try {
    const completed = await withPcsDatabase((db) => completePublicAssessment(db, token));
    return noStoreJson({
      ok: true,
      snapshotId: completed.snapshotId,
      alreadyCompleted: completed.alreadyCompleted
    });
  } catch (error) {
    return assessmentApiError(error);
  }
}
