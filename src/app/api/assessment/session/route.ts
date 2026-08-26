import type { NextRequest } from 'next/server';
import { getServerPcsDatabase } from '../../../../infrastructure/persistence/serverDatabase';
import {
  getPublicAssessmentState,
  startOrResumeAnonymousAssessment
} from '../../../../application/assessment/serverAssessmentService';
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
    const state = await getPublicAssessmentState(getServerPcsDatabase(), token);
    return noStoreJson(state);
  } catch (error) {
    return assessmentApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const resumed = await startOrResumeAnonymousAssessment(
      getServerPcsDatabase(),
      getAssessmentToken(request)
    );
    const response = noStoreJson(resumed.state, { status: resumed.created ? 201 : 200 });
    setAssessmentSessionCookie(response, resumed.token, resumed.expiresAt);
    return response;
  } catch (error) {
    return assessmentApiError(error);
  }
}
