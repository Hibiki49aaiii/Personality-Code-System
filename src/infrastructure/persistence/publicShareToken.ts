import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_BYTES = 32;
const TOKEN_LENGTH = 43;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface PublicShareCredential {
  token: string;
  tokenHashHex: string;
}

export function hashPublicShareToken(token: string): string {
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error('Invalid public share token format');
  }
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createPublicShareCredential(): PublicShareCredential {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  if (token.length !== TOKEN_LENGTH || !TOKEN_PATTERN.test(token)) {
    throw new Error('Failed to generate canonical public share token');
  }
  return { token, tokenHashHex: hashPublicShareToken(token) };
}

export function publicShareTokenMatchesHash(token: string, expectedHashHex: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(expectedHashHex)) return false;
  let actual: Buffer;
  try {
    actual = Buffer.from(hashPublicShareToken(token), 'hex');
  } catch {
    return false;
  }
  const expected = Buffer.from(expectedHashHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
