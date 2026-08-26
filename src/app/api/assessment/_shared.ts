import { NextResponse, type NextRequest } from 'next/server';
import { PersistenceError } from '../../../infrastructure/persistence/anonymousAssessmentRepository';
import { AssessmentModelRepositoryError } from '../../../infrastructure/persistence/assessmentModelRepository';
import { ContentRepositoryError } from '../../../infrastructure/persistence/contentRepository';
import {
  ASSESSMENT_SESSION_COOKIE,
  assessmentCookieOptions
} from '../../../server/assessmentCookie';

export { ASSESSMENT_SESSION_COOKIE };

export function getAssessmentToken(request: NextRequest): string | undefined {
  const value = request.cookies.get(ASSESSMENT_SESSION_COOKIE)?.value;
  return value?.trim() || undefined;
}

export function setAssessmentSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(ASSESSMENT_SESSION_COOKIE, token, assessmentCookieOptions());
}

export function clearAssessmentSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ASSESSMENT_SESSION_COOKIE,
    value: '',
    ...assessmentCookieOptions(),
    expires: new Date(0),
    maxAge: 0
  });
}

export function noStoreJson(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

export function assessmentApiError(error: unknown): NextResponse {
  if (error instanceof PersistenceError) {
    const status =
      error.code === 'SESSION_NOT_FOUND' ? 401 :
      error.code === 'SESSION_EXPIRED' ? 410 :
      error.code === 'SESSION_NOT_WRITABLE' ? 409 :
      error.code === 'MODEL_NOT_AVAILABLE' ? 503 : 400;
    const response = noStoreJson({ error: error.code, message: error.message }, { status });
    if (error.code === 'SESSION_NOT_FOUND' || error.code === 'SESSION_EXPIRED') {
      clearAssessmentSessionCookie(response);
    }
    return response;
  }

  if (error instanceof AssessmentModelRepositoryError || error instanceof ContentRepositoryError) {
    return noStoreJson(
      { error: error.code, message: 'Versioned assessment model is temporarily unavailable.' },
      { status: 503 }
    );
  }

  console.error('Assessment API failure', error);
  return noStoreJson(
    { error: 'INTERNAL_ERROR', message: '診断処理中にエラーが発生しました。' },
    { status: 500 }
  );
}
