import { NextResponse } from 'next/server';
import { createAnonymousAssessmentSession } from '@/infrastructure/persistence/anonymousAssessmentRepository';
import {
  DEVELOPMENT_ASSESSMENT_LOCALE,
  DEVELOPMENT_ASSESSMENT_MODEL_VERSION,
  withPcsDatabase
} from '@/server/assessmentRuntime';
import { ASSESSMENT_SESSION_COOKIE, assessmentCookieOptions } from '@/server/assessmentCookie';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await withPcsDatabase((db) =>
      createAnonymousAssessmentSession(db, {
        modelVersion: process.env.PCS_ASSESSMENT_MODEL_VERSION ?? DEVELOPMENT_ASSESSMENT_MODEL_VERSION,
        locale: DEVELOPMENT_ASSESSMENT_LOCALE,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        allowedModelStatuses: ['beta', 'published']
      })
    );

    const response = NextResponse.json({
      status: 'in_progress',
      expiresAt: session.expiresAt.toISOString()
    });
    response.cookies.set(ASSESSMENT_SESSION_COOKIE, session.token, assessmentCookieOptions());
    return response;
  } catch {
    return NextResponse.json(
      { code: 'ASSESSMENT_START_FAILED', message: '診断を開始できませんでした。' },
      { status: 503 }
    );
  }
}
