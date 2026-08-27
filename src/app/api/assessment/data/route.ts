import type { NextRequest } from 'next/server';
import {
  AnonymousDataDeletionError,
  deleteAnonymousAssessmentDataByToken
} from '../../../../infrastructure/persistence/anonymousDataDeletionRepository';
import { withPcsDatabase } from '../../../../server/assessmentRuntime';
import { applyRateLimit, RateLimitExceededError } from '../../../../server/rateLimit';
import {
  assertTrustedMutationRequest,
  CrossSiteMutationError
} from '../../../../server/requestSecurity';
import {
  clearAssessmentSessionCookie,
  getAssessmentToken,
  noStoreJson,
  rateLimitApiResponse
} from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deletionError(error: unknown) {
  if (error instanceof CrossSiteMutationError) {
    return noStoreJson(
      { error: 'CROSS_SITE_MUTATION_REJECTED', message: 'この操作は同一サイトから実行してください。' },
      { status: 403 }
    );
  }
  if (error instanceof RateLimitExceededError) {
    return rateLimitApiResponse(error);
  }
  if (error instanceof AnonymousDataDeletionError) {
    const response = noStoreJson(
      { error: error.code, message: '削除対象の診断セッションを確認できません。' },
      { status: 401 }
    );
    clearAssessmentSessionCookie(response);
    return response;
  }

  console.error('Anonymous assessment data deletion failure', error);
  return noStoreJson(
    { error: 'INTERNAL_ERROR', message: '診断データを削除できませんでした。' },
    { status: 500 }
  );
}

export async function DELETE(request: NextRequest) {
  const privateToken = getAssessmentToken(request);
  if (!privateToken) {
    const response = noStoreJson(
      { error: 'NO_SESSION', message: '削除対象の診断セッションを確認できません。' },
      { status: 401 }
    );
    clearAssessmentSessionCookie(response);
    return response;
  }

  try {
    assertTrustedMutationRequest(request);
    const result = await withPcsDatabase(async (db) => {
      await applyRateLimit(db, request, 'data-deletion', privateToken);
      return deleteAnonymousAssessmentDataByToken(db, privateToken);
    });

    const response = noStoreJson({
      deleted: true,
      deletedPublicShareCount: result.deletedPublicShareCount,
      hadCompletedResult: result.hadCompletedResult
    });
    clearAssessmentSessionCookie(response);
    return response;
  } catch (error) {
    return deletionError(error);
  }
}
