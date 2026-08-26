import type { NextRequest } from 'next/server';
import { getPrivateRenderedAssessmentResult } from '../../../../application/assessment/serverAssessmentService';
import { getServerPcsDatabase } from '../../../../infrastructure/persistence/serverDatabase';
import { assessmentApiError, getAssessmentToken, noStoreJson } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = getAssessmentToken(request);
  if (!token) {
    return noStoreJson({ error: 'NO_SESSION', message: '診断結果にアクセスできません。' }, { status: 401 });
  }

  try {
    const result = await getPrivateRenderedAssessmentResult(getServerPcsDatabase(), token);
    if (!result) {
      return noStoreJson({ error: 'RESULT_NOT_FOUND', message: '確定済みの診断結果がありません。' }, { status: 404 });
    }
    return noStoreJson(result);
  } catch (error) {
    return assessmentApiError(error);
  }
}
