import type { NextRequest } from 'next/server';
import {
  getPublicAssessmentState,
  startOrResumeAnonymousAssessment
} from '../../../../application/assessment/serverAssessmentService';
import { withPcsDatabase } from '../../../../server/assessmentRuntime';
import { recordServerProductEventBestEffort } from '../../../../server/productAnalytics';
import { applyRateLimit } from '../../../../server/rateLimit';
import { assertTrustedMutationRequest } from '../../../../server/requestSecurity';
import {
  assessmentApiError,
  getAssessmentToken,
  noStoreJson,
  setAssessmentSessionCookie
} from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = getAssessmentToken(request);
  if (!token) {
    return noStoreJson({ error: 'NO_SESSION', message: '診断セッションがありません。' }, { status: 401 });
  }

  try {
    const state = await withPcsDatabase(async (db) => {
      const loaded = await getPublicAssessmentState(db, token);
      if (loaded.status === 'in_progress') {
        await recordServerProductEventBestEffort(db, {
          name: 'assessment_resumed',
          privateToken: token,
          properties: { answeredCount: loaded.answers.length }
        });
      }
      return loaded;
    });
    return noStoreJson(state);
  } catch (error) {
    return assessmentApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const resumed = await withPcsDatabase(async (db) => {
      await applyRateLimit(db, request, 'assessment-session-create');
      const outcome = await startOrResumeAnonymousAssessment(db, getAssessmentToken(request));
      await recordServerProductEventBestEffort(db, outcome.created
        ? {
            name: 'assessment_started',
            privateToken: outcome.token,
            properties: {}
          }
        : {
            name: 'assessment_resumed',
            privateToken: outcome.token,
            properties: { answeredCount: outcome.state.answers.length }
          }
      );
      return outcome;
    });
    const response = noStoreJson(resumed.state, { status: resumed.created ? 201 : 200 });
    setAssessmentSessionCookie(response, resumed.token);
    return response;
  } catch (error) {
    return assessmentApiError(error);
  }
}
