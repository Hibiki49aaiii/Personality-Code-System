import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_BYTES = 32;
const TOKEN_LENGTH = 43;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface CalibrationOperatorCredential {
  token: string;
  tokenHashHex: string;
}

export function hashCalibrationOperatorToken(token: string): string {
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error('Invalid calibration operator token format');
  }
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createCalibrationOperatorCredential(): CalibrationOperatorCredential {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  if (token.length !== TOKEN_LENGTH || !TOKEN_PATTERN.test(token)) {
    throw new Error('Failed to generate canonical calibration operator token');
  }
  return { token, tokenHashHex: hashCalibrationOperatorToken(token) };
}

export function calibrationOperatorTokenMatchesHash(token: string, expectedHashHex: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(expectedHashHex)) return false;
  let actual: Buffer;
  try {
    actual = Buffer.from(hashCalibrationOperatorToken(token), 'hex');
  } catch {
    return false;
  }
  const expected = Buffer.from(expectedHashHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
