import type { NextRequest } from 'next/server';
import {
  getPublicAssessmentState,
  startOrResumeAnonymousAssessment
} from '../../../../application/assessment/serverAssessmentService';
import { withPcsDatabase } from '../../../../server/assessmentRuntime';
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
    const state = await withPcsDatabase((db) => getPublicAssessmentState(db, token));
    return noStoreJson(state);
  } catch (error) {
    return assessmentApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const resumed = await withPcsDatabase((db) =>
      startOrResumeAnonymousAssessment(db, getAssessmentToken(request))
    );
    const response = noStoreJson(resumed.state, { status: resumed.created ? 201 : 200 });
    setAssessmentSessionCookie(response, resumed.token);
    return response;
  } catch (error) {
    return assessmentApiError(error);
  }
}
