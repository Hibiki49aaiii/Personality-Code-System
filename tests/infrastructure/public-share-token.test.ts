import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPublicShareCredential,
  hashPublicShareToken,
  publicShareTokenMatchesHash
} from '../../src/infrastructure/persistence/publicShareToken';

test('public share credential is a 256-bit opaque token with hash-only storage value', () => {
  const credential = createPublicShareCredential();

  assert.match(credential.token, /^[A-Za-z0-9_-]{43}$/);
  assert.match(credential.tokenHashHex, /^[a-f0-9]{64}$/);
  assert.notEqual(credential.token, credential.tokenHashHex);
  assert.equal(hashPublicShareToken(credential.token), credential.tokenHashHex);
  assert.equal(publicShareTokenMatchesHash(credential.token, credential.tokenHashHex), true);
  assert.equal(publicShareTokenMatchesHash('x'.repeat(43), credential.tokenHashHex), false);
  assert.equal(publicShareTokenMatchesHash('not-canonical', credential.tokenHashHex), false);
});
