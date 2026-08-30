import {
  CALIBRATION_EXPORT_SCHEMA_VERSION,
  type CalibrationExportResponseV01,
  validateCalibrationExportRecordV01
} from './exportRecord';

export const CALIBRATION_RETEST_EXPORT_SCHEMA_VERSION =
  'calibration-export-record-v0.2-retest-dev' as const;

export type CalibrationMeasurementOccasion = 'baseline' | 'retest';

export interface CalibrationRetestExportRecordV02 {
  schemaVersion: typeof CALIBRATION_RETEST_EXPORT_SCHEMA_VERSION;
  calibrationRecordId: string;
  waveId: string;
  consentVersion: string;
  purposeId: string;
  assessmentModelVersion: string;
  itemBankVersion: string;
  scoringVersion: string;
  traitDictionaryVersion: string;
  locale: string;
  measurementOccasion: CalibrationMeasurementOccasion;
  retestPairId: string;
  responses: CalibrationExportResponseV01[];
}

export class CalibrationRetestExportValidationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'CalibrationRetestExportValidationError';
  }
}

const RANDOM_UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FROZEN_RETEST_SCOPE = Object.freeze({
  waveId: 'beta-ja-wave-01-draft',
  assessmentModelVersion: 'assessment-dev-v0.3',
  itemBankVersion: 'item-bank-v0.2',
  scoringVersion: 'scoring-v0.1-dev',
  traitDictionaryVersion: 'trait-dictionary-v0.2',
  locale: 'ja-JP'
});

const TOP_LEVEL_KEYS = new Set([
  'schemaVersion',
  'calibrationRecordId',
  'waveId',
  'consentVersion',
  'purposeId',
  'assessmentModelVersion',
  'itemBankVersion',
  'scoringVersion',
  'traitDictionaryVersion',
  'locale',
  'measurementOccasion',
  'retestPairId',
  'responses'
]);

function assertPlainObject(
  value: unknown,
  label: string
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CalibrationRetestExportValidationError(
      'INVALID_OBJECT',
      `${label} must be a plain object`
    );
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
  label: string
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new CalibrationRetestExportValidationError(
        'UNKNOWN_FIELD',
        `${label} contains unsupported field ${key}`
      );
    }
  }

  for (const key of allowed) {
    if (!(key in value)) {
      throw new CalibrationRetestExportValidationError(
        'MISSING_FIELD',
        `${label} is missing ${key}`
      );
    }
  }
}

function asV01Candidate(value: Record<string, unknown>) {
  return {
    schemaVersion: CALIBRATION_EXPORT_SCHEMA_VERSION,
    calibrationRecordId: value.calibrationRecordId,
    waveId: value.waveId,
    consentVersion: value.consentVersion,
    purposeId: value.purposeId,
    assessmentModelVersion: value.assessmentModelVersion,
    itemBankVersion: value.itemBankVersion,
    scoringVersion: value.scoringVersion,
    traitDictionaryVersion: value.traitDictionaryVersion,
    locale: value.locale,
    responses: value.responses
  };
}

export function validateCalibrationRetestExportRecordV02(
  value: unknown
): CalibrationRetestExportRecordV02 {
  assertPlainObject(value, 'calibration retest export record');
  assertExactKeys(value, TOP_LEVEL_KEYS, 'calibration retest export record');

  if (value.schemaVersion !== CALIBRATION_RETEST_EXPORT_SCHEMA_VERSION) {
    throw new CalibrationRetestExportValidationError(
      'SCHEMA_VERSION_MISMATCH',
      'unsupported calibration retest export schema version'
    );
  }

  if (value.measurementOccasion !== 'baseline' && value.measurementOccasion !== 'retest') {
    throw new CalibrationRetestExportValidationError(
      'INVALID_MEASUREMENT_OCCASION',
      'measurementOccasion must be baseline or retest'
    );
  }

  if (typeof value.retestPairId !== 'string' || !RANDOM_UUID_V4_RE.test(value.retestPairId)) {
    throw new CalibrationRetestExportValidationError(
      'INVALID_RETEST_PAIR_ID',
      'retestPairId must be a random UUIDv4'
    );
  }

  for (const [key, expected] of Object.entries(FROZEN_RETEST_SCOPE)) {
    if (value[key] !== expected) {
      throw new CalibrationRetestExportValidationError(
        'FROZEN_SCOPE_MISMATCH',
        `calibration retest export record is outside frozen Wave JA-01 scope: ${key}`
      );
    }
  }

  const expectedConsent =
    value.measurementOccasion === 'baseline'
      ? {
          consentVersion: 'calibration-consent-ja-v0.1-dev',
          purposeId: 'psychometric-calibration-v0.1'
        }
      : {
          consentVersion: 'calibration-retest-consent-ja-v0.1-dev',
          purposeId: 'psychometric-calibration-retest-v0.1'
        };

  if (
    value.consentVersion !== expectedConsent.consentVersion
    || value.purposeId !== expectedConsent.purposeId
  ) {
    throw new CalibrationRetestExportValidationError(
      'CONSENT_OCCASION_MISMATCH',
      'measurement occasion does not match the required consent/purpose identity'
    );
  }

  let base;
  try {
    base = validateCalibrationExportRecordV01(asV01Candidate(value));
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : 'INVALID_BASE_RECORD';
    throw new CalibrationRetestExportValidationError(
      code,
      error instanceof Error ? error.message : 'invalid base calibration record'
    );
  }

  return {
    ...base,
    schemaVersion: CALIBRATION_RETEST_EXPORT_SCHEMA_VERSION,
    measurementOccasion: value.measurementOccasion,
    retestPairId: value.retestPairId
  };
}

const PAIR_SCOPE_KEYS = [
  'waveId',
  'assessmentModelVersion',
  'itemBankVersion',
  'scoringVersion',
  'traitDictionaryVersion',
  'locale'
] as const;

export interface CalibrationRetestPairV02 {
  retestPairId: string;
  baseline: CalibrationRetestExportRecordV02;
  retest: CalibrationRetestExportRecordV02;
}

export function buildCalibrationRetestPairV02(
  values: readonly unknown[]
): CalibrationRetestPairV02 {
  if (values.length !== 2) {
    throw new CalibrationRetestExportValidationError(
      'PAIR_CARDINALITY',
      'a complete retest pair requires exactly two records'
    );
  }

  const records = values.map((value) => validateCalibrationRetestExportRecordV02(value));
  if (records[0].retestPairId !== records[1].retestPairId) {
    throw new CalibrationRetestExportValidationError(
      'MIXED_RETEST_PAIR',
      'records do not share the same retestPairId'
    );
  }

  const baseline = records.find((record) => record.measurementOccasion === 'baseline');
  const retest = records.find((record) => record.measurementOccasion === 'retest');

  if (!baseline || !retest) {
    throw new CalibrationRetestExportValidationError(
      'PAIR_OCCASIONS',
      'a complete pair requires one baseline and one retest record'
    );
  }

  if (baseline.calibrationRecordId === retest.calibrationRecordId) {
    throw new CalibrationRetestExportValidationError(
      'PAIR_RECORD_ID_COLLISION',
      'baseline and retest calibration record IDs must differ'
    );
  }

  for (const key of PAIR_SCOPE_KEYS) {
    if (baseline[key] !== retest[key]) {
      throw new CalibrationRetestExportValidationError(
        'MIXED_EXPORT_SCOPE',
        `baseline/retest scope differs on ${key}`
      );
    }
  }

  return {
    retestPairId: baseline.retestPairId,
    baseline,
    retest
  };
}
