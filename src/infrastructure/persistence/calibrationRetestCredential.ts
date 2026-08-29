import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const CALIBRATION_RETEST_TOKEN_BYTES = 32;
export const CALIBRATION_RETEST_TOKEN_LENGTH = 43;
export const CALIBRATION_RETEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface CalibrationRetestCredential {
  token: string;
  tokenHashHex: string;
}

export function hashCalibrationRetestToken(token: string): string {
  if (!CALIBRATION_RETEST_TOKEN_PATTERN.test(token)) {
    throw new Error('Invalid calibration retest token format');
  }
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createCalibrationRetestCredential(): CalibrationRetestCredential {
  const token = randomBytes(CALIBRATION_RETEST_TOKEN_BYTES).toString('base64url');
  if (
    token.length !== CALIBRATION_RETEST_TOKEN_LENGTH
    || !CALIBRATION_RETEST_TOKEN_PATTERN.test(token)
  ) {
    throw new Error('Failed to generate canonical calibration retest token');
  }

  return {
    token,
    tokenHashHex: hashCalibrationRetestToken(token)
  };
}

export function calibrationRetestTokenMatchesHash(
  token: string,
  expectedHashHex: string
): boolean {
  if (!/^[a-f0-9]{64}$/.test(expectedHashHex)) return false;

  let actual: Buffer;
  try {
    actual = Buffer.from(hashCalibrationRetestToken(token), 'hex');
  } catch {
    return false;
  }

  const expected = Buffer.from(expectedHashHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
