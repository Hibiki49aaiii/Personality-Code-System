import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CALIBRATION_OPERATOR_HASH_PATTERN,
  CALIBRATION_OPERATOR_TOKEN_PATTERN,
  CalibrationOperatorCliError,
  generateCalibrationOperatorCredential,
  hashCalibrationOperatorCredential,
  normalizeRoles,
  parseCalibrationOperatorArgs,
  safeCliErrorCode,
  writeCredentialFileExclusive
} from '../../scripts/lib/calibration-operator-cli.mjs';

test('generates canonical 256-bit base64url credential with SHA-256 identity',()=>{
  const credential=generateCalibrationOperatorCredential();
  assert.match(credential.token,CALIBRATION_OPERATOR_TOKEN_PATTERN);
  assert.match(credential.tokenHashHex,CALIBRATION_OPERATOR_HASH_PATTERN);
  assert.equal(hashCalibrationOperatorCredential(credential.token),credential.tokenHashHex);
  assert.notEqual(credential.token,credential.tokenHashHex);
});

test('normalizes roles and rejects roles outside the fixed governance allowlist',()=>{
  assert.deepEqual(
    normalizeRoles(['calibration-reviewer','calibration-export-requester','calibration-reviewer']),
    ['calibration-export-requester','calibration-reviewer']
  );
  assert.throws(
    ()=>normalizeRoles(['admin']),
    (error)=>error instanceof CalibrationOperatorCliError && error.code==='INVALID_ROLE'
  );
});

test('parses issue/admin commands but forbids raw credential argv',()=>{
  assert.deepEqual(
    parseCalibrationOperatorArgs([
      'issue',
      '--role','calibration-reviewer',
      '--credential-out','/tmp/operator-token'
    ]),
    {
      command:'issue',
      credentialOut:'/tmp/operator-token',
      roles:['calibration-reviewer']
    }
  );

  assert.deepEqual(
    parseCalibrationOperatorArgs([
      'grant-role',
      '--operator-id','123e4567-e89b-42d3-a456-426614174000',
      '--role','calibration-export-requester'
    ]),
    {
      command:'grant-role',
      operatorId:'123e4567-e89b-42d3-a456-426614174000',
      role:'calibration-export-requester'
    }
  );

  assert.throws(
    ()=>parseCalibrationOperatorArgs(['whoami','--token','secret']),
    (error)=>error instanceof CalibrationOperatorCliError
  );
  assert.throws(
    ()=>parseCalibrationOperatorArgs([
      'revoke-credential',
      '--operator-id','123e4567-e89b-42d3-a456-426614174000',
      '--token','secret'
    ]),
    (error)=>error instanceof CalibrationOperatorCliError && error.code==='TOKEN_ARGV_FORBIDDEN'
  );
});

test('writes credential file exclusively with owner-only 0600 mode and refuses overwrite',()=>{
  const dir=mkdtempSync(join(tmpdir(),'pcs-calibration-operator-'));
  const path=join(dir,'credential.txt');
  const credential=generateCalibrationOperatorCredential();

  try {
    writeCredentialFileExclusive(path,credential.token);
    assert.equal(readFileSync(path,'utf8'),`${credential.token}\n`);
    assert.equal(statSync(path).mode & 0o777,0o600);

    assert.throws(
      ()=>writeCredentialFileExclusive(path,generateCalibrationOperatorCredential().token),
      (error)=>error instanceof CalibrationOperatorCliError && error.code==='CREDENTIAL_WRITE_FAILED'
    );

    chmodSync(path,0o600);
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }
});

test('maps unexpected errors to a bounded non-secret error code',()=>{
  assert.equal(
    safeCliErrorCode(new CalibrationOperatorCliError('AUTHENTICATION_FAILED')),
    'AUTHENTICATION_FAILED'
  );
  assert.equal(safeCliErrorCode(new Error('postgres://user:password@host/db')),'OPERATION_FAILED');
});
