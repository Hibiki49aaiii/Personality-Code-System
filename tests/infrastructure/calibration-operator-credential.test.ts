import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calibrationOperatorTokenMatchesHash,
  createCalibrationOperatorCredential,
  hashCalibrationOperatorToken
} from '../../src/infrastructure/persistence/calibrationOperatorCredential';

test('creates canonical 256-bit calibration operator credentials and hash-only identity', () => {
  const credential=createCalibrationOperatorCredential();
  assert.match(credential.token,/^[A-Za-z0-9_-]{43}$/);
  assert.match(credential.tokenHashHex,/^[a-f0-9]{64}$/);
  assert.equal(hashCalibrationOperatorToken(credential.token),credential.tokenHashHex);
  assert.equal(calibrationOperatorTokenMatchesHash(credential.token,credential.tokenHashHex),true);
});

test('rejects malformed operator tokens and mismatched hashes', () => {
  assert.throws(()=>hashCalibrationOperatorToken('short'),/Invalid calibration operator token format/);
  const first=createCalibrationOperatorCredential();
  const second=createCalibrationOperatorCredential();
  assert.equal(calibrationOperatorTokenMatchesHash(first.token,second.tokenHashHex),false);
  assert.equal(calibrationOperatorTokenMatchesHash(first.token,'not-a-hash'),false);
});
