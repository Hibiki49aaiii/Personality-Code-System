import test from 'node:test';
import assert from 'node:assert/strict';
import {
  anonymousSessionTokenMatchesHash,
  createAnonymousSessionCredential,
  hashAnonymousSessionToken
} from '../../src/infrastructure/persistence/sessionToken';

test('anonymous session credential uses opaque 256-bit base64url token and 64-char hash', () => {
  const credential = createAnonymousSessionCredential();
  assert.match(credential.token, /^[A-Za-z0-9_-]{43}$/);
  assert.match(credential.tokenHashHex, /^[a-f0-9]{64}$/);
  assert.equal(credential.tokenHashHex, hashAnonymousSessionToken(credential.token));
});

test('generated anonymous session tokens are non-deterministic', () => {
  const a = createAnonymousSessionCredential();
  const b = createAnonymousSessionCredential();
  assert.notEqual(a.token, b.token);
  assert.notEqual(a.tokenHashHex, b.tokenHashHex);
});

test('token verification is exact and malformed input fails closed', () => {
  const credential = createAnonymousSessionCredential();
  assert.equal(anonymousSessionTokenMatchesHash(credential.token, credential.tokenHashHex), true);
  const other = createAnonymousSessionCredential();
  assert.equal(anonymousSessionTokenMatchesHash(other.token, credential.tokenHashHex), false);
  assert.equal(anonymousSessionTokenMatchesHash('not-a-valid-token', credential.tokenHashHex), false);
  assert.equal(anonymousSessionTokenMatchesHash(credential.token, 'not-a-valid-hash'), false);
});
