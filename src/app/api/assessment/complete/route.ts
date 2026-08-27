import type { NextRequest } from 'next/server';
import { completePublicAssessment } from '../../../../application/assessment/serverAssessmentService';
import { withPcsDatabase } from '../../../../server/assessmentRuntime';
import { recordServerProductEventBestEffort } from '../../../../server/productAnalytics';
import { assessmentApiError, getAssessmentToken, noStoreJson } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = getAssessmentToken(request);
  if (!token) {
    return noStoreJson({ error: 'NO_SESSION', message: '診断セッションがありません。' }, { status: 401 });
  }

  try {
    const completed = await withPcsDatabase(async (db) => {
      const outcome = await completePublicAssessment(db, token);
      if (!outcome.alreadyCompleted) {
        await recordServerProductEventBestEffort(db, {
          name: 'assessment_completed',
          privateToken: token,
          properties: {
            answeredCount: outcome.snapshot.responseQuality.answerCount
          }
        });
      }
      return outcome;
    });
    return noStoreJson({
      ok: true,
      snapshotId: completed.snapshotId,
      alreadyCompleted: completed.alreadyCompleted
    });
  } catch (error) {
    return assessmentApiError(error);
  }
}
