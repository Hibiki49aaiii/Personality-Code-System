import type { NextRequest } from 'next/server';
import {
  createPublicShareForPrivateResult,
  PublicShareRepositoryError,
  revokePublicSharesForPrivateResult
} from '../../../infrastructure/persistence/publicShareRepository';
import { withPcsDatabase } from '../../../server/assessmentRuntime';
import { getSiteOrigin } from '../../../server/siteOrigin';
import { recordServerProductEventBestEffort } from '../../../server/productAnalytics';
import { applyRateLimit, RateLimitExceededError } from '../../../server/rateLimit';
import {
  getAssessmentToken,
  noStoreJson,
  rateLimitApiResponse
} from '../assessment/_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function shareApiError(error: unknown) {
  if (error instanceof RateLimitExceededError) {
    return rateLimitApiResponse(error);
  }
  if (error instanceof PublicShareRepositoryError) {
    const status = error.code === 'PRIVATE_RESULT_NOT_FOUND' ? 404 : 400;
    return noStoreJson({ error: error.code, message: error.message }, { status });
  }

  console.error('Public share API failure', error);
  return noStoreJson(
    { error: 'INTERNAL_ERROR', message: '共有リンクの処理中にエラーが発生しました。' },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  const privateToken = getAssessmentToken(request);
  if (!privateToken) {
    return noStoreJson(
      { error: 'NO_PRIVATE_RESULT', message: 'このブラウザでは共有元の診断結果を確認できません。' },
      { status: 401 }
    );
  }

  try {
    const created = await withPcsDatabase(async (db) => {
      await applyRateLimit(db, request, 'share-mutation', privateToken);
      const outcome = await createPublicShareForPrivateResult(db, { privateToken });
      await recordServerProductEventBestEffort(db, {
        name: 'share_snapshot_created',
        privateToken,
        properties: {
          shareSchemaVersion: outcome.snapshot.shareSchemaVersion
        }
      });
      return outcome;
    });

    const shareUrl = new URL(`/s/${created.token}`, getSiteOrigin()).toString();
    return noStoreJson({
      shareUrl,
      coreCode: created.snapshot.coreCode,
      shareSchemaVersion: created.snapshot.shareSchemaVersion
    }, { status: 201 });
  } catch (error) {
    return shareApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const privateToken = getAssessmentToken(request);
  if (!privateToken) {
    return noStoreJson(
      { error: 'NO_PRIVATE_RESULT', message: 'このブラウザでは共有元の診断結果を確認できません。' },
      { status: 401 }
    );
  }

  try {
    const result = await withPcsDatabase(async (db) => {
      await applyRateLimit(db, request, 'share-mutation', privateToken);
      return revokePublicSharesForPrivateResult(db, privateToken);
    });
    return noStoreJson(result);
  } catch (error) {
    return shareApiError(error);
  }
}
