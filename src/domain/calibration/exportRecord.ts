export const CALIBRATION_EXPORT_SCHEMA_VERSION = 'calibration-export-record-v0.1-dev' as const;

export interface CalibrationExportResponseV01 {
  itemId: string;
  itemRevision: string;
  value: number;
}

export interface CalibrationExportRecordV01 {
  schemaVersion: typeof CALIBRATION_EXPORT_SCHEMA_VERSION;
  calibrationRecordId: string;
  waveId: string;
  consentVersion: string;
  purposeId: string;
  assessmentModelVersion: string;
  itemBankVersion: string;
  scoringVersion: string;
  traitDictionaryVersion: string;
  locale: string;
  responses: CalibrationExportResponseV01[];
}

export class CalibrationExportRecordValidationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'CalibrationExportRecordValidationError';
  }
}

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
  'responses'
]);

const RESPONSE_KEYS = new Set(['itemId','itemRevision','value']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDENT_RE = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,119}$/;

function assertPlainObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CalibrationExportRecordValidationError('INVALID_OBJECT', `${label} must be a plain object`);
  }
}

function assertExactKeys(value: Record<string, unknown>, allowed: Set<string>, label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new CalibrationExportRecordValidationError('UNKNOWN_FIELD', `${label} contains unsupported field ${key}`);
    }
  }
  for (const key of allowed) {
    if (!(key in value)) {
      throw new CalibrationExportRecordValidationError('MISSING_FIELD', `${label} is missing ${key}`);
    }
  }
}

function requireIdentifier(value: unknown, field: string): string {
  if (typeof value !== 'string' || !IDENT_RE.test(value)) {
    throw new CalibrationExportRecordValidationError('INVALID_IDENTIFIER', `${field} is invalid`);
  }
  return value;
}

export function validateCalibrationExportRecordV01(value: unknown): CalibrationExportRecordV01 {
  assertPlainObject(value, 'calibration export record');
  assertExactKeys(value, TOP_LEVEL_KEYS, 'calibration export record');

  if (value.schemaVersion !== CALIBRATION_EXPORT_SCHEMA_VERSION) {
    throw new CalibrationExportRecordValidationError('SCHEMA_VERSION_MISMATCH', 'unsupported calibration export schema version');
  }
  if (typeof value.calibrationRecordId !== 'string' || !UUID_RE.test(value.calibrationRecordId)) {
    throw new CalibrationExportRecordValidationError('INVALID_RECORD_ID', 'calibrationRecordId must be a UUID unrelated to bearer/share capabilities');
  }

  const waveId = requireIdentifier(value.waveId, 'waveId');
  const consentVersion = requireIdentifier(value.consentVersion, 'consentVersion');
  const purposeId = requireIdentifier(value.purposeId, 'purposeId');
  const assessmentModelVersion = requireIdentifier(value.assessmentModelVersion, 'assessmentModelVersion');
  const itemBankVersion = requireIdentifier(value.itemBankVersion, 'itemBankVersion');
  const scoringVersion = requireIdentifier(value.scoringVersion, 'scoringVersion');
  const traitDictionaryVersion = requireIdentifier(value.traitDictionaryVersion, 'traitDictionaryVersion');
  const locale = requireIdentifier(value.locale, 'locale');

  if (!Array.isArray(value.responses) || value.responses.length === 0 || value.responses.length > 500) {
    throw new CalibrationExportRecordValidationError('INVALID_RESPONSES', 'responses must contain 1..500 item responses');
  }

  const seen = new Set<string>();
  const responses = value.responses.map((entry, index): CalibrationExportResponseV01 => {
    assertPlainObject(entry, `responses[${index}]`);
    assertExactKeys(entry, RESPONSE_KEYS, `responses[${index}]`);
    const itemId = requireIdentifier(entry.itemId, `responses[${index}].itemId`);
    const itemRevision = requireIdentifier(entry.itemRevision, `responses[${index}].itemRevision`);
    if (!Number.isInteger(entry.value) || (entry.value as number) < 1 || (entry.value as number) > 5) {
      throw new CalibrationExportRecordValidationError('INVALID_RESPONSE_VALUE', `responses[${index}].value must be integer 1..5`);
    }
    const identity = `${itemId}@@${itemRevision}`;
    if (seen.has(identity)) {
      throw new CalibrationExportRecordValidationError('DUPLICATE_RESPONSE', `duplicate item/revision ${identity}`);
    }
    seen.add(identity);
    return { itemId, itemRevision, value: entry.value as number };
  });

  return {
    schemaVersion: CALIBRATION_EXPORT_SCHEMA_VERSION,
    calibrationRecordId: value.calibrationRecordId,
    waveId,
    consentVersion,
    purposeId,
    assessmentModelVersion,
    itemBankVersion,
    scoringVersion,
    traitDictionaryVersion,
    locale,
    responses
  };
}

export interface CalibrationExportManifestV01 {
  exportSchemaVersion: typeof CALIBRATION_EXPORT_SCHEMA_VERSION;
  waveId: string;
  consentVersion: string;
  purposeId: string;
  assessmentModelVersion: string;
  itemBankVersion: string;
  scoringVersion: string;
  traitDictionaryVersion: string;
  locale: string;
  rowCount: number;
}

const EXPORT_SCOPE_KEYS = [
  'waveId',
  'consentVersion',
  'purposeId',
  'assessmentModelVersion',
  'itemBankVersion',
  'scoringVersion',
  'traitDictionaryVersion',
  'locale'
] as const;

export function buildCalibrationExportManifestV01(
  values: readonly unknown[]
): CalibrationExportManifestV01 {
  if (values.length === 0) {
    throw new CalibrationExportRecordValidationError(
      'EMPTY_EXPORT',
      'calibration export manifest requires at least one validated record'
    );
  }

  const records = values.map((value) => validateCalibrationExportRecordV01(value));
  const first = records[0];

  for (let index = 1; index < records.length; index += 1) {
    const record = records[index];
    for (const key of EXPORT_SCOPE_KEYS) {
      if (record[key] !== first[key]) {
        throw new CalibrationExportRecordValidationError(
          'MIXED_EXPORT_SCOPE',
          `record ${index} differs on export scope field ${key}`
        );
      }
    }
  }

  return {
    exportSchemaVersion: CALIBRATION_EXPORT_SCHEMA_VERSION,
    waveId: first.waveId,
    consentVersion: first.consentVersion,
    purposeId: first.purposeId,
    assessmentModelVersion: first.assessmentModelVersion,
    itemBankVersion: first.itemBankVersion,
    scoringVersion: first.scoringVersion,
    traitDictionaryVersion: first.traitDictionaryVersion,
    locale: first.locale,
    rowCount: records.length
  };
}

export interface CalibrationExpectedItemV01 {
  itemId: string;
  itemRevision: string;
  required: boolean;
}

export function validateCalibrationRecordAgainstExpectedItemsV01(
  value: unknown,
  expectedItems: readonly CalibrationExpectedItemV01[]
): CalibrationExportRecordV01 {
  const record = validateCalibrationExportRecordV01(value);

  if (expectedItems.length === 0) {
    throw new CalibrationExportRecordValidationError(
      'EMPTY_EXPECTED_ITEM_SET',
      'wave/model expected item set must not be empty'
    );
  }

  const expected = new Map<string, CalibrationExpectedItemV01>();
  for (const item of expectedItems) {
    const itemId = requireIdentifier(item.itemId, 'expectedItems.itemId');
    const itemRevision = requireIdentifier(item.itemRevision, 'expectedItems.itemRevision');
    const identity = `${itemId}@@${itemRevision}`;
    if (expected.has(identity)) {
      throw new CalibrationExportRecordValidationError(
        'DUPLICATE_EXPECTED_ITEM',
        `duplicate expected item/revision ${identity}`
      );
    }
    expected.set(identity, { itemId, itemRevision, required: item.required === true });
  }

  const observed = new Set<string>();
  for (const response of record.responses) {
    const identity = `${response.itemId}@@${response.itemRevision}`;
    if (!expected.has(identity)) {
      throw new CalibrationExportRecordValidationError(
        'OFF_MODEL_RESPONSE',
        `response ${identity} is not part of the frozen wave/model item set`
      );
    }
    observed.add(identity);
  }

  for (const [identity,item] of expected) {
    if (item.required && !observed.has(identity)) {
      throw new CalibrationExportRecordValidationError(
        'MISSING_REQUIRED_RESPONSE',
        `required wave/model response missing for ${identity}`
      );
    }
  }

  return record;
}
