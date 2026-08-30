import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CALIBRATION_RETEST_TOKEN_LENGTH,
  CALIBRATION_RETEST_TOKEN_PATTERN,
  calibrationRetestTokenMatchesHash,
  createCalibrationRetestCredential,
  hashCalibrationRetestToken
} from '../../src/infrastructure/persistence/calibrationRetestCredential';

test('creates canonical 256-bit base64url retest credential and SHA-256 hash',()=>{
  const credential=createCalibrationRetestCredential();
  assert.equal(credential.token.length,CALIBRATION_RETEST_TOKEN_LENGTH);
  assert.match(credential.token,CALIBRATION_RETEST_TOKEN_PATTERN);
  assert.match(credential.tokenHashHex,/^[a-f0-9]{64}$/);
  assert.equal(hashCalibrationRetestToken(credential.token),credential.tokenHashHex);
  assert.equal(calibrationRetestTokenMatchesHash(credential.token,credential.tokenHashHex),true);
});

test('different retest credentials do not match and malformed tokens fail closed',()=>{
  const a=createCalibrationRetestCredential();
  const b=createCalibrationRetestCredential();
  assert.notEqual(a.token,b.token);
  assert.notEqual(a.tokenHashHex,b.tokenHashHex);
  assert.equal(calibrationRetestTokenMatchesHash(a.token,b.tokenHashHex),false);
  assert.equal(calibrationRetestTokenMatchesHash('not-a-token',a.tokenHashHex),false);
  assert.equal(calibrationRetestTokenMatchesHash(a.token,'z'.repeat(64)),false);
  assert.throws(()=>hashCalibrationRetestToken('not-a-token'),/Invalid calibration retest token format/);
});
