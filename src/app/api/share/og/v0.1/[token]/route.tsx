import {
  renderShareImage,
  unavailableShareImage
} from '../../../_image';
import { getPublicShareByToken } from '../../../../../../infrastructure/persistence/publicShareRepository';
import { withPcsDatabase } from '../../../../../../server/assessmentRuntime';
import { logPrivacySafeServerFault } from '../../../../../../server/privacySafeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const result = await withPcsDatabase((db) => getPublicShareByToken(db, token));
    if (!result) return unavailableShareImage('og');
    return renderShareImage(result.snapshot, 'og');
  } catch (error) {
    logPrivacySafeServerFault({ surface: 'public-share', category: 'render' });
    return unavailableShareImage('og');
  }
}
