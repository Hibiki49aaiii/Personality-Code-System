import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CALIBRATION_RETEST_EXPORT_SCHEMA_VERSION,
  CalibrationRetestExportValidationError,
  buildCalibrationRetestPairV02,
  validateCalibrationRetestExportRecordV02
} from '../../src/domain/calibration/retestExportRecord.ts';

const pairId='123e4567-e89b-42d3-a456-426614174000';
const baselineId='223e4567-e89b-42d3-a456-426614174000';
const retestId='323e4567-e89b-42d3-a456-426614174000';

function record(overrides={}) {
  return {
    schemaVersion:CALIBRATION_RETEST_EXPORT_SCHEMA_VERSION,
    calibrationRecordId:baselineId,
    waveId:'beta-ja-wave-01-draft',
    consentVersion:'calibration-retest-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-retest-v0.1',
    assessmentModelVersion:'assessment-dev-v0.3',
    itemBankVersion:'item-bank-v0.2',
    scoringVersion:'scoring-v0.1-dev',
    traitDictionaryVersion:'trait-dictionary-v0.2',
    locale:'ja-JP',
    measurementOccasion:'baseline',
    retestPairId:pairId,
    responses:[
      {itemId:'PCS-SYS-001',itemRevision:'r1',value:3},
      {itemId:'PCS-VER-001',itemRevision:'r1',value:4}
    ],
    ...overrides
  };
}

test('validates strict candidate retest record without capabilities/contact/derived output',()=>{
  const value=validateCalibrationRetestExportRecordV02(record());
  assert.equal(value.schemaVersion,CALIBRATION_RETEST_EXPORT_SCHEMA_VERSION);
  assert.equal(value.measurementOccasion,'baseline');
  assert.equal(value.retestPairId,pairId);
  assert.equal(value.responses.length,2);
});

test('rejects unknown sensitive/capability fields and malformed pair identity',()=>{
  for(const [field,value] of [
    ['sessionId','private-session'],
    ['accessTokenHash','a'.repeat(64)],
    ['retestClaimToken','secret'],
    ['email','person@example.test'],
    ['coreCode','SVAEND'],
    ['freeText','hello']
  ]) {
    assert.throws(
      ()=>validateCalibrationRetestExportRecordV02({...record(),[field]:value}),
      (error)=>error instanceof CalibrationRetestExportValidationError && error.code==='UNKNOWN_FIELD'
    );
  }

  assert.throws(
    ()=>validateCalibrationRetestExportRecordV02(record({retestPairId:'not-a-uuid'})),
    (error)=>error instanceof CalibrationRetestExportValidationError && error.code==='INVALID_RETEST_PAIR_ID'
  );
});

test('requires exactly one baseline and one retest under one exact scope',()=>{
  const baseline=record();
  const retest=record({
    calibrationRecordId:retestId,
    measurementOccasion:'retest'
  });
  const pair=buildCalibrationRetestPairV02([baseline,retest]);
  assert.equal(pair.retestPairId,pairId);
  assert.equal(pair.baseline.calibrationRecordId,baselineId);
  assert.equal(pair.retest.calibrationRecordId,retestId);

  assert.throws(
    ()=>buildCalibrationRetestPairV02([baseline,record({
      calibrationRecordId:retestId,
      measurementOccasion:'baseline'
    })]),
    (error)=>error instanceof CalibrationRetestExportValidationError && error.code==='PAIR_OCCASIONS'
  );

  assert.throws(
    ()=>buildCalibrationRetestPairV02([baseline,record({
      calibrationRecordId:retestId,
      measurementOccasion:'retest',
      scoringVersion:'scoring-v999'
    })]),
    (error)=>error instanceof CalibrationRetestExportValidationError && error.code==='MIXED_EXPORT_SCOPE'
  );

  assert.throws(
    ()=>buildCalibrationRetestPairV02([baseline,record({
      calibrationRecordId:baselineId,
      measurementOccasion:'retest'
    })]),
    (error)=>error instanceof CalibrationRetestExportValidationError && error.code==='PAIR_RECORD_ID_COLLISION'
  );
});

test('candidate schema stays distinct from v0.1 schema identity',()=>{
  assert.throws(
    ()=>validateCalibrationRetestExportRecordV02(record({
      schemaVersion:'calibration-export-record-v0.1-dev'
    })),
    (error)=>error instanceof CalibrationRetestExportValidationError && error.code==='SCHEMA_VERSION_MISMATCH'
  );
});
