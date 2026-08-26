export const ASSESSMENT_SESSION_COOKIE = 'pcs_session';

// The bearer token remains useful for retrieving a private completed result after the
// short in-progress write window expires. Final retention/legal policy remains versioned separately.
export const ASSESSMENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export function assessmentCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ASSESSMENT_COOKIE_MAX_AGE_SECONDS
  };
}
