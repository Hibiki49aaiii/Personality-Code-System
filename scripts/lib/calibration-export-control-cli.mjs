import { CalibrationOperatorCliError } from './calibration-operator-cli.mjs';

export const CALIBRATION_EXPORT_REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const CALIBRATION_EXPORT_PURPOSE_CODE_PATTERN=/^[a-z][a-z0-9-]{2,63}$/;

const COMMANDS=new Set(['request','review','approve','reject']);
const FORBIDDEN_SCOPE_ARGS=new Set([
  '--wave-id',
  '--export-schema-version',
  '--consent-version',
  '--assessment-model-version',
  '--item-bank-version',
  '--scoring-version',
  '--trait-dictionary-version',
  '--locale',
  '--scope'
]);

function takeValue(argv,index,flag) {
  const value=argv[index+1];
  if (typeof value!=='string' || value.length===0 || value.startsWith('--')) {
    throw new CalibrationOperatorCliError(
      `MISSING_VALUE_${flag.slice(2).toUpperCase().replaceAll('-','_')}`
    );
  }
  return value;
}

export function validateCalibrationExportRequestId(requestId) {
  if (typeof requestId!=='string' || !CALIBRATION_EXPORT_REQUEST_ID_PATTERN.test(requestId)) {
    throw new CalibrationOperatorCliError('INVALID_REQUEST_ID');
  }
  return requestId.toLowerCase();
}

export function validateCalibrationExportPurposeCode(purposeCode) {
  if (typeof purposeCode!=='string' || !CALIBRATION_EXPORT_PURPOSE_CODE_PATTERN.test(purposeCode)) {
    throw new CalibrationOperatorCliError('INVALID_PURPOSE_CODE');
  }
  return purposeCode;
}

export function parseCalibrationExportControlArgs(argv) {
  if (!Array.isArray(argv) || argv.length===0) {
    throw new CalibrationOperatorCliError('COMMAND_REQUIRED');
  }

  const [command,...rest]=argv;
  if (!COMMANDS.has(command)) {
    throw new CalibrationOperatorCliError('INVALID_COMMAND');
  }

  let purposeCode=null;
  let requestId=null;

  for (let index=0;index<rest.length;index+=1) {
    const arg=rest[index];

    if (arg==='--token' || arg==='--credential' || arg==='--credential-token') {
      throw new CalibrationOperatorCliError('TOKEN_ARGV_FORBIDDEN');
    }
    if (FORBIDDEN_SCOPE_ARGS.has(arg)) {
      throw new CalibrationOperatorCliError('SCOPE_ARGV_FORBIDDEN');
    }
    if (arg==='--purpose-code') {
      if (purposeCode!==null) throw new CalibrationOperatorCliError('DUPLICATE_PURPOSE_CODE');
      purposeCode=validateCalibrationExportPurposeCode(takeValue(rest,index,arg));
      index+=1;
      continue;
    }
    if (arg==='--request-id') {
      if (requestId!==null) throw new CalibrationOperatorCliError('DUPLICATE_REQUEST_ID');
      requestId=validateCalibrationExportRequestId(takeValue(rest,index,arg));
      index+=1;
      continue;
    }
    throw new CalibrationOperatorCliError('UNKNOWN_ARGUMENT');
  }

  if (command==='request') {
    if (!purposeCode) throw new CalibrationOperatorCliError('PURPOSE_CODE_REQUIRED');
    if (requestId!==null) throw new CalibrationOperatorCliError('REQUEST_ID_NOT_ALLOWED');
    return {command,purposeCode};
  }

  if (!requestId) throw new CalibrationOperatorCliError('REQUEST_ID_REQUIRED');
  if (purposeCode!==null) throw new CalibrationOperatorCliError('PURPOSE_CODE_NOT_ALLOWED');
  return {command,requestId};
}

export function buildFrozenCalibrationExportScope({wave,freeze,consent,exportSchema}) {
  const expectedFreezeRef='data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json';

  if (
    wave?.wave_id!=='beta-ja-wave-01-draft'
    || wave?.version_scope_frozen!==true
    || wave?.scope_freeze_ref!==expectedFreezeRef
    || freeze?.scope_freeze_version!=='beta-wave-ja-01-scope-freeze-v0.1-dev'
    || freeze?.status!=='repository-frozen-not-preregistered'
    || freeze?.external_preregistered!==false
  ) {
    throw new CalibrationOperatorCliError('FROZEN_SCOPE_INVALID');
  }

  if (
    wave.collection_enabled!==false
    || wave.export_enabled!==false
    || wave.collection_start_allowed!==false
    || consent?.collection_authorized!==false
    || consent?.export_authorized!==false
    || exportSchema?.runtime_export_enabled!==false
  ) {
    throw new CalibrationOperatorCliError('RUNTIME_EXPORT_STATE_INVALID');
  }

  const measurement=freeze.measurement_scope;
  if (
    wave.version_scope?.assessment_model_version!==measurement?.assessment_model_version
    || wave.version_scope?.item_bank_version!==measurement?.item_bank_version
    || wave.version_scope?.scoring_version!==measurement?.scoring_version
    || wave.version_scope?.trait_dictionary_version!==measurement?.trait_dictionary_version
    || wave.locale!==measurement?.locale
  ) {
    throw new CalibrationOperatorCliError('FROZEN_SCOPE_INVALID');
  }

  if (
    wave.consent_version!==consent?.consent_version
    || wave.purpose_id!==consent?.purpose_id
    || exportSchema?.export_schema_version!=='calibration-export-record-v0.1-dev'
  ) {
    throw new CalibrationOperatorCliError('FROZEN_SCOPE_INVALID');
  }

  return Object.freeze({
    waveId:wave.wave_id,
    exportSchemaVersion:exportSchema.export_schema_version,
    consentVersion:consent.consent_version,
    assessmentModelVersion:measurement.assessment_model_version,
    itemBankVersion:measurement.item_bank_version,
    scoringVersion:measurement.scoring_version,
    traitDictionaryVersion:measurement.trait_dictionary_version,
    locale:measurement.locale
  });
}
