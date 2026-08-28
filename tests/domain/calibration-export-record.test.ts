import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CALIBRATION_EXPORT_SCHEMA_VERSION,
  CalibrationExportRecordValidationError,
  validateCalibrationExportRecordV01
} from '../../src/domain/calibration/exportRecord';

function validRecord() {
  return {
    schemaVersion: CALIBRATION_EXPORT_SCHEMA_VERSION,
    calibrationRecordId: '123e4567-e89b-42d3-a456-426614174000',
    waveId: 'beta-wave-ja-v0.1-dev',
    consentVersion: 'calibration-consent-ja-v0.1-dev',
    purposeId: 'psychometric-calibration-v0.1',
    assessmentModelVersion: 'assessment-dev-v0.3',
    itemBankVersion: 'item-bank-v0.2',
    scoringVersion: 'scoring-v0.1-dev',
    traitDictionaryVersion: 'trait-dictionary-v0.2',
    locale: 'ja-JP',
    responses: [
      { itemId: 'PCS-SYS-001', itemRevision: 'r1', value: 3 },
      { itemId: 'PCS-SYS-002', itemRevision: 'r1', value: 5 }
    ]
  };
}

test('accepts a minimal exact-scope synthetic calibration record', () => {
  assert.deepEqual(validateCalibrationExportRecordV01(validRecord()), validRecord());
});

test('rejects private/session/result fields instead of silently dropping them', () => {
  for (const [field,value] of [
    ['sessionId','00000000-0000-4000-8000-000000000000'],
    ['accessTokenHash','a'.repeat(64)],
    ['coreCode','SVAEND'],
    ['retestLinkId','rlt_future']
  ] as const) {
    assert.throws(
      () => validateCalibrationExportRecordV01({ ...validRecord(), [field]: value }),
      (error: unknown) => error instanceof CalibrationExportRecordValidationError && error.code === 'UNKNOWN_FIELD'
    );
  }
});

test('rejects unknown response fields and invalid response values', () => {
  assert.throws(
    () => validateCalibrationExportRecordV01({
      ...validRecord(),
      responses: [{ itemId: 'PCS-SYS-001', itemRevision: 'r1', value: 3, responseMs: 1200 }]
    }),
    (error: unknown) => error instanceof CalibrationExportRecordValidationError && error.code === 'UNKNOWN_FIELD'
  );
  assert.throws(
    () => validateCalibrationExportRecordV01({
      ...validRecord(),
      responses: [{ itemId: 'PCS-SYS-001', itemRevision: 'r1', value: 6 }]
    }),
    (error: unknown) => error instanceof CalibrationExportRecordValidationError && error.code === 'INVALID_RESPONSE_VALUE'
  );
});

test('rejects duplicate item revisions', () => {
  assert.throws(
    () => validateCalibrationExportRecordV01({
      ...validRecord(),
      responses: [
        { itemId: 'PCS-SYS-001', itemRevision: 'r1', value: 2 },
        { itemId: 'PCS-SYS-001', itemRevision: 'r1', value: 4 }
      ]
    }),
    (error: unknown) => error instanceof CalibrationExportRecordValidationError && error.code === 'DUPLICATE_RESPONSE'
  );
});
