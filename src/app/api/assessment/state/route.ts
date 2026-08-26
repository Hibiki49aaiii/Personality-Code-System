import { NextRequest, NextResponse } from 'next/server';
import { getAnonymousAssessmentState, PersistenceError } from '@/infrastructure/persistence/anonymousAssessmentRepository';
import { getAssessmentDeliveryModel } from '@/infrastructure/persistence/assessmentModelRepository';
import { ASSESSMENT_SESSION_COOKIE } from '@/server/assessmentCookie';
import { withPcsDatabase } from '@/server/assessmentRuntime';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ASSESSMENT_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ code: 'NO_SESSION' }, { status: 401 });
  }

  try {
    return await withPcsDatabase(async (db) => {
      const state = await getAnonymousAssessmentState(db, token);
      if (state.status === 'completed') {
        return NextResponse.json({ status: 'completed' });
      }

      const model = await getAssessmentDeliveryModel(db, {
        modelVersion: state.modelVersion,
        locale: state.locale,
        allowedStatuses: ['beta', 'published']
      });

      return NextResponse.json({
        status: 'in_progress',
        expiresAt: state.expiresAt.toISOString(),
        model,
        answers: Object.fromEntries(state.answers.map((answer) => [answer.itemId, answer.value]))
      });
    });
  } catch (error) {
    if (error instanceof PersistenceError) {
      if (error.code === 'SESSION_NOT_FOUND') {
        return NextResponse.json({ code: 'NO_SESSION' }, { status: 401 });
      }
      if (error.code === 'SESSION_EXPIRED') {
        const response = NextResponse.json({ code: 'SESSION_EXPIRED' }, { status: 410 });
        response.cookies.delete(ASSESSMENT_SESSION_COOKIE);
        return response;
      }
    }
    return NextResponse.json(
      { code: 'ASSESSMENT_STATE_FAILED', message: '診断状態を読み込めませんでした。' },
      { status: 500 }
    );
  }
}
